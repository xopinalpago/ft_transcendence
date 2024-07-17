class Paddle:
    def __init__(self, position):
        self.position = position
        self.velocity = {'x': 0, 'y': 0}
        self.speed = 0.011
        self.height = 0.15
        self.width = 0.01

    def update(self):
        new_y_position = self.position['y'] + self.velocity['y']
        if 0 <= new_y_position <= 1 - self.height:
            self.position['y'] = new_y_position

    def restart(self):
        self.position['y'] = 0.45
