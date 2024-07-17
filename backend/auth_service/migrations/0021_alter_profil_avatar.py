# Generated by Django 4.2.11 on 2024-04-26 19:10

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0020_alter_profil_avatar'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profil',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/', validators=[django.core.validators.FileExtensionValidator(['png', 'jpg', 'jpeg'])]),
        ),
    ]
