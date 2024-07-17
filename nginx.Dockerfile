FROM nginx:stable-alpine

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate SSL certificate
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/transcendance.key -out /etc/nginx/ssl/transcendance.crt -subj "/C=FR/L=Paris/O=42/CN=transcendence.42.fr"

# Copy nginx configuration file
COPY ./backend/tools/nginx.conf /etc/nginx/nginx.conf

# Set the working directory
WORKDIR /etc/nginx

# Expose port 8000
EXPOSE 8000
