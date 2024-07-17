from game_service.Pong.Pong import Pong

class PongLocal(Pong):
	pause = 0
	scored = 0

# Add Player
	async def add_player(self, player):
		if len(self.players) < 1:
			self.players.append(player)
			return True
		return False

# Remove Player
	def remove_player(self, player):
		if player in self.players:
			self.players.remove(player)
			return True
		return False

# Check_for_end
	async def check_for_end(self):
		if self.score['p1'] >= self.finish_score or self.score['p2'] >= self.finish_score:
			self.end = 0
			self.cleaned = True

# clean Local Game
	async def clean_local_game(self, game):
		self.end = 0
		self.cleaned = True
		await game.set_users_in_game(False)

	def __del__(self):
		print('\U0001F7E2 DELETING LOCAL GAME')