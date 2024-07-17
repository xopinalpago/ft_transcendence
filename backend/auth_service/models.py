from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import FileExtensionValidator
from django_resized import ResizedImageField
from django.utils.html import json_script
from django_otp.plugins.otp_totp.models import TOTPDevice
import os

class Stats(models.Model):
    games_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    ptd_scored = models.IntegerField(default=0)
    ptd_conceded = models.IntegerField(default=0)
    win_rate = models.FloatField(default=0)
    lose_rate = models.FloatField(default=0)
    draw_rate = models.FloatField(default=0)
    tournaments = models.IntegerField(default=0)
    goals_ratio = models.FloatField(default=0)

class Profil(models.Model):

    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active') #green
        INACTIVE = 'inactive', _('Inactive') #red
        IN_GAME = 'in_game', _('In game') #blue

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    logged_in = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, validators=[FileExtensionValidator(['png', 'jpg', 'jpeg'])])
    bio = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length = 20,
        choices = Status.choices,
        default = Status.ACTIVE,
    )
    is_in_lobby = models.BooleanField(default=False)
    is_in_tournament = models.BooleanField(default=False)
    language = models.CharField(max_length=5, default='en')
    stats = models.OneToOneField(Stats, on_delete=models.CASCADE, blank=True, null=True)
    totp_device = models.OneToOneField(TOTPDevice, null=True, blank=True, on_delete=models.DO_NOTHING)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    provisioning_uri = models.CharField(max_length=255, blank=True, null=True)
    secret_key = models.CharField(max_length=64, blank=True, null=True)
    player_name_tour = models.CharField(max_length=13, null=True)
    auth_with_42 = models.BooleanField(default=False)
    friends = models.ManyToManyField('self', through='Friend', symmetrical=False)
    in_game = models.BooleanField(default=False)

    def delete(self, *args, **kwargs):
        print('delete')
        if self.stats:
            self.stats.delete()
        if self.user:
            self.user.delete()
        super().delete(*args, **kwargs)

    def disable_2fa(self):
        if self.totp_device:
            totp_device = self.totp_device
            self.totp_device = None
            if self.qr_code and os.path.exists(self.qr_code.path):
                os.remove(self.qr_code.path)
            self.qr_code = None
            self.provisioning_uri = None
            self.save()
            totp_device.delete()

    @property
    def username(self):
        try:
            return self.user.username
        except User.DoesNotExist:
            return False
        
    @property
    def email(self):
        try:
            return self.user.email
        except User.DoesNotExist:
            return False
        
    @property
    def password(self):
        try:
            return self.user.password
        except User.DoesNotExist:
            return False

class Friend(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (DECLINED, 'Declined'),
    ]

    requester = models.ForeignKey(Profil, related_name='friend_requests_sender', on_delete=models.CASCADE)
    receiver = models.ForeignKey(Profil, related_name='friend_requests_receiver', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)

    class Meta:
        unique_together = ('requester', 'receiver')

    def __str__(self):
        return f"{self.requester.username} -> {self.receiver.username} ({self.status})"

@receiver(post_save, sender=Profil)
def create_stats(sender, instance, created, **kwargs):
    if created and not instance.stats:
        Stats.objects.create()
        instance.stats = Stats.objects.last()
        instance.save()

