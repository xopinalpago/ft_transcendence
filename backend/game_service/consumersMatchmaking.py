from uuid import uuid4
from channels.generic.websocket import AsyncWebsocketConsumer
from collections import deque
from channels.db import database_sync_to_async
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
# from game_service.pong import Game
from game_service.Pong.GameLogic import onlineGames
from game_service.Pong.Online.pongOnline import PongOnline
from auth_service.models import Profil

games = {}

class QueueConsumer(AsyncWebsocketConsumer):
    # stocker les files d'attente (deque)
    queues = []
    userId = 0

    async def connect(self):
        await self.accept()

    # recevoir la data et gerer les actions
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'join_queue':
            user_id = text_data_json.get('userId')
            self.userId = user_id
            await self.join_queue()

        elif action == 'quit_queue':
            self.disconnect()

        else:
            await self.send(text_data=json.dumps({'action': 'undefined', 'status': 'error', 'message': 'Invalid action.'}))

    async def disconnect(self, close_code=1000):
        # Iterate through the queues
        for i, queue in enumerate(self.queues):
            # Find the index of the user with the matching userId
            for user in queue:
                if user.userId == self.userId:
                    queue.remove(user)
                    if len(queue) == 0:
                        self.queues.pop(i)
                    print(f'\U0001F7E2 user : {self.userId} disconnected from queue consumer')
                    return

# JOIN_QUEUE
    async def join_queue(self):
        # on check si le user est deja dans une queue
        for queue in self.queues:
            if self.userId in [user.userId for user in queue]:
                print(f'\U0001F534 error: User: {self.userId} already in queue')
                await self.send(text_data=json.dumps({'action': 'join_queue', 'status': 'error', 'message': 'You are already in a queue.'}))
                return

        # si le tableau est vide creer un deque, rajouter le userId dedans et ajouter la deque au tableau
        if len(self.queues) == 0 or all(len(queue) >= 2 for queue in self.queues):
            new_queue = deque()
            new_queue.append(self)
            self.queues.append(new_queue)
            await self.send(text_data=json.dumps({'action': 'join_queue', 'status': 'success', 'message': 'You have created a queue, waiting for a player ...'}))
            print(f'\U0001F7E2 user {self.userId} created a queue, waiting for a player ...')
            return

        # on boucle dans les queues, completer la queue si 1 personne est dedans
        for i in range(len(self.queues)):
            if len(self.queues[i]) == 1:
                self.queues[i].append(self)
                await self.send(text_data=json.dumps({'action': 'join_queue', 'status': 'success', 'message': 'You have joined a queue you are ready to play.'}))

                # commencer une nouvelle partie
                print(f'\U0001F7E2 user {self.userId} joined a queue, starting a new online game')
                await self.start_game(self.queues[i])

                if len(queue) == 0:
                    self.queues.remove(queue)
                return
            elif len(self.queues[i]) == 0:
                # supprimer le deque du tableau
                del self.queues[i]

# START_GAME
    async def start_game(self, queue: deque):
        p1 = queue[0]
        p2 = queue[1]
        # on vide la queue
        queue.popleft()
        queue.popleft()
        gameId = p1.userId + p2.userId
        
        # si une game avec le meme Id existe deja, on la supprime
        if gameId in games:
            del games[gameId]

        # initialisationd'une nouvelle OnlineGame
        onlineGames[gameId] = PongOnline(gameId)
        p1_username = await self.get_username(p1.userId)
        p2_username = await self.get_username(p2.userId)
        await p1.send(text_data=json.dumps({'action': 'start_game', 'message': 'Game starting.', 'gameId': gameId, 'p1_username': p1_username, 'p2_username': p2_username}))
        await p2.send(text_data=json.dumps({'action': 'start_game', 'message': 'Game starting.', 'gameId': gameId, 'p1_username': p1_username, 'p2_username': p2_username}))

# GET USERNAME
    @database_sync_to_async
    def get_username(self, userId):
        user = Profil.objects.filter(user_id=userId).first()
        return user.username


