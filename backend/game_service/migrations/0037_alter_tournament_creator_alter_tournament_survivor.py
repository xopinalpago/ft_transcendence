# Generated by Django 4.2.11 on 2024-06-28 16:08

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0054_alter_profil_player_name_tour'),
        ('game_service', '0036_alter_tournament_creator'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournament',
            name='creator',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_tournaments', to='auth_service.profil'),
        ),
        migrations.AlterField(
            model_name='tournament',
            name='survivor',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='survivor_tournaments', to='auth_service.profil'),
        ),
    ]
