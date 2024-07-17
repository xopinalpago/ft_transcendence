import time
from datetime import datetime, timedelta
from asgiref.sync import sync_to_async
import asyncio
import json
from django.db import models

# class TimerManager(models.Model):
#     def __init__(self):
#         # self.tournament_name = tournament_name
#         # print("TimerManagerrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr")
#         self.timer_task = None  # Instance de la tâche de chronomètre
#         self.is_timer_running = False  # Indicateur si le chronomètre est en cours

#     async def start_timer(self, player, duration_minutes):
#         self.timer_task = asyncio.create_task(self.launch_timer(player, duration_minutes))

#     async def launch_timer(self, player, duration_minutes):
#         print('INITIALISATION TIMER ======')
#         if not self.is_timer_running:
#             self.is_timer_running = True
#             end_time = datetime.now() + timedelta(minutes=duration_minutes)
#             while datetime.now() < end_time:
#                 remaining_time = (end_time - datetime.now()).seconds
#                 await player.send(text_data=json.dumps({
#                         'type': 'timer_message',
#                         'content': 'timer',
#                         'remaining_time': remaining_time}))
#                 print("remaining_time = ",remaining_time)
#                 await asyncio.sleep(1)
#             self.is_timer_running = False

#     def stop_timer(self):
#         self.is_timer_running = False
#         print("timer_task", self.timer_task)
#         if self.timer_task:
#             self.timer_task.cancel()
#             self.timer_task = None

#     def is_timer_active(self):
#         return self.is_timer_running