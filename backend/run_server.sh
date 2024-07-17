#!/bin/sh

python manage.py makemigrations
# python manage.py makemigrations --merge --noinput 
python manage.py migrate

if ! python manage.py shell -c "from django.contrib.auth.models import User; exit(0) if User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists() else exit(1)"; then
    python manage.py createsuperuser \
        --noinput \
        --username "$DJANGO_SUPERUSER_USERNAME" \
        --email "$DJANGO_SUPERUSER_EMAIL"
fi

python manage.py shell <<EOF
from django.contrib.auth.models import User
superuser = User.objects.get(username='$DJANGO_SUPERUSER_USERNAME')
superuser.set_password("$DJANGO_SUPERUSER_PASSWORD")
superuser.save()
EOF

# Collecter les fichiers statiques
python manage.py collectstatic --noinput

python manage.py runserver 0.0.0.0:8000
