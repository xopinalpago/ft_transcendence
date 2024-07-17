# Generated by Django 4.2.11 on 2024-06-05 16:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0041_merge_20240603_1358'),
        ('game_service', '0022_tournament_winner'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='loser',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='matches_los', to='auth_service.profil'),
        ),
        migrations.AddField(
            model_name='match',
            name='score_loser',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='match',
            name='score_winner',
            field=models.IntegerField(default=0),
        ),
    ]
