# Generated by Django 4.2.11 on 2024-04-26 10:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0018_profil_language_alter_profil_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='profil',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/'),
        ),
    ]
