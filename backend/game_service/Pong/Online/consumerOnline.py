from channels.generic.websocket import AsyncWebsocketConsumer
import json
from game_service.Pong.GameLogic import GameLogic

class PongConsumerOnline(AsyncWebsocketConsumer):
	gameLogic = None
	userId = 0
	username = None
	
	async def connect(self):
		await self.accept()
		self.gameLogic = GameLogic(ConsumerClient=self, is_online=True, is_local=False)
		print('\U0001F7E2 Connected to Online Consumer')
	
	async def receive(self, text_data):
		dataJson = json.loads(text_data)
		self.userId = dataJson.get('userId')
		await self.gameLogic.recieve(dataJson)

	async def disconnect(self, close_code):
		await self.gameLogic.disconnect()