from django.urls import re_path
from . import consumers

websocket_urlpatterns_auth = [
    re_path(r'ws/logoutConsumer/', consumers.NotifLogoutConsumer.as_asgi()),
    re_path(r"ws/ask_friend/(?P<room_name>\w+)/$", consumers.FriendConsumer.as_asgi()),
]