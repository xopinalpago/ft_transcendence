FROM python:3.12.1-slim-bullseye

RUN apt-get update && apt-get install -y dumb-init

RUN apt-get install -y netcat postgresql-client

WORKDIR /usr/src/init

WORKDIR /usr/src/app

RUN pip install --upgrade pip

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . /usr/src/app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

ENTRYPOINT ["dumb-init", "./start.sh"]
# CMD ["python", "manage.py", "runserver", "127.0.0.1:8000"]