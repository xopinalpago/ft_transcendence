# Generated by Django 4.2.11 on 2024-06-26 08:07

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('game_service', '0026_finishedgame'),
    ]

    operations = [
        migrations.CreateModel(
            name='Timer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('end_time', models.DateTimeField()),
                ('tournament', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='game_service.tournament')),
            ],
        ),
    ]
