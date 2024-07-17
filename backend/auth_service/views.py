from django.shortcuts import render, redirect
import json
from django.http import HttpResponse, Http404, JsonResponse, HttpResponseBadRequest
from django.contrib.auth.models import User, AnonymousUser
from auth_service.forms import LoginUserForm, CreateUserForm, Enable2FAForm, Verify2FAForm
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from auth_service.models import Profil, Friend
from django.utils import timezone
from django.middleware.csrf import get_token
from django.contrib.auth import update_session_auth_hash
from itertools import chain
from PIL import Image
import re
import time
import pyotp
import qrcode
from django_otp.plugins.otp_totp.models import TOTPDevice
from pyotp import TOTP
from django_otp.oath import TOTP
from io import BytesIO
from binascii import hexlify
import os
from datetime import datetime, timedelta
from auth_service.templatetags.custom_filters import profile_to_json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import requests
from django.conf import settings
from .oauth_utils import create_42user, login_42user
from decouple import config
from django.views.decorators.csrf import csrf_exempt
from django.contrib.sessions.models import Session
from django.views.decorators.csrf import ensure_csrf_cookie


def check_refer(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.META.get('HTTP_REFERER'):
            return redirect('/')
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def check_auth_code(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.GET.get('code'):
            return redirect('/')
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def check_id_refer(view_func):
    def _wrapped_view(request, id, *args, **kwargs):
        if str(request.user.id) != str(id):
            return redirect('/')
        elif not request.META.get('HTTP_REFERER'):
            return redirect('/')
        return view_func(request, id, *args, **kwargs)
    return _wrapped_view

# @check_refer
# @csrf_exempt
@ensure_csrf_cookie
def request_api(request):
    print('request_api')
    if (request.method == 'POST'):
        try:
            data = json.loads(request.body)
            if (data['type'] == 'access_token'):
                data2 = {
                    'grant_type': 'authorization_code',
                    'client_id': config('CLIENT_ID'),
                    'client_secret': config('CLIENT_SECRET'),
                    'code': data.get('auth_code'),
                    'redirect_uri': f'https://{config('IP')}:8000/oauth42/'
                }
                response = requests.post('https://api.intra.42.fr/oauth/token', data=data2)
                if response.status_code == 200:
                    token_data = response.json()
                    access_token = token_data.get('access_token')
                    return JsonResponse({'access_token': access_token}, status=200)
            elif data['type'] == 'user_info':
                header = {
                    'Authorization': f'Bearer {data.get("access_token")}'
                }
                response2 = requests.get('https://api.intra.42.fr/v2/me', headers=header)
                if response2.status_code == 200:
                    user_data = response2.json()
                    username = user_data.get('login')
                    email = user_data.get('email')
                    return JsonResponse({'username': username, 'email': email}, status=200)
        except Exception as e:
            print("error :", e)
            return JsonResponse({'error': 'Failed to retrieve access token'}, status=500)
        print('Failed to retrieve access token1')
    return JsonResponse({'error': 'Failed to retrieve access token'}, status=500)

@check_auth_code
def oauth42(request):
    code = request.GET.get('code')
    if not code:
        return HttpResponse(request, status=500)
    else:
        return render(request, 'auth_service/index.html', {"code": code})
    
@check_refer
def handleOAuth42(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')

        if User.objects.filter(username=username).exists():
            if User.objects.filter(username=username).first().profil.auth_with_42:
                login_42user(request, username)
                user = User.objects.get(username=username)
                user_id = user.id
                device = TOTPDevice.objects.filter(user=user).first()
                if device:
                    return JsonResponse({'success': True, 'type': '2fa', 'user_id': user_id}, status=200)
                else:
                    return JsonResponse({'success': True, 'type': 'login', 'user_id': user_id}, status=200)
            else:
                return JsonResponse({'success': False, 'error': 'This username already exists. Try the login method.'}, status=200)
        else:
            if (create_42user(request, username, email) == False):
                return JsonResponse({'success': False, 'error': 'Sorry, an error occurred while attempting to create your account.'}, status=200)
            return JsonResponse({'success': True, 'type': 'signup'}, status=200)

@ensure_csrf_cookie
def refresh_view(request, id=None, tournament_name=None, gameId=None):
    return render(request, 'auth_service/index.html')

@ensure_csrf_cookie
def homepage(request):
    return render(request, 'auth_service/index.html')

@check_refer
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrf_token': csrf_token})

@check_refer
def signupForm(request):
    if request.method == "POST":
        form = CreateUserForm(request.POST, request.FILES)
        if form.is_valid():
            password = form.cleaned_data['password']
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            form.save(commit=True)
            login(request, user)
            profil = Profil.objects.get(user=user)
            profil.logged_in = True
            profil.status = 'active'
            # ami = Profil.objects.get(user=User.objects.get(username='aaa'))
            # if ami:
            #     profil.friends.add(ami)
            profil.save()
            return JsonResponse({'success': True, 'user_id': user.id})
        else:
            errors = form.errors
            return JsonResponse({'success': False, 'errors': errors})
    else:
        form = CreateUserForm()
    return render(request, 'auth_service/signup.html', {"form": form})

@check_id_refer
def enable_2fa(request, id):
    timezone.activate(timezone.get_current_timezone())
    user = request.user
    TOTPDevice.objects.filter(user=user).delete()
    secret = pyotp.random_base32()
    device = TOTPDevice.objects.create(user=user, name='default', confirmed=True)
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(user.username, issuer_name="ft_transcendence")

    qr_code = qrcode.make(provisioning_uri)
    buffer = BytesIO()
    qr_code.save(buffer, format='PNG')

    user.profil.totp_device = device
    user.profil.qr_code.save('qr_code.png', buffer, save=False)
    user.profil.provisioning_uri = provisioning_uri
    user.profil.secret_key = secret
    user.profil.save()
    return HttpResponse(status=200)

@check_id_refer
def disable_2fa(request, id):
    timezone.activate(timezone.get_current_timezone())
    user = request.user
    profil = Profil.objects.get(user=user)
    if request.method == "POST":
        try:
            profil.disable_2fa()
            return HttpResponse(status=200)
        except:
            return HttpResponse(status=500)
    return HttpResponse(status=405)

@check_refer
def verify_2fa(request, id):
    timezone.activate(timezone.get_current_timezone())
    user = User.objects.get(id=id)
    if request.method == "POST":
        form = Verify2FAForm(request.POST)
        if form.is_valid():
            token = form.cleaned_data.get('token')
            device = user.totpdevice_set.first()
            totp = pyotp.TOTP(user.profil.secret_key)
            token_gen = totp.now()
            if token == token_gen:
                login(request, user)
                profil = Profil.objects.get(user=user)
                profil.logged_in = True
                profil.status = 'active'
                profil.save()
                return JsonResponse({'success': True}, status=200)
            else:
                return JsonResponse({'success': False}, status=403)
        else:
            return HttpResponse(status=500)
    else:
        form = Verify2FAForm()
        return render(request, 'auth_service/2fa_qr_code.html', {'form': form, 'profile': user.profil})

@check_refer
def loginForm(request):
    if request.method == "POST":
        form = LoginUserForm(request.POST)
        form.request = request
        if form.is_valid():
            user = form.cleaned_data['user']
            if user is not None:
                device = TOTPDevice.objects.filter(user=user).first()
                if device:
                    return JsonResponse({'success': True, '2fa': True, 'user_id': user.id}, status=200)
                else:
                    login(request, user)
                    profil = Profil.objects.get(user=user)
                    profil.logged_in = True
                    profil.status = 'active'
                    profil.save()
                    return JsonResponse({'success': True, 'user_id': user.id}, status=200)
        else:
            errors = form.errors
            return JsonResponse({'success': False, 'errors': errors})
    else:
        form = LoginUserForm()
    return render(request, 'auth_service/login.html', {"form": form})

@check_id_refer
def logout_view(request, id):
    user = User.objects.get(id=id) 
    if user.is_authenticated and user.id == id:
        logout(request)
        profil = Profil.objects.get(user=user)
        profil.logged_in = False
        profil.status = 'inactive'
        profil.save()
        return redirect('/')

@check_id_refer
def user(request, id):
    user = User.objects.get(id=id)
    profil = Profil.objects.get(user=request.user)
    return render(request, 'auth_service/user.html', {'user': user, 'profil': profil})

def get_user_id(session_cookie):
    try:
        session = Session.objects.get(session_key=session_cookie)
        if session.expire_date > timezone.now():
            session_data = session.get_decoded()
            username = session_data.get('username')
            permissions = session_data.get('permissions')
            user_id = session_data.get('_auth_user_id')
            return user_id
    except Session.DoesNotExist:
        return None
    return None

@csrf_exempt
def extractId(request):
    if request.method == 'POST':
        sessionid = request.COOKIES.get('sessionid')
        user_id = get_user_id(sessionid)
        if user_id:
            return JsonResponse({"success": True, 'user_id': user_id})
        else:
            return JsonResponse({"success": False}, status=200)
    else:
        return JsonResponse({"success": False}, status=405)

@check_refer
def change_lang(request):
    try:    
        if request.method == 'POST':
            data = json.loads(request.body)
            lang = data.get('lang')
            profil = Profil.objects.get(user=request.user)
            profil.language = lang
            profil.save()
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=500)
    except:
        return HttpResponse(status=500)

@check_refer
def get_lang(request):
    try:
        profil = Profil.objects.get(user=request.user)
        return JsonResponse({'lang': profil.language}, status=200)
    except:
        return HttpResponse(status=500)


@check_id_refer
def my_profile(request, id):
    profil = Profil.objects.get(user=request.user.id)
    all_games = list(chain(profil.games_as_player1.all(), profil.games_as_player2.all()))
    games = sorted(all_games, key=lambda game: game.end_date, reverse=True)

    # Formater les dates selon le format souhaité
    for game in games:
        if game.winner == game.player1.username:
            game.winner_profil = game.player1
            game.loser_profil = game.player2
        elif game.winner == game.player2.username:
            game.winner_profil = game.player2
            game.loser_profil = game.player1
        game.formatted_end_date = game.end_date.strftime("%d/%m/%Y %H:%M")

    for game in games:
        print('\U0001F7E0 winnerId = ', game.winner)
        print('\U0001F7E0 winner_points = ', game.winner_points)
        print('\U0001F7E0 loser_points = ', game.loser_points)

    return render(request, 'auth_service/my_profile.html', {'profil': profil, 'games': games})

@check_refer
def profile(request, id):
    profil = Profil.objects.get(user=id)
    my_profile = Profil.objects.get(user=request.user)
    all_games = list(chain(profil.games_as_player1.all(), profil.games_as_player2.all()))
    games = sorted(all_games, key=lambda game: game.end_date, reverse=True)

    for game in games:
        if game.winner == game.player1.username:
            game.winner_profil = game.player1
            game.loser_profil = game.player2
        elif game.winner == game.player2.username:
            game.winner_profil = game.player2
            game.loser_profil = game.player1
        game.formatted_end_date = game.end_date.strftime("%d/%m/%Y %H:%M")

    return render(request, 'auth_service/profile.html', {'profil': profil, 'games': games, 'my_profile': my_profile})

def is_valid_username(username):
    return re.match("^[a-zA-Z0-9_-]+$", username) is not None

@check_id_refer
def change_username(request, id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            if not is_valid_username(username):
                return JsonResponse({'success': False}, status=200)
            if (User.objects.exclude(id=request.user.id).filter(username=username).exists()):
                return JsonResponse({'success': False}, status=200)
            if (len(username) > 13 or len(username) < 3):
                return JsonResponse({'success': False}, status=200)
            user = User.objects.get(id=request.user.id)
            user.username = username
            user.save()
            return JsonResponse({'success': True}, status=200)
        except:
            return JsonResponse({'success': False}, status=500)
    else:
        return JsonResponse({'success': False}, status=405)

@check_refer
def change_email(request):
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            email = data.get('email')
            if (User.objects.exclude(id=request.user.id).filter(email=email).exists()):
                return JsonResponse({'success': False}, status=200)
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_regex, email):
                return JsonResponse({'success': False}, status=200)
            user = User.objects.get(id=request.user.id)
            user.email = email
            user.save()
            return JsonResponse({'success': True}, status=200)
        else:
            return HttpResponse(status=500)
    except:
        return HttpResponse(status=500)

def is_valid_bio(bio):
    return re.match("^[a-zA-Z0-9_ -]+$", bio) is not None

@check_refer
def change_bio(request):
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            bio = data.get('bio')
            if not is_valid_bio(bio):
                return JsonResponse({'success': False}, status=200)
            profil = Profil.objects.get(user=request.user.id)
            profil.bio = bio
            profil.save()
            return JsonResponse({'success': True}, status=200)
        else:
            return HttpResponse(status=405)
    except:
        return HttpResponse(status=500)

@check_refer
def change_password(request):
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            mdp = data.get('mdp')
            special_characters = "!@#$%^&*(),.?\":{}|<>"
            if len(mdp) < 8 or any(char.isdigit() for char in mdp) == False \
                or any(char.isupper() for char in mdp) == False or any(char.islower() for char in mdp) == False \
                or any(char in special_characters for char in mdp) == False:
                return JsonResponse({'success': False}, status=200)
            user = User.objects.get(id=request.user.id)
            user.set_password(mdp)
            user.save()
            update_session_auth_hash(request, user)
            return JsonResponse({'success': True}, status=200)
        else:
            return HttpResponse(status=405)
    except:
        return HttpResponse(status=500)

# def get_status(request):
#     try:
#         profil = Profil.objects.get(user=request.user)
#         return JsonResponse({'status': profil.status}, status=200)
#     except:
#         return HttpResponse(status=500)

@check_refer
def delete_account(request):
    try:
        if request.method == 'POST':
            user = User.objects.get(id=request.user.id)
            profil = Profil.objects.get(user=user)
            if profil.avatar and os.path.exists(profil.avatar.path):
                os.remove(profil.avatar.path)
            timezone.activate(timezone.get_current_timezone())
            profil.disable_2fa()
            logout(request)
            profil.delete()
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=405)
    except:
        return HttpResponse(status=500)

@check_refer
def change_avatar(request):
    try:
        if request.method == 'POST':
            profil = Profil.objects.get(user=request.user)
            if (request.POST.get('is_avatar') == 'true'):
                if profil.avatar and os.path.exists(profil.avatar.path):
                    os.remove(profil.avatar.path)
                if not profil.avatar:
                    profil.avatar = 'avatars/' + f'{request.user.username}_avatar.png'
                    profil.save()
                avatar = request.POST['avatar']
                avatar = avatar[avatar.rfind('/') + 1:]
                avatar = '/var/www/static/images/' + avatar
                img = Image.open(avatar)
                img.thumbnail((400, 400))
                img.save(profil.avatar.path)
                return JsonResponse({'src': profil.avatar.url}, status=200)
            else:
                avatar = request.FILES['avatar']
                if profil.avatar and os.path.exists(profil.avatar.path):
                    os.remove(profil.avatar.path)
                if not profil.avatar:
                    profil.avatar = 'avatars/' + f'{request.user.username}_avatar.png'
                    profil.save()
                img = Image.open(avatar)
                img.thumbnail((400, 400))
                img.save(profil.avatar.path)
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=405)
    except Exception as e:
        return HttpResponse(status=500)

@check_refer
def delete_avatar(request):
    try:
        if request.method == 'POST':
            profil = Profil.objects.get(user=request.user)
            if profil.avatar and os.path.exists(profil.avatar.path):
                os.remove(profil.avatar.path)
                profil.avatar = None
                profil.save()
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=405)
    except Exception as e:
        return HttpResponse(status=500)

@check_id_refer
def getProfile(request, id):
    try:
        if request.method == 'POST':
            profil = Profil.objects.get(user_id=id)
            profil_json = profile_to_json(profil)
            return JsonResponse({'profil': profil_json}, status=200)
        else:
            return HttpResponse(status=405)
    except:
        return HttpResponse(status=500)

@check_refer
def check_session(request):
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            user_id = data.get('id')
            sessions = Session.objects.filter(expire_date__gte=timezone.now())
            user_session = None
            for session in sessions:
                data = session.get_decoded()
                if data.get('_auth_user_id') == str(user_id):
                    user_session = session
                    return JsonResponse({'success': True}, status=200)
            return JsonResponse({'success': False}, status=200)
        else:
            return HttpResponse(status=405)
    except:
        return HttpResponse(status=500)

@check_refer
def status_active(request):
    try:
        print('status_active')
        profil = Profil.objects.get(user=request.user)
        profil.logged_in = True
        if (profil.in_game == True):
            profil.status = 'in_game'
        else:
            profil.status = 'active'
        profil.save()
        return HttpResponse(status=200)
    except:
        return HttpResponse(status=500)

@check_refer
def status_inactive(request):
    try:
        print('status_inactive')
        profil = Profil.objects.get(user=request.user)
        profil.logged_in = False
        profil.status = 'inactive'
        profil.in_game = False
        profil.save()
        return HttpResponse(status=200)
    except:
        return HttpResponse(status=500)


# def update_friend_status(requester_id, receiver_id, status):
#     try:
#         requester = Profil.objects.get(user_id=requester_id)
#         receiver = Profil.objects.get(user_id=receiver_id)

#         # Rechercher une relation existante
#         friend_relation, created = Friend.objects.get_or_create(
#             requester=requester,
#             receiver=receiver,
#             defaults={'status': status}
#         )

#         if not created:
#             # Si la relation existe déjà, mettre à jour le statut
#             friend_relation.status = status
#             friend_relation.save()

#         return friend_relation

#     except Profil.DoesNotExist:
#         print("Profil not found.")
#         return None

@check_refer
def friend_status(request):
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            user_id = data.get('user_id')
            selected_user_id = data.get('selectedUserId')
            myProfile = Profil.objects.get(user_id=user_id)
            selectedProfile = Profil.objects.get(user_id=selected_user_id)

            friends = list(chain(myProfile.friend_requests_sender.all(), myProfile.friend_requests_receiver.all()))

            friends_accepted = list(filter(lambda friend: friend.status == 'accepted', friends))
            for friend in friends_accepted:
                if friend.requester == selectedProfile or friend.receiver == selectedProfile:
                    return JsonResponse({'status':'friends'}, status=200)
            
            for friend in friends:
                if friend.requester == myProfile and friend.receiver == selectedProfile:
                    return JsonResponse({'status': 'waiting_answer'}, status=200)
                elif friend.receiver == myProfile and friend.requester == selectedProfile:
                    return JsonResponse({'status': 'need_answer'}, status=200)
            
            return JsonResponse({'status': 'not_friends'}, status=200)
        else:
            return HttpResponse(status=405)
    except:
        return HttpResponse(status=500)


@check_refer
def get_friends(request):
    try:
        if request.method == 'POST':
            user_id = request.user.id
            profil = Profil.objects.get(user_id=user_id)
            friends = list(chain(profil.friend_requests_sender.filter(status='accepted'), profil.friend_requests_receiver.filter(status='accepted')))
            len_friends = 0
            total = Profil.objects.count()
            other = 0
            if friends:
                len_friends = len(friends)
            other = total - len_friends - 1
            return JsonResponse({'friends': len_friends, 'other': other}, status=200)
        else:
            return HttpResponse(status=405)
    except Exception as e:
        print("error :")
        print(e)
        return HttpResponse(status=500)

@check_refer
def get_env(request):
    try:
        client_id = config('CLIENT_ID')
        ip = config('IP')
        return JsonResponse({'client_id': client_id, 'ip': ip}, status=200)
    except:
        return HttpResponse(status=501)

def error_view(request, exception):
    return render(request, 'auth_service/404.html', {}, status=404)