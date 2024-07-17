from uuid import uuid4
from channels.generic.websocket import AsyncWebsocketConsumer
from collections import deque
import json
# from backend.game_service.pong import Game
from game_service.models import Tournament
from auth_service.models import Profil
from channels.db import database_sync_to_async
import re

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Vérifier s'il y a un nom de tournoi dans l'URL
        self.tournament_name = self.scope['url_route']['kwargs'].get('tournament_name')
        print("tournament_name = ", self.tournament_name)
        if self.tournament_name:
            self.room_group_name = f"lobby_{self.tournament_name}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        else:
            self.room_group_name = "lobby_tournament_group"
            await self.channel_layer.group_add('lobby_tournament_group', self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if self.tournament_name:
            await self.channel_layer.group_discard(self.tournament_name, self.channel_name)
        else:
            await self.channel_layer.group_discard('tournament_group', self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        print("\U0001F7E0 MESSAGE LOBBY = ", message)

        if (message == 'logout'):
            userId = data.get('userId')
            user = await self.get_user(userId)
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            if (await self.test_creator(user, tournament)):
                message = 'delete_tournament'
            else:
                message = 'leave_tournament'

        if (message == 'create_tournament'):
            userId = data.get('userId')
            player_name_tour = data.get('player_name_tour')
            tournament_name = data.get('tournament_name')
            num_players = data.get('num_players')
            user = await self.get_user(userId)
            test_player_name_tour = await self.test_player_name_tour(tournament_name, player_name_tour)
            if (test_player_name_tour):
                await self.send(text_data=json.dumps({'content': test_player_name_tour}))
                return            
            test_name = await self.test_name_tournament(tournament_name, user)
            if (test_name):
                await self.send(text_data=json.dumps({'content': test_name}))
                return
            await self.set_player_name_tour(user, player_name_tour)
            tournament = await self.create_tournament(tournament_name, num_players, user)
            await self.send_message_to_all()
            await self.send_message_to_user("tournament_created", tournament)
            return

        elif (message == 'new_user'):
            userId = data.get('userId')
            user = await self.get_user(userId)
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            participants = await self.get_tournament_participants(tournament)
            await self.send_message_to_players("new_user", tournament, userId, participants)
            return

        elif (message == 'join_tournament'):
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            player_name_tour = data.get('player_name_tour')
            test_player_name_tour = await self.test_player_name_tour(tournament_name, player_name_tour)
            if (test_player_name_tour):
                await self.send(text_data=json.dumps({'content': test_player_name_tour}))
                return
            user = await self.get_user(userId)
            tournament = await self.get_tournament(tournament_name)
            test_user = await self.test_add_user_to_tournament(tournament, user)
            if (test_user):
                await self.send(text_data=json.dumps({'content': test_user}))
                return
            await self.set_player_name_tour(user, player_name_tour)
            await self.add_user_to_tournament(tournament, user)
            await self.send_message_to_user("tournament_joined", tournament)
            # else:
            #     await self.send_message_to_user("tournament_not_joined", tournament)
    
        elif (message == 'launch'):
            userId = data.get('userId')
            user = await self.get_user(userId)
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            await self.update_users_is_in_tournament(tournament)
            print("launch_tournament")
            participants = await self.get_tournament_participants(tournament)
            await self.send_message_to_players("launch_tournament", tournament, userId, participants)

        elif (message == 'leave_tournament'):
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            user = await self.get_user(userId)
            tournament = await self.get_tournament(tournament_name)
            await self.remove_user_from_tournament(tournament, user)
            participants = await self.get_tournament_participants(tournament)
            await self.send_message_to_players("leave_user", tournament, userId, participants)
            await self.send_message_to_user("leave_user", tournament)

        elif (message == 'delete_tournament'):
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            user = await self.get_user(userId)
            tournament = await self.get_tournament(tournament_name)
            participants = await self.get_tournament_participants(tournament)
            await self.send_message_to_players('tournament_deleted', tournament, userId, participants)
            await self.delete_tournament(tournament, user)
        print("send_message_to_all()")
        await self.send_message_to_all()


    async def send_message_to_all(self):
        tournaments = await self.get_tournaments()
        await self.channel_layer.group_send('lobby_tournament_group', {
            'type': 'tournament_message',
            'content': 'tournament_updated',
            'tournaments': tournaments
        })

    async def tournament_message(self, event):
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'tournaments': event['tournaments']
        }))

    async def send_message_to_players(self, message, tournament, userId, participants):
        # participants = await self.get_tournament_participants(tournament)
        # Envoyer un message WebSocket à tous les participants du tournoi
        print("\U0001F7E0 message = ", message)
        print("\U0001F7E0 surivor = ", await self.get_survivor_id(tournament))
        await self.channel_layer.group_send(self.room_group_name, {
                'type': 'tournament_message_player',
                'content': message,
                'sender_id': userId,
                'survivor_id': await self.get_survivor_id(tournament),
                'tournament_nb_player_direct': tournament.nb_player_direct,
                'tournament_nb_player': tournament.nb_player,
                'tournament_round_number': tournament.round_number,
                'participants': participants,
            }
        )

    async def tournament_message_player(self, event):
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'sender_id': event['sender_id'],
            'survivor_id': event['survivor_id'],
            'tournament_nb_player_direct': event['tournament_nb_player_direct'],
            'tournament_nb_player': event['tournament_nb_player'],
            'tournament_round_number': event['tournament_round_number'],
            'participants': event['participants'],
        }))

    async def send_message_to_user(self, message, tournament):
        await self.send(text_data=json.dumps({
            'type': 'tournament_message_user',
            'content': message,
            'tournament_name': tournament.name,
        }))

    async def tournament_message_user(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat.message',
            'content': event['content'],
            'tournament_name': event['tournament_name'],
        }))

    @database_sync_to_async
    def get_survivor_id(self, tournament):
        if (tournament.survivor):
            user_id = tournament.survivor.user_id
            return user_id
        return None

    @database_sync_to_async
    def update_users_is_in_tournament(self, tournament):
        for user in tournament.users.all():
            print("USER is_in_tournament = ", user.username)
            user.is_in_tournament = True
            user.is_in_lobby = False
            user.save()

    @database_sync_to_async
    def test_name_tournament(self, tournament_name, user):
        if (not re.match("^[a-zA-Z0-9_]+$", tournament_name)) or (len(tournament_name)) > 15 or (len(tournament_name) <= 2):
            return ('wrong_name')
        if Tournament.objects.filter(name=tournament_name, is_active=True).exists():
            return ('name_already_exists')
        if Tournament.objects.filter(creator=user, is_active=True).exists():
            return ('creator_already_exists')
        if Tournament.objects.filter(users=user, is_active=True).exists():
            return ('user_already_in_tournament')
        return (None)

    @database_sync_to_async
    def create_tournament(self, tournament_name, num_players, user):
        if Tournament.objects.filter(name=tournament_name, is_active=False).exists():
            Tournament.objects.filter(name=tournament_name, is_active=False).delete()
        tournament = Tournament.objects.create(
            name=tournament_name,
            nb_player=num_players,
            creator=user,
            survivor=user,
            nb_player_direct=1,
            is_active=True,
        )
        tournament.users.add(user)
        user.is_in_lobby = True
        user.save()
        return tournament


    @database_sync_to_async
    def get_tournament(self, tournament_name):
        # Essayez de récupérer le tournoi existant avec le nom spécifié
        tournament = Tournament.objects.filter(name=tournament_name).first()
        # Si le tournoi n'existe pas, créez-le
        if not tournament:
            return None
        return tournament

    @database_sync_to_async
    def remove_user_from_tournament(self, tournament, user):
        # Vérifiez si l'utilisateur est dans le tournoi
        if tournament.users.filter(pk=user.pk).exists():
            # Supprimer l'utilisateur du tournoi
            tournament.users.remove(user)
            if tournament.nb_player_direct > 0:
                tournament.nb_player_direct -= 1
                tournament.save()
            user.is_in_lobby = False
            user.save()
            print("L'utilisateur a quitté le tournoi.")
        else:
            print("L'utilisateur n'est pas dans ce tournoi.")

    @database_sync_to_async
    def delete_tournament(self, tournament, user):
        if user == tournament.creator:
            for player in tournament.users.all():
                player.is_in_lobby = False
                player.save()
            tournament.delete()

    @database_sync_to_async
    def test_add_user_to_tournament(self, tournament, user):
        current_player_count = tournament.users.count()
        # Vérifier si l'utilisateur est déjà dans un autre tournoi
        if Tournament.objects.filter(users=user, is_active=True).exclude(pk=tournament.pk).exists():
            print("L'utilisateur est déjà dans un autre tournoi.")
            return ('user_already_in_tournament')      
        # Vérifier s'il n'y a pas déjà trop de joueurs dans le tournoi
        if current_player_count >= tournament.nb_player:
            print("Le tournoi est déjà complet.")
            return ('tournament_full')

    @database_sync_to_async
    def add_user_to_tournament(self, tournament, user):
        current_player_count = tournament.users.count()
        if tournament.users.filter(pk=user.pk).exists():
            print("L'utilisateur est déjà dans ce tournoi.")
            return True
        tournament.users.add(user)
        print("L'utilisateur a été ajouté au tournoi.")
        current_player_count += 1
        tournament.nb_player_direct = current_player_count
        tournament.save()
        if current_player_count >= tournament.nb_player:
            tournament.is_complete = True
            tournament.save()
        user.is_in_lobby = True
        user.save()
        return True
      
    @database_sync_to_async
    def get_user(self, userId):
        user = Profil.objects.filter(user_id=userId).first()
        return user
    
    @database_sync_to_async
    def test_creator(self, user, tournament):
        if (user == tournament.creator and not user.is_in_tournament):
            return True
        return False
    
    @database_sync_to_async
    def get_tournaments(self):
        tournaments = Tournament.objects.all()
        if (tournaments):
            return list(tournaments.values('name', 'nb_player', 'is_complete'))
        else:
            return None

    @database_sync_to_async
    def get_tournament_participants(self, tournament):
        participants = tournament.users.all()
        serialized_users = [self.serialize_user(user) for user in participants]
        return serialized_users

    def serialize_user(self, user):
        return {
            'username': user.username,
            'player_name_tour': user.player_name_tour,
            'avatar': user.avatar.url if user.avatar else '',
        }

    @database_sync_to_async
    def test_player_name_tour(self, tournament_name, player_name_tour):
        if (not re.match("^[a-zA-Z0-9_]+$", player_name_tour)) or (len(player_name_tour) > 13) or (len(player_name_tour) <= 2):
            return ('wrong_name_name_tour')
        tournament = Tournament.objects.filter(name=tournament_name).first()
        if (tournament):
            users = tournament.users.all()
            if (users):
                for user in users:
                    if user.player_name_tour == player_name_tour:
                        return ('name_already_exists_name_tour')
        return (None)
    
    @database_sync_to_async
    def set_player_name_tour(self, user, player_name_tour):
        user.player_name_tour = player_name_tour
        user.save()
