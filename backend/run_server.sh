#!/bin/sh

python manage.py makemigrations
python manage.py migrate

python manage.py createsuperuser \
	--noinput \
	--username "boss" \
	--email "boss@example.com"

python manage.py runserver 0.0.0.0:8000
