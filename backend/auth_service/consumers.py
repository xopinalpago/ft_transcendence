from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from auth_service.models import Profil, Friend
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore
from asgiref.sync import sync_to_async
import json
from django.db.models import Q


class NotifLogoutConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope['user']
        user = await self.get_user(self.user.id)
        profile = await self.get_profil(user)
        await self.accept()
        await self.change_status_active(self.user)

    async def disconnect(self, close_code):
        await self.change_status_inactive(self.user)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")
        if message == 'signup':
            self.user_group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )

        elif message == 'login':
            await self.change_status_active(self.user)
            await self.channel_layer.group_send(
                f"user_{self.user.id}",
                {
                    'type': 'loggin_message',
                    'message': 'login'
                }
            )
            self.user_group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )

        elif message == 'delete_from_group':
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        
        elif message == 'refresh':
            self.user_group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            await self.channel_layer.group_send(
                f"user_{self.user.id}",
                {
                    'type': 'loggin_message',
                    'message': 'refresh'
                }
            )

        else :
            print("other message : ")
            print(message)

    @database_sync_to_async
    def change_status_inactive(self, user):
        try:
            profile = Profil.objects.get(user=user)
            profile.status = 'inactive'
            profile.in_game = False
            profile.logged_in = False
            profile.save()
        except Profil.DoesNotExist:
            pass

    @database_sync_to_async
    def change_status_active(self, user):
        profile = Profil.objects.get(user=user)
        print("change_status_active")
        if (profile.in_game):
            print("STATUS IN GAME")
            profile.status = 'in_game'
        else:
            profile.status = 'active'
        profile.logged_in = True
        profile.save()

    async def loggin_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def get_profil(self, user):
        return Profil.objects.get(user=user)

class FriendConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        print("room_name = ", self.room_name)

        self.room_group_name = f"friend_{self.room_name}"
        print("room_group_name = ", self.room_group_name)
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'add_message',
                    'message': f'new user in the group {self.room_group_name}',
                }
            )
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")
        room_name = text_data_json.get("room_name")
        user_id = text_data_json.get("user_id")
        selected_user_id = text_data_json.get("selectedUserId")
        
        if message == 'ask_friend':
            my_profile = await self.get_profile(user_id)
            selected_profile = await self.get_profile(selected_user_id)
            await self.create_friend_request(my_profile, selected_profile)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_message',
                    'message': 'ask_friend_send',
                    'user_id': user_id,
                    'selected_user_id': selected_user_id
                }
            )

        elif message == 'accept_friend':
            print("accept_friend")
            my_profile = await self.get_profile(user_id)
            selected_profile = await self.get_profile(selected_user_id)
            await self.accept_friend_request(my_profile, selected_profile)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_message',
                    'message': 'accept_friend',
                    'user_id': user_id,
                    'selected_user_id': selected_user_id
                }
            )

        elif message == 'refuse_friend':
            print("refuse_friend")
            my_profile = await self.get_profile(user_id)
            selected_profile = await self.get_profile(selected_user_id)
            await self.refuse_friend_request(my_profile, selected_profile)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_message',
                    'message': 'refuse_friend',
                    'user_id': user_id,
                    'selected_user_id': selected_user_id
                }
            )
        elif message == 'delete_friend':
            print("delete_friend")
            my_profile = await self.get_profile(user_id)
            selected_profile = await self.get_profile(selected_user_id)
            await self.delete_friend(my_profile, selected_profile)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_message',
                    'message': 'delete_friend',
                    'user_id': user_id,
                    'selected_user_id': selected_user_id
                }
            )

    async def send_message(self, event):
        message = event['message']
        user_id = event['user_id']
        selected_user_id = event['selected_user_id']
        await self.send(text_data=json.dumps({
            'message': message,
            'user_id': user_id,
            'selected_user_id': selected_user_id
        }))

    async def add_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def create_friend_request(self, my_profile, selected_profile):
        relation = Friend.objects.get_or_create(requester=my_profile, receiver=selected_profile, status='pending')
        print(relation)
        
    @database_sync_to_async
    def get_profile(self, id):
        return Profil.objects.get(user_id=id)
    
    @database_sync_to_async
    def accept_friend_request(self, my_profile, selected_profile):
        relation = Friend.objects.get(requester=selected_profile, receiver=my_profile)
        relation.status = 'accepted'
        relation.save()
    
    @database_sync_to_async
    def refuse_friend_request(self, my_profile, selected_profile):
        relation = Friend.objects.get(requester=selected_profile, receiver=my_profile)
        relation.delete()

    @database_sync_to_async
    def delete_friend(self, my_profile, selected_profile):
        relations = Friend.objects.filter(
            Q(requester=my_profile, receiver=selected_profile) |
            Q(requester=selected_profile, receiver=my_profile)
        )
        for relation in relations:
            relation.delete()