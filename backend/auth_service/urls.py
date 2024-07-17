"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://doc
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import handler404

from . import views

app_name = "auth_service"
urlpatterns = [
    path('', views.homepage, name='home'),
    path('oauth42/', views.oauth42),
    path('request_api/', views.request_api),
    path('handleOAuth42/', views.handleOAuth42),
    path('get_csrf_token/', views.get_csrf_token, name='get_csrf_token'),
    path('login/', views.refresh_view, name='login'),
    path('loginForm/', views.loginForm),
    path('signup/', views.refresh_view, name='signup'),
    path('signupForm/', views.signupForm),
    path('logout/<int:id>/', views.logout_view, name='logout'),
    path('user/', views.refresh_view),
    path('user/<int:id>/homepage/', views.user, name='user'),
	path('user/<int:id>/chat/', include("com_service.urls")),
	path('user/<int:id>/game/', include("game_service.urls")),
    path('chat/', views.refresh_view),
    path('extractId/', views.extractId),
    path('getProfile/<int:id>/', views.getProfile),
    path('game/pong/local/', views.refresh_view),
    path('game/pong/VSIA/', views.refresh_view),
    path('game/pong/<int:gameId>/', views.refresh_view),
    path('game/pong/lobby/<str:tournament_name>/', views.refresh_view),
    path('game/pong/tournament/<str:tournament_name>/', views.refresh_view),
    path('game/', views.refresh_view),
    path('user/<int:id>/myProfile/', views.my_profile, name='profile'),
    path('myProfile/', views.refresh_view),
    path('user/<int:id>/profile/', views.profile, name='profile'),
    path('profile/', views.refresh_view),
    path('profile/<int:id>/', views.refresh_view),
    path('changeLang/', views.change_lang),
    path('getLang/', views.get_lang),
    path('changeUsername/<int:id>/', views.change_username),
    path('changeEmail/', views.change_email),
    path('changeBio/', views.change_bio),
    path('changePswrd/', views.change_password),
    path('deleteAccount/', views.delete_account),
    path('change_avatar/', views.change_avatar),
    path('delete_avatar/', views.delete_avatar),
    path('enable2FA/<int:id>/', views.enable_2fa),
    path('disable2FA/<int:id>/', views.disable_2fa),
    path('verify2FA/<int:id>/', views.verify_2fa),
    path('checkSession/', views.check_session),
    path('statusActive/', views.status_active),
    path('statusInactive/', views.status_inactive),
    path('friend_status/', views.friend_status),
    path('get_env/', views.get_env),
    path('getFriends/', views.get_friends)
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
