from django.db import models
from auth_service.models import Profil
from game_service.models import Match

class Chat(models.Model):
	content = models.CharField(max_length=10000)
	room = models.ForeignKey('ChatGroups', on_delete=models.CASCADE)
	timestamp = models.DateTimeField(auto_now=True)
	user = models.ForeignKey(Profil, on_delete=models.CASCADE, null=True)
	is_invitation = models.BooleanField(default=False)
	is_answered = models.BooleanField(default=False)
	is_ready_button = models.BooleanField(default=False)
	answer = models.BooleanField(null=True)
	is_message_bot = models.BooleanField(default=False)
	match = models.ForeignKey(Match, on_delete=models.CASCADE, null=True)
	player1_id = models.CharField(max_length=100, null=True)
	player2_id = models.CharField(max_length=100, null=True)

	def __str__(self):
		return self.content

class ChatGroups(models.Model):
    name = models.CharField(max_length=30)
    members = models.ManyToManyField(Profil)
    group_name = models.CharField(max_length=100, default="")
    def groupName(self, current_user):
        print("current_user = ", current_user)
        # Récupérer les noms des utilisateurs séparés par une virgule, en excluant le nom de l'utilisateur connecté
        user_names = ', '.join([member.username for member in self.members.all() if member.username != current_user])
        print("user_names = ", user_names)
        return user_names
    def __str__(self):
        return self.name

class BlockedUsers(models.Model):
    user = models.ForeignKey(Profil, on_delete=models.CASCADE, related_name='blocked_user')
    blocked_user = models.ForeignKey(Profil, on_delete=models.CASCADE, related_name='blocking_user')
    blocked_at = models.DateTimeField(auto_now_add=True)
		