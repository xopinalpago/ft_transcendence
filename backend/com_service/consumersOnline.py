import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from com_service.models import ChatGroups
# from django.contrib.auth.models import User
from auth_service.models import Profil
from django.http import JsonResponse
from game_service.models import Tournament
from channels.layers import get_channel_layer
import asyncio
import re

class OnlineConsumer(AsyncWebsocketConsumer):
    group_creation_lock = asyncio.Lock()
    async def connect(self):
        await self.channel_layer.group_add('online_group', self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('tournament_group', self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")
        print("MESSAGE Online = ", message)

        if (message == 'make_group'):
            name = text_data_json.get('name')
            members = text_data_json.get('members')
            groupName = text_data_json.get('groupName')
            group = await self.create_group(name, members, groupName)
            if group == "Wrong_name":
                await self.send(text_data=json.dumps({'content': "Wrong_name"}))
                return
            elif group == "Already_exists":
                await self.send(text_data=json.dumps({'content': "Already_exists"}))
                return
            elif group == "Already_members":
                await self.send(text_data=json.dumps({'content': "Already_members"}))
                return
        elif (message == 'make_group_tournament'):
            group = await self.handle_make_group_tournament(text_data_json)
            if group == False:
                await self.send(text_data=json.dumps({'content': "Already_exists"}))
                return
        await self.send_message_to_all_for_users()
        chat_groups = await self.get_chat_groups()
        await self.send_message_to_all_for_groups(chat_groups)

    async def handle_make_group_tournament(self, text_data_json):
        async with self.group_creation_lock:
            name = text_data_json.get('name')
            groupName = text_data_json.get('groupName')
            group = await self.create_group_tournament(name, groupName)
            return group

    async def send_message_to_all_for_groups(self, chat_groups):
        await self.channel_layer.group_send('online_group', {
            'type': 'group_message',
            'content': 'Get_Group',
            'chat_groups': chat_groups,
        })

    async def group_message(self, event):
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'chat_groups': event['chat_groups'],
        }))

    async def send_message_to_all_for_users(self):
        users = await self.get_users()       
        await self.channel_layer.group_send('online_group', {
            'type': 'user_message',
            'content': 'Get_User',
            'users': users,
        })

    async def user_message(self, event):
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'users': event['users'],
        }))

    def find_group_with_same_members(self, members):
        members_data = []
        for member_data in members:
            user_id = member_data['id']
            try:
                member = Profil.objects.get(user_id=user_id)
                members_data.append(member)
            except Profil.DoesNotExist:
                return None
        all_groups = ChatGroups.objects.all()
        for group in all_groups:
            group_members = group.members.all()
            if set(group_members) == set(members_data):
                return group
        return None

    @database_sync_to_async
    def create_group(self, name, members, groupName):
        if (not re.match("^[a-zA-Z0-9_]+$", groupName)) or (len(groupName) > 30):
            return "Wrong_name"
        existing_group = ChatGroups.objects.filter(group_name=groupName).first()
        if existing_group:
            return "Already_exists"
        if self.find_group_with_same_members(members):
            return "Already_members"
        group = ChatGroups.objects.create(name=name, group_name=groupName)
        for member_data in members:
            user_id = member_data['id']
            member = Profil.objects.get(user_id=user_id)
            group.members.add(member)
        group.save()
        return group
    
    @database_sync_to_async
    def create_group_tournament(self, name, groupName):
        existing_group = ChatGroups.objects.filter(group_name=groupName).first()
        if existing_group:
            ChatGroups.objects.filter(group_name=groupName).delete()
        group = ChatGroups.objects.create(name=name, group_name=groupName)
        tournament = Tournament.objects.filter(name=groupName).first()
        members = tournament.users.all()
        for member_data in members:
            user_id = member_data.user_id
            member = Profil.objects.get(user_id=user_id)
            group.members.add(member)
        group.save()
        return group

    @database_sync_to_async
    def get_chat_groups(self):
        chat_groups = ChatGroups.objects.all()
        data = []
        for group in chat_groups:
            group_data = {
                'name': group.name,
                'members': [member.username for member in group.members.all()],
                'members_id': [member.user_id for member in group.members.all()],
                'members_status': [member.status for member in group.members.all()],                
                'members_avatar': [(member.avatar.url if member.avatar else None) for member in group.members.all()],                
                'group_name': group.group_name,
            }
            data.append(group_data)
        return data

    @database_sync_to_async
    def get_users(self):
        users = Profil.objects.all()
        data = []
        for user in users:
            user_data = {
                'userId': user.user_id,
                'username': user.username,
                'profile': self.serialize_profil(user),
            }
            data.append(user_data)
        return data
    
    def serialize_profil(self, profil):
        if profil:
            return {
                'user_id': profil.user_id,
                'username': profil.username,
                'avatar': profil.avatar.url if profil.avatar else None,
                'bio': profil.bio,
                'status': profil.status,
            }
        return None
