# Generated by Django 4.2.11 on 2024-04-27 13:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0024_profil_avatar_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='profil',
            name='avatar_data',
        ),
    ]
