from .Paddle import Paddle
from .Ball import Ball
import json
import asyncio
from auth_service.models import Profil
from channels.db import database_sync_to_async

class Pong:
	def __init__(self, game_id):
		self.gameId = game_id
		self.isCli = False
		self.paddle1 = Paddle({'x' : 0.01, 'y' : 0.45})
		self.paddle2 = Paddle({'x' : 0.98, 'y' : 0.45})
		self.ball = Ball()
		self.players = []
		self.score = {}
		self.end = 1
		self.collision = 0
		self.cleaned = False
		self.finish_score = 2
		self.receiver = None
		self.loop_task = None
		self.winner = None
		self.giving_up_id = None
		self.local_disconnect = 0
		self.usernames = {}
		self.scored = 0

# Update
	async def update_pong(self, elapsed):
		if self.end == 1:
			# Update the ball and paddles positions
			res = self.ball.update(self.paddle1, self.paddle2, elapsed)
			self.paddle1.update()
			self.paddle2.update()

			# Update Score
			self.update_score(res)
			# Check if any player has reached the finish score
			await self.check_for_end()
		else:
			print('\U0001F534 error: game is ended, cannot update game')

	async def update_pong_inter(self, elapsed):
		if self.end == 1:
			# Update the ball and paddles positions
			# res = self.ball.update(self.paddle1, self.paddle2, elapsed)
			self.paddle1.update()
			self.paddle2.update()

			# Update Score
			# self.update_score(res)
			# Check if any player has reached the finish score
			# await self.check_for_end()
		else:
			print('\U0001F534 error: game is ended, cannot update game')


# Update Game
	async def update_game(self):
		total_wait_time = 1.4
		check_interval = 0.1
		elapsed_time = 0
		self.witness = 0
		# wait for countdown
		while elapsed_time < total_wait_time:
			await asyncio.sleep(check_interval)
			elapsed_time += check_interval
			if self.end == 0:
				print('\U0001F534 error: game could not start, please retry')
				await self.players[0].disconnect(0)
				break

		# start Game Loop
		while (self.end == 1):
			if (self.scored == 0):
				await self.update_pong(10)
			elif (self.scored == 1):
				self.witness += 1
				self.paddle1.update()
				self.paddle2.update()
				if (self.witness >= 30):
					self.scored = 0
					self.witness = 0
			score = self.get_score()
			await self.send_positions(score)
			if (self.collision == 1):
				self.collision = 0
			await asyncio.sleep(0.016)


# Send Positions To Players In Game
	async def send_positions(self, score):
		for player in self.players:
			await player.send(text_data=json.dumps({
				'action': 'update_game',
				'right_bar_position': self.paddle2.position,
				'left_bar_position': self.paddle1.position,
				'ball_position': self.ball.position,
				'username_p1': self.usernames['p1'],
				'username_p2': self.usernames['p2'],
				'score_p1': score['p1'],
				'score_p2': score['p2'],
				'collision': self.collision
			}))

# Start Game
	async def start_game(self, elapsed, userId):
		self.init_score()
		self.get_usernames()
		# set Profil.in_game to true in Database
		await self.set_users_in_game(True)
		self.end = 1

		# creatinf asyncio Task to loop the game
		if (self.loop_task == None):
			self.loop_task = asyncio.create_task(self.update_game())
		else:
			self.loop_task.cancel()
			self.loop_task = None
			self.loop_task = asyncio.create_task(self.update_game())


# set in_game to true in Database
	@database_sync_to_async
	def set_users_in_game(self, value):
		for player in self.players:
			try:
				profile = Profil.objects.get(user_id=player.userId)
				profile.in_game = value
				if value == True :
					profile.status = 'in_game'
				profile.save()
			except Profil.DoesNotExist:
				continue

# Cancel Tasks
	def cancel_tasks(self):
		if self.loop_task is not None:
			self.loop_task.cancel()
			self.loop_task = None   # Reset the task reference
			print('\U0001F7E2 asyncio task canceled sucsessfully')

# New Game
	def new_game(self):
		self.init_score()
		self.paddle1.restart()
		self.paddle2.restart()
		self.ball.restart()
		self.end = 1

# Get Usernames
	def get_usernames(self):
		# if Local Game
		if (self.get_number_of_players() == 1):
			self.usernames['p1'] = 'player 1'
			self.usernames['p2'] = 'player 2'
		# if Online Game
		elif (self.get_number_of_players() == 2):
			self.usernames['p1'] = self.players[0].username,
			self.usernames['p2'] = self.players[1].username,

# Init Score
	def init_score(self):
		# if Local Game
		if (self.get_number_of_players() == 1 or self.isCli == True):
			self.score['p1'] = 0
			self.score['p2'] = 0
		# if Online Game
		elif (self.get_number_of_players() == 2):
			self.score[self.players[0].userId] = 0
			self.score[self.players[1].userId] = 0

# Get Score
	def get_score(self):
		score = {}
		num_players = self.get_number_of_players()
		# if Local Game
		if (num_players == 1 or (self.isCli == True)):
			score['p1'] = self.score['p1']
			score['p2'] = self.score['p2']
		# if Online Game
		elif (num_players == 2):
			score['p1'] = self.score[self.players[0].userId]
			score['p2'] = self.score[self.players[1].userId]
		return score

#  Update Score
	def update_score(self, res):
		num_players = self.get_number_of_players()
		if res == 1:
			self.scored = 1
			if (num_players == 1 or self.isCli == True):
				self.score['p1'] += 1
			else:
				self.score[self.players[0].userId] += 1
		elif res == 2:
			self.scored = 1
			if (num_players == 1 or self.isCli == True):
				self.score['p2'] += 1
			else:
				self.score[self.players[1].userId] += 1
		elif res == 3:
			self.collision = 1

# Get Number Of Players
	def get_number_of_players(self):
		return len(self.players)

# Check For End
	async def check_for_end(self):
		pass;

# Add Player
	async def add_player(self, player):
		pass ;

# Remove Player
	async def remove_player(self, player):
		pass ;

	def __del__(self):
		print('\U0001F7E2 DELETING GAME')