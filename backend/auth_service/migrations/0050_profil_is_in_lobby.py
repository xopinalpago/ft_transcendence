# Generated by Django 4.2.11 on 2024-06-25 18:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0049_merge_20240625_1601'),
    ]

    operations = [
        migrations.AddField(
            model_name='profil',
            name='is_in_lobby',
            field=models.BooleanField(default=False),
        ),
    ]