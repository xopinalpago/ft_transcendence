# Generated by Django 4.2.11 on 2024-06-25 12:24

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0045_profil_in_game'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='profil',
            name='in_game',
        ),
    ]
