import random

class Ball:
	def __init__(self):
		self.position = {'x' : 0.5, 'y' : 0.5}
		self.initial_speed = 0.0075
		self.speed = 0.0075
		self.rand = random.random() - 0.5
		self.rand2 = random.random() - 0.5
		self.rand2 = self.rand2 / abs(self.rand2)
		self.direction = {
			'x' : self.speed * (1 - abs(self.rand)) * self.rand2,
			'y' : self.speed * (abs(self.rand)) * self.rand / abs(self.rand)
		}
		self.velocity = {'x' : self.direction['x'], 'y' : self.direction['y']}
		self.height = 0.015 / 0.6
		self.width = 0.015
		self.radius = 0.007
		self.paddleCollision = 0 if self.rand2 > 0 else 1
	
	def restart(self):
		self.speed = self.initial_speed
		self.rand = random.random() - 0.5
		self.rand2 *= -1
		self.direction = {
			'x' : self.speed * (1 - abs(self.rand)) * self.rand2,
			'y' : self.speed * (abs(self.rand)) * self.rand / abs(self.rand)
		}
		self.position = {'x' : 0.5, 'y' : 0.5}
		self.velocity = {'x' : self.direction['x'], 'y' : self.direction['y']}
		self.paddleCollision = 0 if self.rand2 > 0 else 1

	def update(self, paddle1, paddle2, elapsed):

		# collision haut bas
		if (self.position['y'] - (self.height / 2) + self.velocity['y'] > 0
			and self.position['y'] + self.height + self.velocity['y'] < 1):
			self.position['y'] += self.velocity['y']
		else:
			self.velocity['y'] *= -1
		
		rightSide = self.position['x'] + self.velocity['x'] + self.radius
		leftSide = self.position['x'] + self.velocity['x']
		bottomSide = self.position['y'] + self.radius + self.velocity['y']
		topSide = self.position['y'] - self.radius + self.velocity['y']


		# colision paddle
		if (leftSide <= paddle1.position['x'] + paddle1.width and
			bottomSide >= paddle1.position['y'] and
			topSide <= paddle1.position['y'] + paddle1.height and
			self.paddleCollision == 1):
			# self.position['x'] = paddle1.position['x'] + paddle1.width  # Ajuster la position de la balle
			self.speed += 0.00075
			self.collision(paddle1)
			# self.velocity['x'] *= -1
			self.paddleCollision = 0
			return 3

		elif (rightSide >= paddle2.position['x'] and
			bottomSide >= paddle2.position['y'] and
			topSide <= paddle2.position['y'] + paddle2.height and
			self.paddleCollision == 0):
			self.speed += 0.00075
			self.collision(paddle2)
			self.velocity['x'] *= -1
			self.paddleCollision = 1
			return 3

		# comptage de points
		elif (self.position['x'] + self.velocity['x'] < 0):
			self.restart()
			return(1)
		elif (self.position['x'] + self.width + self.velocity['x'] > 1):
			self.restart()
			return(2)
		self.position['x'] += (self.velocity['x'])
		return(0)

	def collision(self, paddle):
		delta = ((self.position['y'] + self.height / 2) - (paddle.position['y'] + paddle.height / 2)) / (paddle.height)
		self.velocity['x'] = self.speed * (1 - abs(delta))
		self.velocity['y'] = self.speed * (delta)
