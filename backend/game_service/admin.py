from django.contrib import admin
from game_service.models import FinishedGame
from game_service.models import Tournament, Match

admin.site.register(Tournament)
admin.site.register(Match)

class FinishedGameAdmin(admin.ModelAdmin):
    list_display = ('winner', 'end_date', 'pts_player1', 'pts_player2', 'player1', 'player2')

admin.site.register(FinishedGame, FinishedGameAdmin)
