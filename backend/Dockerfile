# Pull base image
FROM python:3.12.1-slim-bullseye

# Set environment variables
ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN mkdir -p /var/www /var/www/static /var/www/media /var/www/media/avatars /var/www/media/qr_codes

# Set work directory
WORKDIR /usr/src/app

RUN apt update && \
    apt upgrade -y && \
    apt install -y nginx openssl

# Install Pillow
RUN python -m pip install Pillow
# Install django-resized
RUN pip install django-resized
RUN pip install django-resized
RUN pip install django_rest_framework
RUN pip install daphne
RUN pip install requests
RUN pip install pygame
RUN pip install keyboard

# 2FA
RUN pip install django-otp django-two-factor-auth
RUN pip install pyotp

# 42 OAuth
RUN pip install requests
RUN pip install python-decouple

# Install dependencies
COPY ./requirements.txt .
RUN pip install -r requirements.txt

# Copy project
COPY . .

COPY ./auth_service/static/images /var/www/media/avatars

EXPOSE 8000

ENTRYPOINT ["sh", "./run_server.sh"]
