import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from com_service.models import Chat, ChatGroups, BlockedUsers
# from django.contrib.auth.models import User
from auth_service.models import Profil
from django.http import JsonResponse
from channels.layers import get_channel_layer
from game_service.models import Tournament, Match
from django.db.models import Q

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        self.room = await self.get_room()
        self.user_id = self.scope['user'].id
        # self.user = await self.get_user(self.user_id)
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        if "ws/chat/" in self.scope.get('path'):
            test = await self.delete_ready()
            if (test):
                await self.send_specific_content("Reload")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")
        blocked_user_id = text_data_json.get("otherUserID")
        is_blocked = await self.is_user_blocked(self.user_id, blocked_user_id)
        blocked_by = await self.is_user_blocked(blocked_user_id, self.user_id)
        if (is_blocked == False and blocked_by == False):
            room = await self.get_room()
            if (text_data_json.get("content") == "bot_message"):
                tournament = await self.get_tournament(room)
                await self.print_message(tournament, room)

            elif (text_data_json.get("content") == "invite_message"):
                userId = text_data_json.get("user_id")
                user = await self.get_user(userId)
                selectedUserId = text_data_json.get("selectedUserId")
                other_user = await self.get_user(selectedUserId)
                username = await self.get_username(userId)
                test = await self.test_already_exists(user, other_user)
                if (test == "Already_exists_in_this_room"):
                    await self.send(text_data=json.dumps({'content': "Already_exists"}))
                elif (test == "Already_exists_in_other_room"):
                    await self.send(text_data=json.dumps({'content': "Already_exists_in_other_room"}))
                elif (test == "Already_in_tournament"):
                    await self.send(text_data=json.dumps({'content': "Already_in_tournament"}))
                else:
                    message = username + ' invite you to play Pong !'
                    chat = Chat(content=message, user=await self.get_user(self.user_id),
                                room=room, is_invitation=True)
                    await database_sync_to_async(chat.save)()
                    await self.send_specific_message("invite_message", message, userId)
            elif (text_data_json.get("content") == "invite_yes"):
                userId = text_data_json.get("user_id")
                selectedUserId = text_data_json.get("selectedUserId")
                username = await self.get_username(userId)
                message = username + ' said yes!'
                other_user = await self.get_user(selectedUserId)
                user = await self.get_user(userId)
                await self.set_is_answered(other_user, True)
                chat = Chat(content=message, user=await self.get_user(self.user_id), room=room)
                await database_sync_to_async(chat.save)()
                await self.create_match(user, other_user)
                await self.send_specific_message("invite_yes", message, userId)
            elif (text_data_json.get("content") == "invite_no"):
                userId = text_data_json.get("user_id")
                selectedUserId = text_data_json.get("selectedUserId")
                username = await self.get_username(userId)
                message = username + ' said no...'
                other_user = await self.get_user(selectedUserId)
                user = await self.get_user(userId)
                await self.set_is_answered(other_user, False)
                chat = Chat(content=message, user=await self.get_user(self.user_id), room=room)
                await database_sync_to_async(chat.save)()
                await self.send_specific_message("invite_no", message, userId)
            elif (text_data_json.get("content") == "is_ready"):
                message = "Are You Ready ?"
                userId = text_data_json.get("user_id")
                selectedUserId = text_data_json.get("selectedUserId")
                user = await self.get_user(userId)
                other_user = await self.get_user(selectedUserId)
                # await self.create_ready_chat(message, user, other_user, room)
                chat = Chat(content=message, user=user, room=room, is_ready_button=True)
                await database_sync_to_async(chat.save)()
                await self.send_specific_message("are_you_ready", message, userId)
                chat = Chat(content=message, user=other_user, room=room, is_ready_button=True)
                await database_sync_to_async(chat.save)()
                await self.send_specific_message("are_you_ready", message, selectedUserId)

            elif (text_data_json.get("content") == "ready"):
                userId = text_data_json.get("user_id")
                user = await self.get_user(userId)
                username = await self.get_username(userId)
                selectedUserId = text_data_json.get("selectedUserId")
                # other_user = await self.get_user(selectedUserId)
                other_username = await self.get_username(selectedUserId)
                match = await self.update_player_state(user)
                if (match != False and match != True):
                    print("Two Players Ready")
                    await self.send_specific_content("Two_Players_Ready")
                elif (match == True):
                    await self.send_specific_content("Ready_alone")
                else:
                    await self.send_specific_content("Ready_Impossible")
            else:
                chat = Chat(content=message, user=await self.get_user(self.user_id), room=room)
                await database_sync_to_async(chat.save)()
                await self.send_message(message)
        elif (blocked_by == True):
            await self.set_is_answered_block()
            await self.set_delete_block()
            if (text_data_json.get("content") == "ready"):
                await self.send_specific_content("Reload")  
            await self.send(text_data=json.dumps({'content': "blocked_by"}))        
        else:
            await self.set_is_answered_block()
            await self.set_delete_block()
            if (text_data_json.get("content") == "ready"):
                await self.send_specific_content("Reload")  
            await self.send(text_data=json.dumps({'content': "is_blocked"}))

    async def send_message(self, message):
        await self.channel_layer.group_send(self.room_group_name, {
                "type": "chat.message",
                "message": message,
                "user_id": self.user_id,
                "username": self.scope['user'].username
            })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "user_id": event["user_id"],
            "username": event["username"],
        }))

    async def send_specific_message(self, content, message, userId):
        await self.channel_layer.group_send(self.room_group_name, {
                "type": "chat.specific",
                "content": content,
                "message": message,
                "user_id": int(userId),
                "username": await self.get_username(userId),
            })

    async def chat_specific(self, event):
        await self.send(text_data=json.dumps({
            "content": event["content"],
            "message": event["message"],
            "user_id": event["user_id"],
            "username": event["username"],
        }))

    async def send_specific_content(self, content):
        await self.channel_layer.group_send(self.room_group_name, {
                "type": "chat.content",
                "content": content,
                "user_id": self.user_id,
                "username": self.scope['user'].username
            })

    async def chat_content(self, event):
        await self.send(text_data=json.dumps({
            "content": event["content"],
            "user_id": event["user_id"],
            "username": event["username"],
        }))

    async def send_disconnected(self):
        await self.channel_layer.group_send(self.room_group_name, {
                "type": "chat.disconnected",
                "content": "disconnected",
            })

    async def chat_disconnected(self, event):
        await self.send(text_data=json.dumps({
            "content": event["content"],
        }))

    @database_sync_to_async
    def update_player_state(self, user):
        match = Match.objects.filter((Q(player1=user) | Q(player2=user)), match_id=self.room_name).first()
        if match:
            if match.player1 == user:
                match.player1_ready = True
            elif match.player2 == user:
                match.player2_ready = True
            match.save()
            if match.winner != None:
                return False        
            if match.winner == None and match.player1_ready and match.player2_ready:
                return match
            return True
        return False
    
    @database_sync_to_async
    def get_tournament(self, tournament_name):
        tournament = Tournament.objects.filter(name=tournament_name).first()
        return tournament

    @database_sync_to_async
    def set_is_answered(self, user, response):
        room = ChatGroups.objects.get(name=self.room_name)
        chat = Chat.objects.filter(is_invitation=True, user=user, room=room).order_by('-timestamp').first()
        if (chat):
            chat.is_answered = True
            chat.answer = response
            chat.save()

    @database_sync_to_async
    def create_match(self, user, other_user):
        match = Match.objects.filter(match_id=self.room_name).first()
        if (match):
            match.delete()
        Match.objects.create(player1=user, player2=other_user, match_id=self.room_name)

    @database_sync_to_async
    def delete_ready(self):
        room = ChatGroups.objects.get(name=self.room_name)
        chat = Chat.objects.filter(is_ready_button=True, room=room).all()
        if (chat):
            chat.delete()
            return True
        return False

    @database_sync_to_async
    def set_is_answered_block(self):
        room = ChatGroups.objects.get(name=self.room_name)
        chats = Chat.objects.filter(room=room)
        for chat in chats:
            chat.is_answered = True
            chat.save()

    @database_sync_to_async
    def set_delete_block(self):
        room = ChatGroups.objects.get(name=self.room_name)
        chats = Chat.objects.filter(is_ready_button=True, room=room)
        for chat in chats:
            chat.delete()

    @database_sync_to_async
    def test_already_exists(self, user, other_user):
        if (user.is_in_tournament or other_user.is_in_tournament):
            return "Already_in_tournament"
        room = ChatGroups.objects.get(name=self.room_name)
        chat = Chat.objects.filter(is_invitation=True, user=user, room=room).order_by('-timestamp').first()
        if (chat):
            if (chat.is_answered == False):
                return "Already_exists_in_this_room"
        chat = Chat.objects.filter(is_invitation=True, user=other_user, room=room).order_by('-timestamp').first()
        if (chat):
            if (chat.is_answered == False):
                return "Already_exists_in_this_room"
        chat = Chat.objects.filter(is_invitation=True, user=user).exclude(room=room).order_by('-timestamp').first()
        if (chat):
            if (chat.is_answered == False):
                return "Already_exists_in_other_room"
        return False
    
    @database_sync_to_async
    def print_message(self, tournament, room):
        matches = Match.objects.filter(tournament=tournament, nb_round=tournament.round_number)
        for match in matches:
            message = f'{match.player1.username} plays against {match.player2.username}'
            chat = Chat(content=message, room=room, is_message_bot=True, player1_id=match.player1.user_id, player2_id=match.player2.user_id, match=match)
            chat.save()
            self.send_message(message)

    @database_sync_to_async
    def get_room(self):
        room = ChatGroups.objects.filter(name=self.room_name).first()
        return room

    @database_sync_to_async
    def get_username(self, userId):
        user = Profil.objects.filter(user_id=userId).first()
        return user.username

    @database_sync_to_async
    def get_user_from_scope(self, scope):
        user = None
        if scope["user"].is_authenticated:
            user = Profil.objects.get(user_id=scope["user"].id)
        return user

    @database_sync_to_async
    def get_user(self, userId):
        user = Profil.objects.filter(user_id=userId).first()
        return user
    
    @database_sync_to_async
    def is_user_blocked(self, user_id, blocked_user_id):
        # Check if the sender is blocked by the recipient
        return BlockedUsers.objects.filter(user=user_id, blocked_user=blocked_user_id).exists()

class BlockedUserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['user'].id
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name.replace('/', '-')}"  # Remplacer '/' par '-'
        # Rejoindre le groupe de la salle
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Quitter le groupe de la salle
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        # print("data['user_id']", data['user_id'])
        # print("data['blocked_user_id']", data['blocked_user_id'])
        
        if data['type'] == 'block_user':
            self.test = await self.set_delete_block(data.get('roomName_real'))
            await self.block_user(data['user_id'], data['blocked_user_id'])
        elif data['type'] == 'unblock_user':
            self.test = await self.set_delete_block(data.get('roomName_real'))
            await self.unblock_user(data['user_id'], data['blocked_user_id'])

    async def block_user(self, user_id, blocked_user_id):
        # Mettre à jour la base de données pour bloquer l'utilisateur
        await database_sync_to_async(BlockedUsers.objects.create)(user_id=user_id, blocked_user_id=blocked_user_id)
        await self.send_block_notification()

    async def unblock_user(self, user_id, blocked_user_id):
        # Mettre à jour la base de données pour bloquer l'utilisateur
        await self.unblock_user_db(user_id, blocked_user_id)
        await self.send_unblock_notification()

    async def send_block_notification(self):
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'block_user_confirmation',
                'message': 'Vous avez été bloqué par un autre utilisateur.',
                'delete_message': self.test
            }
        )

    async def send_unblock_notification(self):
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'unblock_user_confirmation',
                'message': 'Vous avez été bloqué par un autre utilisateur.',
                'delete_message': self.test
            }
        )

    @staticmethod
    def get_combined_key(user_id, blocked_user_id):
        return f"{user_id}-{blocked_user_id}"
    
    async def block_user_confirmation(self, event):
        message = event['message']
        delete_message = event['delete_message']
        # Envoyer la confirmation au front-end
        await self.send(text_data=json.dumps({
            'type': 'block_user_confirmation',
            'message': message,
            'delete_message': delete_message
        }))

    async def unblock_user_confirmation(self, event):
        message = event['message']
        delete_message = event['delete_message']
        # Envoyer la confirmation au front-end
        await self.send(text_data=json.dumps({
            'type': 'unblock_user_confirmation',
            'message': message,
            'delete_message': delete_message
        }))

    @database_sync_to_async
    def unblock_user_db(self, user_id, blocked_user_id):
        blocked_entry = BlockedUsers.objects.filter(user_id=user_id, blocked_user_id=blocked_user_id)
        if blocked_entry.exists():
            blocked_entry.delete()

    @database_sync_to_async
    def set_delete_block(self, roomName_real):
        room = ChatGroups.objects.get(name=roomName_real)
        chats = Chat.objects.filter(is_ready_button=True, room=room)
        for chat in chats:
            chat.delete()
        if chats:
            return True
        return False