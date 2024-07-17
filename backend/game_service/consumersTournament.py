from uuid import uuid4
from channels.generic.websocket import AsyncWebsocketConsumer
from collections import deque
import json
# from backend.game_service.pong import Game
from game_service.models import Tournament, Match
from auth_service.models import Profil
from channels.db import database_sync_to_async
from django.db.models import Q
import random
import asyncio
from asgiref.sync import sync_to_async

class TournamentConsumer(AsyncWebsocketConsumer):
    match_creation_lock = asyncio.Lock()

    async def connect(self):
        # Vérifier s'il y a un nom de tournoi dans l'URL
        self.tournament_name = self.scope['url_route']['kwargs'].get('tournament_name')
        self.match_id = self.scope['url_route']['kwargs'].get('match_id')
        if self.match_id:
            await self.channel_layer.group_add(self.match_id, self.channel_name)
        else:
            await self.channel_layer.group_add(self.tournament_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.match_id:
            await self.channel_layer.group_discard(self.match_id, self.channel_name)
        else:
            await self.channel_layer.group_discard(self.tournament_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        print("MESSAGE = ", message)

        if (message == 'logout'):
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            await self.handle_logout(userId, tournament_name)

        if (message == 'make_matches'):
            await self.handle_make_matches(data)
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            match_id = await self.get_match_id_for_user(userId, tournament.round_number, tournament)
            survivor_id = await self.get_survivor(tournament)
            print("survivor_id = ", survivor_id)
            await self.send(text_data=json.dumps({'content': "success", 'match_id': match_id, 'survivor_id': survivor_id}))
        
        elif (message == 'get_all_matches'):
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            matches = await self.get_all_matches(tournament)
            is_finish = await self.is_finish(tournament)
            if await self.get_tournament_round(tournament) == 0:
                await self.send_particular_message(tournament, matches, False, None, is_finish, userId)
            else:
                await self.send_message_to_all(tournament, matches, False, None, is_finish, userId)

        elif (message == 'get_match_id'):
            userId = data.get('userId')
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            if (tournament):
                match_id = await self.get_match_id_for_user(userId, tournament.round_number, tournament)
                await self.send(text_data=json.dumps({'content': "success", 'match_id': match_id}))
            else:
                user = await self.get_user(userId)
                await self.remove_is_in_tournament(user)
                await self.send(text_data=json.dumps({'content': "failure"}))

        elif (message == 'player_state'):
            player_state = data.get('player_state')
            print("player_state = ", player_state)
            userId = data.get('userId')
            username = await self.get_username(userId)
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            user = await self.get_user(userId)
            match = await self.update_player_state(user, player_state, tournament.round_number, tournament)
            if (match != False and match != True):
                other_userId = await self.get_other_player_id(match, user)
                other_username = await self.get_username(other_userId)
                print("Two Players Ready")
                await self.send_message_to_match_id("Two_Players_Ready", match.match_id,  tournament)
            elif (match == True):
                await self.send(text_data=json.dumps({'content': "Ready_alone", 'last_state': player_state}))
            else:
                await self.send(text_data=json.dumps({'content': "Ready_Impossible"}))
        
        elif (message == 'winner'):
            userId = data.get('userId')
            winner = data.get('winner')
            match_id = data.get('match_id')
            tournament_name = data.get('tournament_name')
            print("userId = ", userId, " winner = ", winner, " match_id = ", match_id)
            winner = await self.get_user(winner)
            tournament = await self.get_tournament(tournament_name)
            match = await self.get_match(match_id, tournament)
            loser = await self.set_winner(match, winner, data.get('score_p1'), data.get('score_p2'))
            await self.remove_user(tournament, loser)
            await self.send(text_data=json.dumps({'content': "success"}))
        
        elif (message == 'loser'):
            userId = data.get('userId')
            loser = await self.get_user(userId)
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            await self.remove_user(tournament, loser)
            await self.send(text_data=json.dumps({'content': "success_loser"}))

        elif (message == 'update_tournament'):
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            check = await self.check_round_complete(tournament)
            print("check_round_complete = ", check)
            if (check):
                check = await self.update_tournament(tournament)
                print("update_tournament = ", check)
                if (check):
                    print("new_roundddddddddddddddddd")
                    await self.send_message_to_match_id("new_round", tournament.name, tournament)
                else:
                    print("WIIIIIIIIIIIIIIIIIIINNNNNNNNNNN")
                    await self.finish_tournament(tournament)
                    await self.send_message_to_match_id("BIG_WIN", tournament.name, tournament)


    async def handle_logout(self, userId, tournament_name):
        user = await self.get_user(userId)
        tournament = await self.get_tournament(tournament_name)
        # print("test 1 : ", await self.count_players(tournament))
        if (not tournament):
            return
        # print("test 2 : ", await self.count_players(tournament))
        match = await self.get_match_round(user, tournament)
        if (not match):
            return
        # print("test 3 : ", await self.count_players(tournament))
        winner = await self.get_other_player(match, user)
        # print("winner : ", winner)
        print("test 4 : ", await self.count_players(tournament))
        loser = await self.set_winner(match, winner, 11, 0)
        print("test 5 : ", await self.count_players(tournament))
        await self.remove_user(tournament, loser)
        await self.update_survivor(tournament)
        if (await self.count_players(tournament) <= 0):
            await self.update_tournament(tournament)
        await self.send(text_data=json.dumps({'content': "success"}))
        matches = await self.get_all_matches(tournament)
        winner_id = await self.get_user_id(winner)
        is_finish = await self.is_finish(tournament)
        await self.send_message_to_all(tournament, matches, True, winner_id, is_finish, userId)

    async def handle_make_matches(self, data):
        async with self.match_creation_lock:
            tournament_name = data.get('tournament_name')
            tournament = await self.get_tournament(tournament_name)
            if tournament and not tournament.matches_created:
                await self.create_matches(tournament)
                await self.set_matches_created(tournament)
                asyncio.create_task(self.check_users_logged_in(tournament, tournament_name))

    async def check_users_logged_in(self, tournament, tournament_name):
        while True:
            users = await sync_to_async(list)(tournament.users.all())  # Convertir en liste de manière asynchrone
            for user in users:
                username = await sync_to_async(self.is_username)(user)
                if not await sync_to_async(self.is_user_logged_in)(user):
                    print(f"User {username} is not logged in")
                    userId = await sync_to_async(self.is_userId)(user)
                    await self.handle_logout(userId, tournament_name)
                else:
                    print(f"User {username} is LOOOOGGG")
            await asyncio.sleep(5)  # Vérifie toutes les 5 secondes

    def is_user_logged_in(self, user):
        return user.logged_in
    
    def is_username(self, user):
        return user.username
    
    def is_userId(self, user):
        return user.user_id

    async def send_message_to_match_id(self, message, match_id, tournament):
        await self.channel_layer.group_send(match_id, {
                'type': 'tournament_message_match_id',
                'content': message,
                'match_id': match_id,
                'tournament_nb_player': tournament.nb_player,
                'tournament_round_number': tournament.round_number,
            }
        )

    async def tournament_message_match_id(self, event):
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'match_id': event['match_id'],
            'tournament_nb_player': event['tournament_nb_player'],
            'tournament_round_number': event['tournament_round_number'],
        }))

    async def send_particular_message(self, tournament, matches, logout_other, winner_id, finish, userId):
        await self.send(text_data=json.dumps({
            'type': 'tournament_message',
            'content': 'success',
            'logout_other': logout_other,
            'winner_id': winner_id,
            'matches': matches,
            'tournament_nb_player': tournament.nb_player,
            'tournament_round_number': tournament.round_number,
            'finish':finish,
            'user_id': userId,
        }))

    async def send_message_to_all(self, tournament, matches, logout_other, winner_id, finish, userId):
        await self.channel_layer.group_send(tournament.name, {
            'type': 'tournament_message',
            'content': 'success',
            'logout_other': logout_other,
            'winner_id': winner_id,
            'matches': matches,
            'tournament_nb_player': tournament.nb_player,
            'tournament_round_number': tournament.round_number,
            'finish':finish,
            'user_id': userId,
        })

        

    async def tournament_message(self, event):
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'logout_other': event['logout_other'],
            'winner_id': event['winner_id'],
            'matches': event['matches'],
            'tournament_nb_player': event['tournament_nb_player'],
            'tournament_round_number': event['tournament_round_number'],
            'finish': event['finish'],
            'user_id': event['user_id'],
        }))

    def serialize_matches(self, match):
        return {
            'match_id': match.match_id,
            'player1': self.serialize_profil(match.player1),
            'player2': self.serialize_profil(match.player2),
            'nb_round': match.nb_round,
            'winner': self.serialize_profil(match.winner) if match.winner else None,
            'loser': self.serialize_profil(match.loser) if match.loser else None,
            'score_winner': match.score_winner,
            'score_loser': match.score_loser,
        }
    
    def serialize_profil(self, profil):
        if profil:
            return {
                'user_id': profil.user_id,
                'username': profil.username,
                'player_name_tour': profil.player_name_tour,
            }
        return None

    @database_sync_to_async
    def get_username(self, userId):
        user = Profil.objects.filter(user_id=userId).first()
        return user.username
    
    @database_sync_to_async
    def get_all_matches(self, tournament):
        matches = Match.objects.filter(tournament=tournament)
        serialized_matches = [self.serialize_matches(match) for match in matches]
        return serialized_matches
    
    @database_sync_to_async
    def check_round_complete(self, tournament):
        return not Match.objects.filter(tournament__name=tournament.name, nb_round=tournament.round_number, winner__isnull=True).exists()

    @database_sync_to_async
    def get_match_id_for_user(self, user_id, nb_round, tournament):
        match = Match.objects.filter(player1__user_id=user_id, nb_round=nb_round, tournament=tournament).first()
        if match:
            return match.match_id
        match = Match.objects.filter(player2__user_id=user_id, nb_round=nb_round, tournament=tournament).first()
        if match:
            return match.match_id
        return None
    
    @database_sync_to_async
    def update_player_state(self, user, player_state, nb_round, tournament):
        match = Match.objects.filter((Q(player1=user) | Q(player2=user)), nb_round=nb_round, tournament=tournament).first()
        if match:
            if match.player1 == user:
                match.player1_ready = (player_state == 'Ready')
            elif match.player2 == user:
                match.player2_ready = (player_state == 'Ready')
            match.save()
            if match.winner != None:
                if match.player1 == user:
                    match.player1_ready = False
                elif match.player2 == user:
                    match.player2_ready = False
                match.save()
                return False        
            if match.winner == None and match.player1_ready and match.player2_ready:
                return match
            return True
        return False

    @database_sync_to_async
    def get_user(self, userId):
        user = Profil.objects.filter(user_id=userId).first()
        return user

    @database_sync_to_async
    def get_user_id(self, user):
        return user.user_id
    
    @database_sync_to_async
    def get_other_player(self, match, user):
        other_user = match.player1 if user != match.player1 else match.player2
        return other_user

    @database_sync_to_async
    def get_other_player_id(self, match, user):
        other_user = match.player1 if user != match.player1 else match.player2
        return other_user.user_id
    
    @database_sync_to_async
    def get_match(self, match_id, tournament):
        match = Match.objects.filter(match_id=match_id, tournament=tournament).first()
        return match

    @database_sync_to_async
    def get_match_round(self, user, tournament):
        match = Match.objects.filter((Q(player1=user) | Q(player2=user)), tournament=tournament, nb_round=tournament.round_number).first()
        return match

    @database_sync_to_async
    def set_winner(self, match, winner, score_p1, score_p2):
        match.winner = winner
        match.player1_ready = False
        match.player2_ready = False
        match.save()
        loser = match.player1 if winner != match.player1 else match.player2
        if (score_p1 > score_p2):
            match.score_winner = score_p1
            match.score_loser = score_p2
        else:
            match.score_winner = score_p2
            match.score_loser = score_p1
        match.loser = loser
        match.save()
        return loser

    @database_sync_to_async
    def remove_user(self, tournament, user):
        print("REMOOOOOVE = ", user.username)
        user.is_in_tournament = False
        user.save()
        print("user.is_in_tournament = ", user.is_in_tournament)
        tournament.users.remove(user)
        tournament.save()

    @database_sync_to_async
    def remove_is_in_tournament(self, user):
        user.is_in_tournament = False
        user.save()
        
    @database_sync_to_async
    def set_matches_created(self, tournament):
        tournament.matches_created = True
        tournament.save()

    @database_sync_to_async
    def create_matches(self, tournament):
        participants = list(tournament.users.all())
        random.shuffle(participants)  # Mélanger les joueurs pour les assigner aléatoirement

        matches = []
        for i in range(0, len(participants), 2):
            player1 = participants[i]
            player1_id = participants[i].user_id
            player2 = participants[i + 1]
            player2_id = participants[i + 1].user_id
            match_id = f"{player1_id}_{player2_id}"
            match = Match.objects.create(
                tournament=tournament,
                player1=player1,
                player2=player2,
                match_id=match_id,
                nb_round=tournament.round_number,
            )
            matches.append(match)
        return matches
    
    @database_sync_to_async
    def get_tournament(self, tournament_name):
        # Essayez de récupérer le tournoi existant avec le nom spécifié
        tournament = Tournament.objects.filter(name=tournament_name).first()
        # Si le tournoi n'existe pas, créez-le
        if not tournament:
            return None
        return tournament

    @database_sync_to_async
    def get_tournament_round(self, tournament):
        if (tournament):
            return tournament.round_number
        else:
            return (0)

    @database_sync_to_async
    def get_survivor(self, tournament):
        user_id = tournament.survivor.user_id
        return user_id

    @database_sync_to_async
    def is_finish(self, tournament):
        if (tournament.users.count() <= 1):
            return True
        else:
            return False

    @database_sync_to_async
    def count_players(self, tournament):
        return tournament.users.count()

    @database_sync_to_async
    def update_survivor(self, tournament):
        print("update_survivor!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        if not tournament.users.filter(user_id=tournament.survivor.user_id).exists():
            print("update_survivor2!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            # Si le survivor actuel ne fait plus partie des utilisateurs, le remplacer par le premier utilisateur disponible
            first_user = tournament.users.first()
            print("first_user!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  ", first_user)
            tournament.survivor = first_user
            tournament.save()


    @database_sync_to_async
    def update_tournament(self, tournament):
        tournament.matches_created = False
        tournament.round_number+=1
        tournament.save()
        print("tournament.users.count() = ", tournament.users.count())

        if (tournament.users.count() == 1):
            winner_tournament = tournament.users.first()
            winner_tournament.is_in_tournament = False
            winner_tournament.save()
            tournament.winner = winner_tournament 
            tournament.is_active = False
            tournament.save()
            return False
        # Vérifie si le survivor actuel fait toujours partie des utilisateurs du tournoi
        if tournament.survivor and not tournament.users.filter(user_id=tournament.survivor.user_id).exists():
            # Si le survivor actuel ne fait plus partie des utilisateurs, le remplacer par le premier utilisateur disponible
            first_user = tournament.users.first()
            tournament.survivor = first_user
            tournament.save()
        return True

    @database_sync_to_async
    def finish_tournament(self, tournament):
        tournament.users.clear()
        tournament.is_active = False
        tournament.save()
