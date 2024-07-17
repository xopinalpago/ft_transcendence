import asyncio
import json
import time
from .ball import Ball
from .paddle import Paddle
from sqlite3 import IntegrityError
from auth_service.models import Profil
from game_service.models import FinishedGame
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async



class Game:
	def __init__(self):
		self.cleaned = False
		self.paddle1 = Paddle({'x' : 0.01, 'y' : 0.45})
		self.paddle2 = Paddle({'x' : 0.98, 'y' : 0.45})
		self.ball = Ball()
		self.finish_score = 5
		self.players = []
		self.score = {}
		self.giving_up_id = None
		self.score_p1 = {}
		self.score_p2 = {}
		self.index = 0
		self.is_tournament_game = False
		self.winnerId = None
		self.profiles = {}
		self.loop_task = None
		self.update_interval = 1 / 60
		self.end = 1
		self.pause = 0
		self.collision = 0



	async def update(self, elapsed):
		if self.end == 1:
			# Update the ball and paddles positions
			res = self.ball.update(self.paddle1, self.paddle2, elapsed)
			self.paddle1.update()
			self.paddle2.update()
			
			# Check the result of the ball update
			if res == 1:
				# self.paddle1.restart()
				# self.paddle2.restart()
				self.score[self.players[0].userId] += 1
			elif res == 2:
				# self.paddle1.restart()
				# self.paddle2.restart()
				self.score[self.players[1].userId] += 1
			elif res == 3:
				self.collision = 1

			# Check if any player has reached the finish score
			if self.score[self.players[0].userId] >= self.finish_score or self.score[self.players[1].userId] >= self.finish_score:
				# Cancel tasks and cleanup
				self.cancel_tasks()
				self.end = 0
				winner = None
				if self.score[self.players[0].userId] > self.score[self.players[1].userId]:
					winner = self.players[0]
				elif self.score[self.players[0].userId] < self.score[self.players[1].userId]:
					winner = self.players[1]
				await self.end_game(winner, self.score[self.players[0].userId], self.score[self.players[1].userId], False)
		else:
			print('ERROR: THE GAME IS SUPPOSED TO BE ENDED SELF.END = 0')




# online
	async def end_game(self, winner, score_p1, score_p2, give_up):
		print('ending game .')
		is_draw = False

		# determining wich score is winners score
		if score_p1 > score_p2:
			winner_points = score_p1 
			loser_points = score_p2
		elif score_p1 < score_p2:
			winner_points = score_p2 
			loser_points = score_p1
		elif score_p1 == score_p2:
			winner_points = score_p1
			loser_points = score_p1
			is_draw = True

		# getting winner and loser profiles
		try:
			winner_profile = None
			loser_profile = None
			p1 = self.players[0]
			p2 = self.players[1]

			profile1 = self.profiles[p1.userId]
			profile2 = self.profiles[p2.userId]
			if winner is not None:
				if p1.userId == winner.userId:
					print('/////////////////////////////////setting winnerId to ', p1.userId)
					winner_profile = profile1
					self.winnerId = p1.userId
					loser_profile = profile2
				elif p2.userId == winner.userId:
					print('/////////////////////////////////setting winnerId to ', p2.userId)
					winner_profile = profile2
					self.winnerId = p2.userId
					loser_profile = profile1

		except Exception as e:
			print('error determining profiles:', e)

		# create FinishedGame object in DB from model
		try:
			winner_username = await sync_to_async(lambda: getattr(winner_profile.user, 'username'))() if winner_profile else None
			await sync_to_async(FinishedGame.objects.create)(
				winner=winner_username,
				draw=is_draw,
				give_up=give_up,
				pts_player1=score_p1,
				pts_player2=score_p2,
				player1=profile1,
				player2=profile2
			)
			self.score_p1 = score_p1
			self.score_p2 = score_p2
		except Exception as e:
			print('error creating finished_game:', e)

		# Update stats
		try:
			await self.update_stats(profile1, winner_profile, winner_points, loser_points)
			await self.update_stats(profile2, winner_profile, loser_points, winner_points)
		except Exception as e:
			print('error updating stats:', e)

		# Send game over message to players
		if (give_up == False):
			await self.send_game_over_message('end_game')
		self.cleaned = True



	@database_sync_to_async
	def update_stats(self, profile, winner_profile, points_scored, points_conceded):
		if profile and hasattr(profile, 'stats'):
			stats = profile.stats
			stats.games_played += 1
			if profile == winner_profile:
				stats.wins += 1
			elif winner_profile is None:
				stats.draws += 1
			else:
				stats.losses += 1
			stats.ptd_scored += points_scored
			stats.ptd_conceded += points_conceded
			if stats.games_played > 0:
				stats.win_rate = round((stats.wins / stats.games_played) * 100, 1)
				stats.lose_rate = round((stats.losses / stats.games_played) * 100, 1)
				stats.draw_rate = round((stats.draws / stats.games_played) * 100, 1)
				if stats.ptd_scored == 0 or stats.ptd_conceded == 0:
					stats.goals_ratio = 0
				else:
					stats.goals_ratio = round(stats.ptd_scored / stats.ptd_conceded, 1)
			stats.save()
			print(f'profile {profile.user.username} stats updated.')

	# boucle du jeu (update et envoie de position aux joueurs)
	async def game_loop(self):
		lastTime = time.monotonic()
		while self.end == 1:
			currentTime = time.monotonic()
			delta = ( currentTime - lastTime) * 1000
			# print(f'delta = {delta:.6f} ms')
			lastTime = currentTime
			await self.update(10)
			# print('TETSTETSTETSTETSTETST')
			for player in self.players:
				await player.send(text_data=json.dumps({
					'action': 'update_game',
					'right_bar_position': self.paddle2.position,
					'left_bar_position': self.paddle1.position,
					'ball_position': self.ball.position,
					'score_p1': self.score[self.players[0].userId],
					'score_p2': self.score[self.players[1].userId]
				}))
			await asyncio.sleep(self.update_interval)
			# await asyncio.sleep(2)

	async def update_game(self, elapsed):
		# start = time.monotonic()
		await self.update(elapsed)
		# print('elapsed = ', elapsed)
		for player in self.players:
			await player.send(text_data=json.dumps({
				'action': 'update_game',
				'right_bar_position': self.paddle2.position,
				'left_bar_position': self.paddle1.position,
				'ball_position': self.ball.position,
				'username_p1': self.players[0].username,
				'username_p2': self.players[1].username,
				'score_p1': self.score[self.players[0].userId],
				'score_p2': self.score[self.players[1].userId],
				'collision': self.collision
			}))
			if (self.collision == 1):
				self.collision = 0
			# end = time.monotonic()
			# delta = (start - end) * 1000
			# print(f'delta = {delta:.6f} ms')

	# async def game_loop(self):
	# 	lastTime = time.monotonic()
	# 	while self.end == 1:
	# 		currentTime = time.monotonic()
	# 		delta = (currentTime - lastTime) * 1000
	# 		print(f'delta = {delta:.6f} ms')
	# 		lastTime = currentTime

	# 		# Move the ball straight along the x-axis
	# 		self.ball.position['x'] += self.ball.velocity['x']

	# 		# Reset ball position if it goes out of bounds
	# 		if self.ball.position['x'] < 0 or self.ball.position['x'] > 1:
	# 			self.ball.position['x'] = 0.5

	# 		# Send the updated positions to the players
	# 		for player in self.players:
	# 			await player.send(text_data=json.dumps({
	# 				'action': 'update_game',
	# 				'right_bar_position': self.paddle2.position,
	# 				'left_bar_position': self.paddle1.position,
	# 				'ball_position': self.ball.position,
	# 				'score_p1': self.score[self.players[0].userId],
	# 				'score_p2': self.score[self.players[1].userId]
	# 			}))

	# 		await asyncio.sleep(self.update_interval)




	# Lancer la tâche asyncio
	async def start_game_loop(self, elapsed):
		for player in self.players:
			player.score = 0
		print("starting asyncio gameLoop")
		self.score[self.players[0].userId] = 0
		self.score[self.players[1].userId] = 0
		self.end = 1
		await self.update_game(elapsed)
		# if (self.loop_task == None):
		# 	self.loop_task = asyncio.create_task(self.game_loop())
		# else:
		# 	self.loop_task.cancel()
		# 	self.loop_task = None
		# 	self.loop_task = asyncio.create_task(self.game_loop())
		# 	print('ERROR:CANCELING OLD TASK ANS STARTING A NEW ONE')

	# # arrete la boucle principale du jeu
	def cancel_tasks(self):
		print('canceling an asyncio task')
		if self.loop_task is not None:
			self.loop_task.cancel()
			self.loop_task = None   # Reset the task reference

	async def add_player(self, player):
		if len(self.players) < 2:
			self.players.append(player)
			await self.add_player_profile(player.userId)
			return True
		return False


	async def add_player_profile(self, playerId):
		# await self.profiles.append(Profil.objects.get(user__id=playerId))
		self.profiles[playerId] = await sync_to_async(Profil.objects.get)(user__id=playerId)
		# self.profiles.append(profile)

	def remove_player(self, player):
		if player in self.players:
			self.players.remove(player)
			del self.profiles[player.userId]
			return True
		return False

	def remove_all_players(self):
		self.players.clear()
		self.profiles.clear()
	
	def get_number_of_players(self):
		return len(self.players)

	def new_game(self):
		self.score = {'p1' : 0, 'p2' : 0}
		self.paddle1.restart()
		self.paddle2.restart()
		self.ball.restart()
		self.end = 1

	async def send_game_over_message(self, origin):
		print('getting in send_game_over_message from : ', origin);
		for player in self.players:
			if self.is_tournament_game == False:
				print('sending G_O message to user with id: ', player.userId)
				await player.send(text_data=json.dumps({
					'action': 'game_over',
					'message': 'game endend via end_game',
					'origin': origin,
				}))
			else:
				print("self.winnerId = ", self.winnerId)
				await player.send(text_data=json.dumps({
					'action': 'send_winner',
					'winnerId': self.winnerId,
					'score_p1': self.score[self.players[0].userId],
					'score_p2': self.score[self.players[1].userId],
				}))

	async def cleanup(self, give_up, giving_up_id):
		if self.cleaned == False:
			scoreP1 = self.score[self.players[0].userId]
			scoreP2 = self.score[self.players[1].userId]
			winner = self.players[0] if self.players[1].userId == giving_up_id else self.players[0]
			print('GETTING IN ENDGAME FROM CLEANUP WITH WINNER = ', winner)
			await self.end_game(winner, scoreP1, scoreP2, give_up)

	def __del__(self):
		print('DELETING GAME')
		# self.cancel_tasks()
		# self.send_game_over_message()


# class Paddle:
# 	def __init__(self, position):
# 		self.position = position
# 		self.velocity = {'x': 0, 'y': 0}
# 		self.height = 0.1
# 		self.width = 0.01

# 	def update(self):
# 		new_y_position = self.position['y'] + self.velocity['y']
# 		if 0 <= new_y_position <= 1 - self.height:
# 			self.position['y'] = new_y_position

# 	def restart(self):
# 		self.position['y'] = 0.45


# class Ball:
# 	def __init__(self):
# 		self.position = {'x': 0.5, 'y': 0.5}
# 		self.speed = 0.001
# 		self.rand = random.random() - 0.5
# 		self.rand2 = random.choice([-1, 1])
# 		self.direction = {
# 			'x': self.speed * (1 - abs(self.rand)) * self.rand2,
# 			'y': self.speed * abs(self.rand)
# 		}
# 		self.velocity = {'x': self.direction['x'], 'y': self.direction['y']}
# 		self.height = 0.01 / 0.6
# 		self.width = 0.01
# 		self.paddleCollision = 0 if self.rand2 > 0 else 1

# 	def restart(self):
# 		self.speed = 0.001
# 		self.rand = random.random() - 0.5
# 		self.rand2 *= -1
# 		self.direction = {
# 			'x': self.speed * (1 - abs(self.rand)) * self.rand2,
# 			'y': self.speed * abs(self.rand)
# 		}
# 		self.position = {'x': 0.5, 'y': 0.5}
# 		self.velocity = {'x': self.direction['x'], 'y': self.direction['y']}
# 		self.paddleCollision = 0 if self.rand2 > 0 else 1

# 	def update(self, paddle1, paddle2):
# 		if 0 <= self.position['y'] + self.velocity['y'] <= 1 - self.height:
# 			self.position['y'] += self.velocity['y']
# 		else:
# 			self.velocity['y'] *= -1

# 		rightSide = self.position['x'] + self.width + self.velocity['x']
# 		leftSide = self.position['x']
# 		bottomSide = self.position['y'] + self.height
# 		topSide = self.position['y']

# 		if (leftSide <= paddle1.position['x'] + paddle1.width and
# 			bottomSide >= paddle1.position['y'] and
# 			topSide <= paddle1.position['y'] + paddle1.height and
# 			self.paddleCollision == 1):
# 			self.speed += 0.0005
# 			self.collision(paddle1)
# 			self.paddleCollision = 0
# 			return 3
# 		elif (rightSide >= paddle2.position['x'] and
# 				bottomSide >= paddle2.position['y'] and
# 				topSide <= paddle2.position['y'] + paddle2.height and
# 				self.paddleCollision == 0):
# 			self.speed += 0.0005
# 			self.collision(paddle2)
# 			self.velocity['x'] *= -1
# 			self.paddleCollision = 1
# 			return 3
# 		elif self.position['x'] + self.velocity['x'] < 0:
# 			self.restart()
# 			return 1
# 		elif self.position['x'] + self.width + self.velocity['x'] > 1:
# 			self.restart()
# 			return 2
# 		self.position['x'] += self.velocity['x']
# 		return 0

# 	def collision(self, paddle):
# 		delta = ((self.position['y'] + self.height / 2) - (paddle.position['y'] + paddle.height / 2)) / paddle.height
# 		self.velocity['x'] = self.speed * (1 - abs(delta))
# 		self.velocity['y'] = self.speed * delta


# class Game:
# 	def __init__(self):
# 		self.cleaned = False
# 		self.paddle1 = Paddle({'x': 0.01, 'y': 0.45})
# 		self.paddle2 = Paddle({'x': 0.98, 'y': 0.45})
# 		self.ball = Ball()
# 		self.finish_score = 11
# 		self.players = []
# 		self.score = {}
# 		self.index = 0
# 		self.profiles = {}
# 		self.loop_task = None
# 		self.send_task = None
# 		self.update_interval = 0.16  # Approximately 60 FPS
# 		self.send_interval = 0.33  # Approximately 30 FPS
# 		self.end = 1
# 		self.pause = 0
# 		self.collision = 0

# 	async def update(self):
# 		if self.end == 1:
# 			self.paddle1.update()
# 			self.paddle2.update()
# 			res = self.ball.update(self.paddle1, self.paddle2)
# 			if res == 1:
# 				self.paddle1.restart()
# 				self.paddle2.restart()
# 				self.score[self.players[0].userId] += 1
# 			elif res == 2:
# 				self.paddle1.restart()
# 				self.paddle2.restart()
# 				self.score[self.players[1].userId] += 1
# 			elif res == 3:
# 				self.collision = 1

# 			if (self.score[self.players[0].userId] >= self.finish_score or
# 					self.score[self.players[1].userId] >= self.finish_score):
# 				winner = (self.players[0] if self.score[self.players[0].userId] > self.score[self.players[1].userId]
# 							else self.players[1] if self.score[self.players[0].userId] < self.score[self.players[1].userId]
# 							else None)
# 				await self.end_game(winner, self.score[self.players[0].userId], self.score[self.players[1].userId], False)

# 	async def send_positions(self):
# 		if self.end == 1:
# 			for player in self.players:
# 				await player.send(text_data=json.dumps({
# 					'action': 'update_game',
# 					'right_bar_position': self.paddle2.position,
# 					'left_bar_position': self.paddle1.position,
# 					'ball_position': self.ball.position,
# 					'score_p1': self.score[self.players[0].userId],
# 					'score_p2': self.score[self.players[1].userId]
# 				}))

# 	async def end_game(self, winner, score_p1, score_p2, give_up):
# 		print('ending game .')
# 		is_draw = score_p1 == score_p2

# 		try:
# 			profile1, profile2 = self.profiles[self.players[0].userId], self.profiles[self.players[1].userId]
# 			winner_profile, loser_profile = (profile1, profile2) if self.players[0] == winner else (profile2, profile1)
# 		except Exception as e:
# 			print('error determining profiles:', e)
# 			winner_profile, loser_profile = None, None

# 		try:
# 			winner_username = await sync_to_async(lambda: getattr(winner_profile.user, 'username'))() if winner_profile else None
# 			await sync_to_async(FinishedGame.objects.create)(
# 				winner=winner_username,
# 				draw=is_draw,
# 				give_up=give_up,
# 				pts_player1=score_p1,
# 				pts_player2=score_p2,
# 				player1=profile1,
# 				player2=profile2
# 			)
# 		except Exception as e:
# 			print('error creating finished_game:', e)

# 		try:
# 			await self.update_stats(profile1, winner_profile, score_p1, score_p2)
# 			await self.update_stats(profile2, winner_profile, score_p2, score_p1)
# 		except Exception as e:
# 			print('error updating stats:', e)

# 		await self.send_game_over_message('end_game')

# 		self.cancel_tasks()
# 		self.cleaned = True
# 		self.end = 0

# 	@database_sync_to_async
# 	def update_stats(self, profile, winner_profile, points_scored, points_conceded):
# 		if profile and hasattr(profile, 'stats'):
# 			stats = profile.stats
# 			stats.games_played += 1
# 			if profile == winner_profile:
# 				stats.wins += 1
# 			elif winner_profile is None:
# 				stats.draws += 1
# 			else:
# 				stats.losses += 1
# 			stats.ptd_scored += points_scored
# 			stats.ptd_conceded += points_conceded
# 			if stats.games_played > 0:
# 				stats.win_rate = stats.wins / stats.games_played
# 				stats.lose_rate = stats.losses / stats.games_played
# 				stats.draw_rate = stats.draws / stats.games_played

# 			stats.save()
# 			print(f'profile {profile.user.username} stats updated.')

# 	async def game_loop(self):
# 		while self.end == 1:
# 			await self.update()
# 			await asyncio.sleep(self.update_interval)

# 	async def send_loop(self):
# 		while self.end == 1:
# 			await self.send_positions()
# 			await asyncio.sleep(self.send_interval)

# 	def start_game_loop(self, update_interval, send_interval):
# 		self.update_interval = update_interval
# 		self.send_interval = send_interval
# 		print("starting asyncio gameLoop")
# 		self.score[self.players[0].userId] = 0
# 		self.score[self.players[1].userId] = 0
# 		self.end = 1
# 		if self.loop_task is None:
# 			self.loop_task = asyncio.create_task(self.game_loop())
# 		else:
# 			self.loop_task.cancel()
# 			self.loop_task = asyncio.create_task(self.game_loop())
# 			print('ERROR: CANCELING OLD TASK AND STARTING A NEW ONE')

# 		if self.send_task is None:
# 			self.send_task = asyncio.create_task(self.send_loop())
# 		else:
# 			self.send_task.cancel()
# 			self.send_task = asyncio.create_task(self.send_loop())
# 			print('ERROR: CANCELING OLD TASK AND STARTING A NEW ONE')

# 	def cancel_tasks(self):
# 		print('canceling asyncio tasks')
# 		if self.loop_task is not None:
# 			self.loop_task.cancel()
# 			self.loop_task = None
# 		if self.send_task is not None:
# 			self.send_task.cancel()
# 			self.send_task = None

# 	async def add_player(self, player):
# 		if len(self.players) < 2:
# 			self.players.append(player)
# 			await self.add_player_profile(player.userId)
# 			return True
# 		return False

# 	async def add_player_profile(self, playerId):
# 		self.profiles[playerId] = await sync_to_async(Profil.objects.get)(user__id=playerId)

# 	def remove_player(self, player):
# 		if player in self.players:
# 			self.players.remove(player)
# 			del self.profiles[player.userId]
# 			return True
# 		return False

# 	def remove_all_players(self):
# 		self.players.clear()
# 		self.profiles.clear()

# 	def get_number_of_players(self):
# 		return len(self.players)

# 	def new_game(self):
# 		self.score = {'p1': 0, 'p2': 0}
# 		self.paddle1.restart()
# 		self.paddle2.restart()
# 		self.ball.restart()
# 		self.end = 1

# 	async def send_game_over_message(self, origin):
# 		for player in self.players:
# 			print('sending G_O message to user with id: ', player.userId)
# 			await player.send(text_data=json.dumps({
# 				'action': 'game_over',
# 				'message': 'game ended via end_game',
# 				'origin': origin,
# 			}))

# 	async def cleanup(self, give_up):
# 		if not self.cleaned:
# 			scoreP1 = self.score[self.players[0].userId]
# 			scoreP2 = self.score[self.players[1].userId]
# 			winner = self.players[0] if scoreP1 > scoreP2 else (self.players[1] if scoreP1 < scoreP2 else None)
# 			print('GETTING IN ENDGAME FROM CLEANUP')
# 			await self.end_game(winner, scoreP1, scoreP2, give_up)

# 	def __del__(self):
# 		print('DELETING GAME')