from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from auth_service.models import Profil
from game_service.models import FinishedGame
from game_service.Pong.Pong import Pong
import json

class PongOnline(Pong):
	is_tournament_game = False
	profiles = {}
	winnerId = None
	giving_up_id = None
	index = 0

# Add Player
	async def add_player(self, player):
		if len(self.players) < 2:
			self.players.append(player)
			await self.add_player_profile(player.userId)
			return True
		return False

# Remove Player
	def remove_player(self, player):
		if player in self.players:
			self.players.remove(player)
			del self.profiles[player.userId]
			return True
		return False

# add Player Profile
	async def add_player_profile(self, playerId):
		self.profiles[playerId] = await sync_to_async(Profil.objects.get)(user__id=playerId)

# Check_for_end
	async def check_for_end(self):
		if self.score[self.players[0].userId] >= self.finish_score or self.score[self.players[1].userId] >= self.finish_score:
			self.end = 0
			if self.score[self.players[0].userId] > self.score[self.players[1].userId]:
				self.winner = self.players[0]
			elif self.score[self.players[0].userId] < self.score[self.players[1].userId]:
				self.winner = self.players[1]
			await self.end_game(self.winner, self.score[self.players[0].userId], self.score[self.players[1].userId], False)

# End Game
	async def end_game(self, winner, score_p1, score_p2, give_up):
		print('\U0001F7E0 ending game .')

		# determining wich score is winners score
		if score_p1 > score_p2:
			winner_points = score_p1 
			loser_points = score_p2
		elif score_p1 < score_p2:
			winner_points = score_p2
			loser_points = score_p1

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
					winner_profile = profile1
					self.winnerId = p1.userId
					loser_profile = profile2
				elif p2.userId == winner.userId:
					winner_profile = profile2
					self.winnerId = p2.userId
					loser_profile = profile1
		except Exception as e:
			print('\U0001F534 error determining profiles:', e)

		# create FinishedGame object in DB from model
		try:
			winner_username = await sync_to_async(lambda: getattr(winner_profile.user, 'username'))() if winner_profile else None
			print(f'\U0001F7E0 winner = {winner_username} \n give_up = {give_up}, \n pts_player1 {score_p1}, \n pts_player2 {score_p2}, \n')
			await sync_to_async(FinishedGame.objects.create)(
				winner=winner_username,
				draw=False,
				give_up=give_up,
				winner_points=winner_points,
				loser_points=loser_points,
				pts_player1=score_p1,
				pts_player2=score_p2,
				player1=profile1,
				player2=profile2,
			)
				# winner_profile=winner_profile,
				# loser_profile=loser_profile
		except Exception as e:
			print('\U0001F534 error creating finished_game:', e)

		# Update stats
		try:
			await self.update_stats(winner_profile, winner_profile, winner_points, loser_points)
			await self.update_stats(loser_profile, winner_profile, loser_points, winner_points)
		except Exception as e:
			print('\U0001F534 error updating stats:', e)

		# Send game over message to players
		if (give_up == False):
			await self.send_game_over_message('end_game')
		self.cleaned = True
		print('\U0001F7E2 game ended successfully from PongOnline.end_game')


# Update Stats
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
			print(f'\U0001F7E2 profile {profile.user.username} stats updated successfully.')


#Send Game Over Message 
	async def send_game_over_message(self, origin):
		print('\U0001F7E0 getting in send_game_over_message from : ', origin);
		for player in self.players:
			if self.is_tournament_game == False:
				# Ending Message for 1v1 Online
				print('\U0001F7E0 sending G_O message to user with id: ', player.userId)
				await player.send(text_data=json.dumps({
					'action': 'game_over',
					'message': 'game endend via end_game',
					'origin': origin,
				}))
			else:
				# Ending Message for tournament game
				print("\U0001F7E0 sending tournament winnerId = ", self.winnerId)
				await player.send(text_data=json.dumps({
					'action': 'send_winner',
					'winnerId': self.winnerId,
					'score_p1': self.score[self.players[0].userId],
					'score_p2': self.score[self.players[1].userId],
				}))

# Cleanup used by consumer destructor to set data and execute end_game
	async def cleanup(self, give_up, giving_up_id):
		if self.cleaned == False:
			# getting winner player
			if (self.players[0].userId == giving_up_id):
				winner = self.players[1]
			elif (self.players[1].userId == giving_up_id):
				winner = self.players[0]
			else:
				winner = None
				print('\U0001F534 error: can not set giving_up_id')
			
			# execute end_game
			print('\U0001F7E0 getting in end_game from cleanup with winnerId: ', winner.userId)
			await self.end_game(winner, self.finish_score, 0, give_up)

	def __del__(self):
		print('\U0001F7E2 DELETING ONLINE GAME')