from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
	path("load_messages/<str:room_name>/", views.load_messages, name="load_messages"),
	path("check_is_blocked/<int:user_id>/", views.check_is_blocked, name='check_is_blocked'),
	path("get_users/", views.get_users, name='get_users'),
	# path("create_group/", views.create_group, name='create_group'),
	# path("get_group_members/<str:room_name>/", views.get_group_members, name="get_group_members"),
	path("get_last_message/<str:room_name>/", views.get_last_message, name="get_last_message"),
]