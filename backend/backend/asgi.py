"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from com_service.routing import websocket_urlpatterns_com
from game_service.routing import websocket_urlpatterns_game
from auth_service.routing import websocket_urlpatterns_auth

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Combine les modèles de sockets pour les deux services
websocket_urlpatterns = websocket_urlpatterns_com + websocket_urlpatterns_game + websocket_urlpatterns_auth

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
    ),
})
