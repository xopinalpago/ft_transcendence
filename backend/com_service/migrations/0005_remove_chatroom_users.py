# Generated by Django 4.2.11 on 2024-05-10 08:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('com_service', '0004_chatroom_users'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='chatroom',
            name='users',
        ),
    ]
