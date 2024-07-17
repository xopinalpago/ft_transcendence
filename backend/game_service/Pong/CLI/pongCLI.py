from game_service.Pong.Pong import Pong
from rest_framework.response import Response

cliGames= {}

class PongCLI(Pong):

# Create game
	def create_game(self):
		self.isCli = True
		self.init_score()

# Update game
	def update_game(self, request):
		# move paddle
		print('\U0001F7E2 request = ', request.data)
		left_direction = request.data.get('left_direction')
		right_direction = request.data.get('right_direction')
		self.updatePaddleVelocity(self.paddle1, left_direction)
		self.updatePaddleVelocity(self.paddle2, right_direction)

		# update_pos
		update_state = self.update_pong_cli()
		# getScore
		score = self.get_score()
		if (update_state == 'end_game'):
			return Response({'end_game': 'game ended',
							'score_p1': score['p1'],
							'score_p2': score['p2'],}, status=401)

		return Response({'data': {'ball_position': self.ball.position,
								'left_paddle_position': self.paddle1.position,
								'right_paddle_position': self.paddle2.position,
								'score_p1': score['p1'],
								'score_p2': score['p2'],
								}}, status=200)

# Update paddle velocity
	def updatePaddleVelocity(self, paddle, direction):
		if direction == "up":
			paddle.velocity['y'] = -paddle.speed
		elif direction == "down":
			paddle.velocity['y'] = paddle.speed
		elif direction == "":
			paddle.velocity['y'] = 0

# Update pong cli
	def update_pong_cli(self):
		if self.end == 1:
			# update ball and paddle
			res = self.ball.update(self.paddle1, self.paddle2, 0)
			self.paddle1.update()
			self.paddle2.update()
			# update score
			self.update_score(res)
			# check for end
			self.check_for_end()
			return 'success'
		else:
			return'end_game'

# Check for end
	def check_for_end(self):
		if self.score['p1'] >= self.finish_score or self.score['p2'] >= self.finish_score:
			self.end = 0
			self.cleaned = True

# Get game state
	def get_game_state(self):
		if (self.end == 1):
			score = self.get_score()
			return Response({'data': {'ball_position': self.ball.position,
								'left_paddle_position': self.paddle1.position,
								'right_paddle_position': self.paddle2.position,
								'score p1': score['p1'],
								'score p2': score['p2'],
								}}, status=200)
		else:
			return Response({'error': 'game is not running'}, status=400)
