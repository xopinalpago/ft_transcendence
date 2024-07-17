from django.urls import re_path

from . import consumers, consumersOnline

websocket_urlpatterns_com = [
    re_path(r"ws/get_group/", consumersOnline.OnlineConsumer.as_asgi()),
    re_path(r"ws/get_user/", consumersOnline.OnlineConsumer.as_asgi()),
    re_path(r"ws/invite_play/(?P<room_name>\w+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/chat/(?P<room_name>\w+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/chat/block/(?P<room_name>\d+/\d+)/$", consumers.BlockedUserConsumer.as_asgi()),
	re_path(r"ws/chat/unblock/(?P<room_name>\d+/\d+)/$", consumers.BlockedUserConsumer.as_asgi()),
]