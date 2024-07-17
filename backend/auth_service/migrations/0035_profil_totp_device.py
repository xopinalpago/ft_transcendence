# Generated by Django 4.2.11 on 2024-05-23 11:33

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('otp_totp', '0003_add_timestamps'),
        ('auth_service', '0034_alter_profil_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='profil',
            name='totp_device',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='otp_totp.totpdevice'),
        ),
    ]
