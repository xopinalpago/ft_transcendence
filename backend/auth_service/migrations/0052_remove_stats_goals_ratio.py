# Generated by Django 4.2.11 on 2024-06-27 08:15

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0051_stats_goals_ratio'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='stats',
            name='goals_ratio',
        ),
    ]
