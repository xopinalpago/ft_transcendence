from game_service.consumersMatchmaking import QueueConsumer
from game_service.Pong.Online.consumerOnline import PongConsumerOnline
from game_service.Pong.Local.consumerLocal import PongConsumerLocal
from game_service.consumersLobby import LobbyConsumer
from game_service.consumersTournament import TournamentConsumer
from django.urls import path, re_path

websocket_urlpatterns_game = [
    # matchmaking
    re_path(r"ws/queue/", QueueConsumer.as_asgi()),

    # tournament
    re_path(r"ws/create_tournament/", LobbyConsumer.as_asgi()),
    re_path(r"ws/pong/lobby/(?P<tournament_name>\w+)/$", LobbyConsumer.as_asgi()),
    re_path(r"ws/pong/tournament/(?P<tournament_name>\w+)/$", TournamentConsumer.as_asgi()),
    re_path(r"ws/pong/tournament/(?P<tournament_name>\w+)/(?P<match_id>\w+)/$", TournamentConsumer.as_asgi()),

    #online
    re_path(r"ws/game/pong/(?P<gameId>\w+)/$", PongConsumerOnline.as_asgi()),
    re_path(r"ws/game/pong/input/(?P<gameId>\w+)/$", PongConsumerOnline.as_asgi()),

    #local
    re_path(r"ws/game/create_local_game/(?P<userId>\w+)/$", PongConsumerLocal.as_asgi()),
    re_path(r"ws/game/create_local_game_input/(?P<userId>\w+)/$", PongConsumerLocal.as_asgi()),
    re_path(r"ws/game/create_VSIA_game/(?P<userId>\w+)/$", PongConsumerLocal.as_asgi()),
    re_path(r"ws/game/create_VSIA_game_input/(?P<userId>\w+)/$", PongConsumerLocal.as_asgi()),
]
