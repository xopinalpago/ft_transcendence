from rest_framework import serializers
from ...models import GameCLI

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameCLI
        fields = '__all__'
