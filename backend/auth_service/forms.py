from django import forms
from django.contrib.auth.models import User
from .models import Profil
from django.contrib.auth.forms import UserCreationForm, User
from django.contrib.auth import authenticate, logout
from django.contrib.auth.password_validation import validate_password
import os
from django.conf import settings
from PIL import Image
from django.templatetags.static import static

class LoginUserForm(forms.Form):
    username = forms.CharField(max_length=150, min_length=3)
    password = forms.CharField(widget=forms.PasswordInput)

    error_messages = {
        'invalid_login': 'Invalid username or password',
    }

    class Meta:
        model = User
        fields = ['username', 'password']

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        username = cleaned_data.get("username")
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user is None:
                self.add_error(None, forms.ValidationError(self.error_messages['invalid_login']))
            else:
                cleaned_data['user'] = user
        return cleaned_data

class CreateUserForm(forms.ModelForm):

    error_messages = {
        'email_exists': "This email address is already associated with an account",
        'weak_password': "The password is too weak (8 caractères min, au moins 1 chiffre, 1 majuscule, 1 minuscule, 1 caractère spécial)",
    }

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    username = forms.CharField(max_length=20, min_length=3)
    password = forms.CharField(widget=forms.PasswordInput)
    email = forms.EmailField()
    bio = forms.CharField(widget=forms.Textarea, required=False, max_length=300)
    avatar = forms.ImageField(required=False)
    predefined_avatar = forms.ChoiceField(choices=[ \
        ('', 'Select an avatar'), \
        ('avatar1.png', 'Avatar 1'), \
        ('avatar2.png', 'Avatar 2'), \
        ('avatar3.png', 'Avatar 3'), \
        ('avatar4.png', 'Avatar 4'), \
        ('avatar5.png', 'Avatar 5'), \
        ('avatar6.png', 'Avatar 6'), \
        ('avatar7.png', 'Avatar 7'), \
        ('avatar8.png', 'Avatar 8'), \
        ('avatar9.png', 'Avatar 9'), \
    ], required=False)

    # a decommenter pour activer la validation du mot de passe
    def clean_password(self):
        password = self.cleaned_data.get("password")
        special_characters = "!@#$%^&*(),.?\":{}|<>"
        if len(password) < 8 or any(char.isdigit() for char in password) == False \
            or any(char.isupper() for char in password) == False or any(char.islower() for char in password) == False \
            or any(char in special_characters for char in password) == False:
            self.add_error(None, forms.ValidationError(self.error_messages['weak_password']))
        return password

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if User.objects.filter(email=email).exists():
            self.add_error(None, forms.ValidationError(self.error_messages['email_exists']))
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        username = cleaned_data.get("username")
        email = cleaned_data.get("email")
        bio = cleaned_data.get("bio")
        avatar = cleaned_data.get("avatar")
        predefined_avatar = cleaned_data.get("predefined_avatar")
        return cleaned_data
    
    def resize_avatar(self, user, chosen_avatar, is_predefined):
        print("laaaaaaaa")
        print(chosen_avatar)
        if is_predefined:
            chosen_avatar = '/var/www/media/avatars/' + chosen_avatar
        print(chosen_avatar)
        img = Image.open(chosen_avatar)
        img.thumbnail((400, 400))
        user_avatar_path = os.path.join(settings.MEDIA_ROOT, 'avatars', f'{user.username}_avatar.png')
        print(user_avatar_path)
        img.save(user_avatar_path)

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])

        predefined_avatar = self.cleaned_data['predefined_avatar']
        if predefined_avatar:
            chosen_avatar = predefined_avatar
        else:
            chosen_avatar = self.cleaned_data['avatar']
        
        if commit:
            user.save()
            Profil.objects.create(
                user=user,
                bio=self.cleaned_data['bio'],
            )
            if self.cleaned_data['avatar']:
                self.resize_avatar(user, self.cleaned_data['avatar'], False)
                user.profil.avatar = 'avatars/' + f'{user.username}_avatar.png'
            elif predefined_avatar:
                self.resize_avatar(user, self.cleaned_data['predefined_avatar'], True)
                user.profil.avatar = 'avatars/' + f'{user.username}_avatar.png'
            print("pas d'avatar")
            user.profil.save()
        return user


class Enable2FAForm(forms.Form):
    pass

class Verify2FAForm(forms.Form):
    token = forms.CharField(max_length=6)
