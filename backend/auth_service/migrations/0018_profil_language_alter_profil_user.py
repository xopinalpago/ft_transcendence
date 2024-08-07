# Generated by Django 4.2.11 on 2024-04-25 20:12

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth_service', '0017_remove_profil_id_alter_profil_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='profil',
            name='language',
            field=models.CharField(default='en', max_length=5),
        ),
        migrations.AlterField(
            model_name='profil',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to=settings.AUTH_USER_MODEL),
        ),
    ]
