# Generated by Django 4.2.11 on 2024-05-24 10:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_service', '0017_match_player1_ready_match_player2_ready'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='match_id',
            field=models.CharField(max_length=30, null=True),
        ),
    ]
