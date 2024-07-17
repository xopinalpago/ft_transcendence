from django.shortcuts import render, redirect
import json
from django.http import  HttpResponse, Http404, JsonResponse, HttpResponseBadRequest
from django.contrib.auth.models import User, AnonymousUser
from auth_service.forms import LoginUserForm, CreateUserForm
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from auth_service.models import Profil
from django.utils import timezone
from django.middleware.csrf import get_token
from game_service.models import Tournament, Match
from django.db.models import Q
from django.conf import settings
from game_service.Pong.GameLogic import onlineGames

# Create your views here.
def index(request, id):
    profil = Profil.objects.get(user_id=id)
    return render(request, "game_service/index.html", {'profile': profil, 'is_in_tournament': profil.is_in_tournament, 'is_in_lobby': profil.is_in_lobby})

def get_tournament_name(request, id):
    profil = Profil.objects.get(user_id=id)
    tournament = Tournament.objects.get(users=profil, is_active=True)
    if (tournament):
        return JsonResponse({'tournament_name': tournament.name})
    else:
        return JsonResponse({'tournament_name': False})
    
def is_in_lob_or_tour(request, id):
    profil = Profil.objects.get(user_id=id)
    if (profil.is_in_tournament or profil.is_in_lobby):
        tournament = Tournament.objects.get(users=profil, is_active=True)
        print("tournament ======================", tournament)
        if (tournament):
            return JsonResponse({'test': True, 'tournament_name': tournament.name})
        else:
            return JsonResponse({'test': False})
    else:
        return JsonResponse({'test': False})


def get_match_id(request, id, tournament_name):
    # profil = Profil.objects.get(user_id=id)
    tournament = Tournament.objects.filter(name=tournament_name).first()
    if (tournament and tournament.is_active == True):
        match_id = get_match_id_for_user(id, tournament.round_number, tournament)
        return JsonResponse({'match_id': match_id})
    elif (tournament and tournament.is_active == False):
        return JsonResponse({'match_id': False})
    return JsonResponse({'match_id': None})

def get_match_id_for_user(user_id, nb_round, tournament):
    match = Match.objects.filter(player1__user_id=user_id, nb_round=nb_round, tournament=tournament).first()
    if match:
        return match.match_id
    match = Match.objects.filter(player2__user_id=user_id, nb_round=nb_round, tournament=tournament).first()
    if match:
        return match.match_id
    return None
    
def pong_local_view(request, id):
    return render(request, 'game_service/pong.html')

def pong_VSIA_view(request, id):
    return render(request, 'game_service/pongVSIA.html')

def online_game_view(request, id,  gameId):
    game = None
    print(f'\U0001F7E0 in onlineGAMEVIEW')
    if gameId in onlineGames:
        game = onlineGames.get(gameId)
        print(f'\U0001F7E0 game in onlineGAMEVIEW = {game.gameId} with nb players: {game.get_number_of_players()}')
        print("gameId ==================== ", gameId)
        print("game ==================== ", game)
        print("gamenb ==================== ", game.get_number_of_players())
    else:
        print('NO GAME FOUND')
    if ((game and game.get_number_of_players() < 2)) or ((game and game.get_number_of_players() == 2 and '_' in gameId)):
        print('game_service/pong_online.htmllllllllllllllllllll')
        return render(request, 'game_service/pong_online.html', {'success': True})
    else:
        print('40444444444444444444444444')
        return JsonResponse({'success': False, 'error': 'Game not found'}, status=404)


def lobby_view(request, id, tournament_name):
    tournament = Tournament.objects.filter(name=tournament_name).first()
    # print("tournament.name = ", tournament.name)
    return render(request, 'game_service/lobby.html', {'tournament_name': tournament_name, 'tournament': tournament})

def tounament_view(request, id, tournament_name):
    tournament = Tournament.objects.filter(name=tournament_name).first()
    user = Profil.objects.get(user_id=id)
    if (tournament.winner):
        return render(request, 'game_service/tournament.html', {'tournament_name': tournament_name, 'ready_or_not': 'Back to Menu'})
    match = Match.objects.filter((Q(player1=user) | Q(player2=user)), nb_round=tournament.round_number, tournament=tournament).first()
    if (match):
        if (match.player1 == user and match.player1_ready):
            ready_or_not = 'Not Ready'
        elif (match.player2 == user and match.player2_ready):
            ready_or_not = 'Not Ready'
        else:
            ready_or_not = 'Ready'
    else:
        ready_or_not = 'Ready'
    return render(request, 'game_service/tournament.html', {'tournament_name': tournament_name, 'ready_or_not': ready_or_not})
