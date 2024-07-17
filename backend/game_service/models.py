from django.db import models
# from django.contrib.auth.models import User
from auth_service.models import Profil
import random

class Tournament(models.Model):
    name = models.CharField(max_length=15, default='Tournament')
    creator = models.ForeignKey(Profil, on_delete=models.SET_NULL, related_name='created_tournaments', null=True)
    survivor = models.ForeignKey(Profil, on_delete=models.SET_NULL, related_name='survivor_tournaments', null=True)
    winner = models.ForeignKey(Profil, on_delete=models.CASCADE, related_name='winner_tournaments', null=True)
    nb_player_direct = models.IntegerField(default=0)
    nb_player = models.IntegerField(default=0)
    round_number = models.IntegerField(default=0)
    is_complete = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    users = models.ManyToManyField(Profil, related_name='participating_tournaments')
    matches_created = models.BooleanField(default=False)
    def __str__(self):
        return f'{self.name}'

class Match(models.Model):
    match_id = models.CharField(max_length=30, null=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, null=True)
    player1 = models.ForeignKey(Profil, related_name='matches_as_player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(Profil, related_name='matches_as_player2', on_delete=models.CASCADE)
    player1_ready = models.BooleanField(default=False)
    player2_ready = models.BooleanField(default=False)    
    nb_round = models.IntegerField(default=0)
    winner = models.ForeignKey(Profil, related_name='matches_won', null=True, blank=True, on_delete=models.SET_NULL)
    loser = models.ForeignKey(Profil, related_name='matches_los', null=True, blank=True, on_delete=models.SET_NULL)
    score_winner = models.IntegerField(default=0)
    score_loser = models.IntegerField(default=0)
    def __str__(self):
        return f'{self.match_id}'

class GameCLI(models.Model):
    paddle_left_y = models.FloatField(default=0.5)
    paddle_right_y = models.FloatField(default=0.5)
    ball_x = models.FloatField(default=0.5)
    ball_y = models.FloatField(default=0.5)
    ball_vx = models.FloatField(default=0.01)
    ball_vy = models.FloatField(default=0.01)
    score_left = models.IntegerField(default=0)
    score_right = models.IntegerField(default=0)
    def __str__(self):
        return f"Game {self.id}"
    
class FinishedGame(models.Model):
    end_date = models.DateTimeField(auto_now_add=True)
    winner = models.CharField(max_length=50, blank=True, null=True, default=None)
    draw = models.BooleanField(default=False)
    give_up = models.BooleanField(default=False)
    winner_points = models.IntegerField(default=0)
    loser_points = models.IntegerField(default=0)
    pts_player1 = models.IntegerField(default=0)
    pts_player2 = models.IntegerField(default=0)
    player1 = models.ForeignKey(Profil, on_delete=models.CASCADE, related_name='games_as_player1', blank=True, null=True)
    player2 = models.ForeignKey(Profil, on_delete=models.CASCADE, related_name='games_as_player2', blank=True, null=True)