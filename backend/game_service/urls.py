# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views
# from . import apiViews

# app_name = 'game_service'
# router = DefaultRouter()
# router.register(r'games', apiViews.GameViewSet, basename='game')
# urlpatterns = [
#     path("", views.index, name="index"),
# 	path("pong/local/", views.pong_local_view, name="pong_local_view"),
# 	path("pong/<str:gameId>", views.pong_game_view, name="pong_game_view"),
# 	path("pong/lobby/<str:tournament_name>/", views.lobby_view, name="lobby_view"),
# 	path("pong/tournament/<str:tournament_name>/", views.tounament_view, name="tounament_view"),
# 	path('', include(router.urls)),
# ]

# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views
# from . import apiViews

# app_name = 'game_service'
# # router = DefaultRouter()
# # router.register(r'games', apiViews.GameViewSet, basename='game')

# urlpatterns = [
#     path("", views.index, name="index"),
#     path("pong/local/", views.pong_local_view, name="pong_local_view"),
#     path("pong/<str:gameId>", views.pong_game_view, name="pong_game_view"),
#     path("pong/lobby/<str:tournament_name>/", views.lobby_view, name="lobby_view"),
#     path("pong/tournament/<str:tournament_name>/", views.tounament_view, name="tounament_view"),
#     path("pong/CLI/create_game/", apiViews.GameViewSet, name="GameViewSet"),
#     path("pong/CLI/<str:game_id>/move_paddle/", apiViews.GameViewSet, name="GameViewSet"),
#     path("pong/CLI/<str:game_id>/get_state/", apiViews.GameViewSet, name="GameViewSet"),
#     path("pong/CLI/test/", apiViews.TestView, name="TestView"),
# 	# path("pong/CLI/test/", TestView, name="TestView"),
#     # path('', include(router.urls)),
# ]

from django.urls import path
from . import views
from .Pong.CLI import apiViews

app_name = 'game_service'

urlpatterns = [
    path("", views.index, name="index"),

    # local
    path("pong/local/", views.pong_local_view, name="pong_local_view"),
    path("pong/VSIA/", views.pong_VSIA_view, name="pong_VSIA_view"),

    # online
    path("pong/<str:gameId>/", views.online_game_view, name="online_game_view"),

    # tournament
    path("pong/lobby/<str:tournament_name>/", views.lobby_view, name="lobby_view"),
    path("pong/tournament/<str:tournament_name>/", views.tounament_view, name="tounament_view"),
	path("get_tournament_name/", views.get_tournament_name, name='get_tournament_name'),
    path("<str:tournament_name>/get_match_id/", views.get_match_id, name="get_match_id"),
	path("is_in_lob_or_tour/", views.is_in_lob_or_tour, name='is_in_lob_or_tour'),

    # # CLI
    # path("pong/CLI/create_game/", apiViews.cliApiView.create_game, name="create_game"),
    # path("pong/CLI/<str:game_id>/update_game/", apiViews.cliApiView.update_game, name="update_game"),
    # path("pong/CLI/<str:game_id>/get_game_state/", apiViews.cliApiView.get_game_state, name="get_game_state"),
    # path("pong/CLI/<str:game_id>/end_game/", apiViews.cliApiView.end_game, name="end_game"),

    # CLI
    path("create_game/", apiViews.cliApiView.as_view({'post': 'create_game'}), name="create_game"),
    path("<str:pk>/update_game/", apiViews.cliApiView.as_view({'post': 'update_game'}), name="update_game"),
    path("<str:pk>/get_game_state/", apiViews.cliApiView.as_view({'get': 'get_game_state'}), name="get_game_state"),
    path("<str:pk>/end_game/", apiViews.cliApiView.as_view({'post': 'end_game'}), name="end_game"),

]

