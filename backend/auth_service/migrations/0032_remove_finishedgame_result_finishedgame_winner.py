# Generated by Django 4.2.11 on 2024-04-30 13:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0031_finishedgame_player1_finishedgame_player2'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='finishedgame',
            name='result',
        ),
        migrations.AddField(
            model_name='finishedgame',
            name='winner',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]