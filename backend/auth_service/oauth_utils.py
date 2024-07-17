from django.contrib.auth.models import User
from auth_service.models import Profil
from django.contrib.auth import authenticate, login, logout
import requests
from django_otp.plugins.otp_totp.models import TOTPDevice
from pyotp import TOTP
from django_otp.oath import TOTP

def create_42user(request, username, email):
    try :
        user = User.objects.create_user(
            username=username,
            email=email,
            password=None,
        )
        user.set_unusable_password()
        user.save()
        login(request, user)
        profile = Profil.objects.create(
            user=user,
            bio="",
            logged_in=True,
            status='active',
            auth_with_42=True,
        )
        # response = requests.get(image)
        # if response.status_code == 200:
        #     # Nom du fichier local où l'image sera enregistrée
        #     filename = 'medium_andre.jpg'
        profile.save()
        return True
    except:
        return False

def login_42user(request, username):
    user = User.objects.get(username=username)
    device = TOTPDevice.objects.filter(user=user).first()
    if not device:
        login(request, user)
        profile = Profil.objects.get(user=user)
        profile.logged_in = True
        profile.status = 'active'
        profile.save()
