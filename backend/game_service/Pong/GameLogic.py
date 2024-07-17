from game_service.Pong.Online.pongOnline import PongOnline
from game_service.Pong.Local.pongLocal import PongLocal
import asyncio
from auth_service.models import Profil
from channels.db import database_sync_to_async

onlineGames = {}
localGames = {}

class GameLogic:
	userId = 0
	lastTime = 0

	def __init__(self, ConsumerClient, is_online, is_local):
		self.ConsumerClient = ConsumerClient
		self.is_online = is_online
		self.is_local = is_local

	#! ------------------------------- IN COMMON -----------------------------------

# Recieve
	async def recieve(self, received_data):
		userId = received_data.get('userId')
		gameId = received_data.get('gameId')
		action = received_data.get('action')
		self.userId = userId

		# print('userId = ', userId, '\ngameId = ', gameId, '\n action = ', action)

		# getting the good game
		game = self.getGame(action, gameId)
		if not game and (action != 'add_tournament_player' and action != 'add_user_from_invitation') and (self.is_local and action != 'add_player'):
			print(f'\U0001F534 Game {gameId} not found with action = ', action)
			return

		# executing the actions to update the game (same for local and online)
		await self.gameActions(received_data, game, userId, action)

		# executing specific online or local actions:
		if self.is_online == True:
			await self.onlineActions(action, game, userId, gameId, received_data)
		elif self.is_local == True:
			await self.localActions(action, received_data, game, userId)


# gameActions
	async def gameActions(self, received_data, game, userId, action):
		if (action == 'update_paddles'):
			await self.update_paddles(game, userId, received_data)


# getGame
	def getGame(self, action, gameId):
		game = None
		if (self.is_local == True and action != 'add_player'):
			game = localGames.get(gameId)
		elif (self.is_online == True and action != 'add_tournament_player' and action != 'add_user_from_invitation'):
			game = onlineGames.get(gameId)
		return game


# Update Paddles
	async def update_paddles(self, game, userId, received_data):
		# Moving Paddle
		if self.is_online:
			self.moveOnlinePaddle(game, userId, received_data)
		elif self.is_local:
			self.moveLocalPaddle(game, received_data)


# Move Paddle
	def updatePaddleVelocity(self, paddle, direction):
		if direction == "up":
			paddle.velocity['y'] = -paddle.speed
		elif direction == "down":
			paddle.velocity['y'] = paddle.speed
		elif direction == "":
			paddle.velocity['y'] = 0


	#! ------------------------------- ONLINE -----------------------------------


# onlineActions
	async def onlineActions(self, action, game, userId, gameId, received_data):
		elapsed = received_data.get('elapsed')

		# adding player to game
		if action == 'add_player':
			await self.addPlayerToOnlineGame(game, userId, elapsed)

		# adding a tournament player
		elif (action == 'add_tournament_player'):
			if gameId not in onlineGames:
				onlineGames[gameId] = PongOnline(gameId)
				onlineGames[gameId].is_tournament_game = True
			game = onlineGames.get(gameId)
			await self.addPlayerToOnlineGame(game, userId, elapsed)

		# adding a player from invitation
		elif (action == 'add_user_from_invitation'):
			if gameId not in onlineGames:
				onlineGames[gameId] = PongOnline(gameId)
			game = onlineGames.get(gameId)
			await self.addPlayerToOnlineGame(game, userId, elapsed)

		# deconnection


# Add PLayer To Online Game
	async def addPlayerToOnlineGame(self, game, userId, elapsed):
		# getting users username
		if (game.is_tournament_game):
			self.ConsumerClient.username = await self.get_player_name_tour(userId)
		else:
			self.ConsumerClient.username = await self.get_username(userId)
		print('\U0001F7E2 user: ', userId, 'added successfully to an online game')


		# adding player
		num_players = game.get_number_of_players()
		if num_players < 2:
			await game.add_player(self.ConsumerClient)
			num_players += 1
		elif num_players > 2:
			print('\U0001F534 error: more than 2 players in game')

		# Starting the game if 2 players are in game
		if num_players == 2:
			print('\U0001F7E0 ---------------------------------------- STARTING NEW GAME ----------------------------------------')
			await game.start_game(elapsed, userId)


# Move Online Paddle
	def moveOnlinePaddle(self, game, userId, received_data):
		direction = received_data.get('direction')
		players = game.players
		if players:
			if userId == players[0].userId:
				self.updatePaddleVelocity(game.paddle2, direction)
			elif userId == players[1].userId:
				self.updatePaddleVelocity(game.paddle1, direction)


# Disconnect
	async def disconnect(self):
		games_to_delete = [gameId for gameId, game in onlineGames.items() if self.ConsumerClient in game.players]
		for gameId in games_to_delete:
			game = onlineGames.get(gameId)
			if game:
				if game.index == 0:
					game.cancel_tasks()
					game.giving_up_id = self.ConsumerClient.userId
					print('\U0001F7E0 givingUpId = ', game.giving_up_id)
					for player in game.players:
						if player.userId != game.giving_up_id:
							game.winnerId = player.userId
							print('\U0001F7E0 WIinnerId = ', game.winnerId)
					if (game.cleaned == False):
						await game.send_game_over_message('consumer destructor')
					game.index = 1
					break
				elif game.index == 1:
					await game.set_users_in_game(False)
					await game.cleanup(True, game.giving_up_id)
					del onlineGames[gameId]
					print(f'\U0001F7E2 game with id: {gameId} is deleted successfully')


	#! ------------------------------- LOCAL -----------------------------------


# Local Actions
	async def localActions(self, action, received_data, game, userId):
		elapsed = received_data.get('elapsed')

		if (action == 'add_player'):
			await self.addPlayerToLocalGame(game, userId, elapsed)
		elif (action == 'restart_game'):
			game.new_game()


# Add PLayer To Local Game
	async def addPlayerToLocalGame(self, game, userId, elapsed):
		if userId not in localGames:
			# getting users username
			self.ConsumerClient.username = await self.get_username(userId)
			
			# Initialising a new local game
			localGames[userId] = PongLocal(userId)
			await localGames[userId].add_player(self.ConsumerClient)
			print(f'\U0001F7E2 user: {userId} added successfully to a local game')

			# starting game
			print('\U0001F7E0 ---------------------------------------- STARTING NEW GAME ----------------------------------------')
			await localGames[userId].start_game(elapsed, userId)


# Move Local Paddle
	def moveLocalPaddle(self, game, received_data):
		left_direction = received_data.get('left_direction')
		right_direction = received_data.get('right_direction')
		self.updatePaddleVelocity(game.paddle1, left_direction)
		self.updatePaddleVelocity(game.paddle2, right_direction)


# disconnect local game
	async def disconnect_local(self):
		if (self.userId in localGames):
			game = localGames.get(self.userId)
			if (game.local_disconnect == 0):
				game.local_disconnect = 1
				game.end = 0
				return
			elif (game.local_disconnect == 1):
				await game.clean_local_game(game)
				localGames.pop(self.userId)
				del(game)
				print(f'\U0001F7E2 game with id: {self.userId} is deleted successfully')


# get username from Database
	@database_sync_to_async
	def get_username(self, userId):
		user = Profil.objects.filter(user_id=userId).first()
		return user.username


# get players tournament name
	@database_sync_to_async
	def get_player_name_tour(self, userId):
		user = Profil.objects.filter(user_id=userId).first()
		return user.player_name_tour
