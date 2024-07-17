from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from auth_service.models import Profil
from auth_service.models import Stats

class ProfilAdmin(admin.ModelAdmin):
    list_display = ('user', 'logged_in')

admin.site.register(Profil, ProfilAdmin)

class StatsAdmin(admin.ModelAdmin):
    list_display = ('games_played', 'wins', 'losses', 'draws', 'ptd_scored', 'ptd_conceded', 'win_rate', 'lose_rate', 'draw_rate')

admin.site.register(Stats, StatsAdmin)
