# Generated by Django 4.2.11 on 2024-05-22 09:01

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth_service', '0034_alter_profil_status'),
        ('com_service', '0012_chatgroups_group_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='blockedusers',
            name='blocked_user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='blocking_user', to='auth_service.profil'),
        ),
        migrations.AlterField(
            model_name='blockedusers',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='blocked_user', to='auth_service.profil'),
        ),
        migrations.AlterField(
            model_name='chat',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth_service.profil'),
        ),
        migrations.AlterField(
            model_name='chatgroups',
            name='members',
            field=models.ManyToManyField(to='auth_service.profil'),
        ),
    ]