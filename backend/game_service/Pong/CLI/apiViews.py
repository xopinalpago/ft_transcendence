# from rest_framework import viewsets
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.views.decorators.csrf import csrf_exempt
# from .models import GameCLI
# from .serializers import GameSerializer

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from .pongCLI import cliGames
from .pongCLI import PongCLI

class cliApiView(viewsets.ViewSet):
# Create game
    @action(detail=False, methods=['post'])
    @csrf_exempt
    def create_game(self, request):
        try:
            game_id = len(cliGames) + 1
            cliGames[game_id] = PongCLI(game_id)
            cliGames[game_id].create_game()

            print(f'\U0001F7E2 game {game_id} created successfully')
            return Response({'data': {'game_id': game_id}}, status=200)
        except Exception as e:
            print(f'Error creating game: {e}')
            return Response({'error': str(e)}, status=500)
        # game_id = len(cliGames) + 1
        # cliGames[game_id] = PongCLI(game_id)
        # cliGames[game_id].create_game()

        # print(f'\U0001F7E2 game {game_id} created successfully')
        return Response({'data': {'game_id': game_id}}, status=200)

# Update Game
    @action(detail=True, methods=['get'])
    def update_game(self, request, pk=None):
        game_id = int(pk)

        # check if game exists
        if game_id not in cliGames:
            print(f'\U0001F534 game {game_id} not found')
            return Response({'error': 'Game not found'}, status=404)
        
        # updating game
        response = cliGames[game_id].update_game(request)

        # execute end_game if the game is ended
        if ('end_game' in response.data):
            print(f'\U0001F7E2 game {game_id} is finished')
        return (response)

# End game
    @action(detail=True, methods=['post'])
    def end_game(self, request, pk=None):
        game_id = int(pk)
        if game_id in cliGames:
            game = cliGames.pop(game_id)
            del(game)
            print(f'\U0001F7E2 game {game_id} deleted successfully')
        return Response ({'game_ended': 'game is finished'}, status=200)

# Get game state
    @action(detail=True, methods=['get'])
    def get_game_state(self, request, pk=None):
        game_id = int(pk)

        # check if game exists
        if game_id not in cliGames:
            print(f'\U0001F534 game {game_id} not found')
            return Response({'error': 'Game not found'}, status=404)

        # get_game_state
        response = cliGames[game_id].get_game_state()
        return (response)


    # @action(detail=True, methods=['post'])
    # def move_paddle(self, request, pk=None):
    #     game_id = int(pk)
    #     if game_id not in self.games:
    #         return Response({'error': 'Game not found'}, status=404)

    #     game = self.games[game_id]
    #     direction = request.data.get('direction')
    #     paddle = request.data.get('paddle')

    #     if paddle == 'left':
    #         game.paddle1.velocity['y'] = -0.05 if direction == 'up' else 0.05
    #         game.paddle1.update()
    #     elif paddle == 'right':
    #         game.paddle2.velocity['y'] = -0.05 if direction == 'up' else 0.05
    #         game.paddle2.update()

    #     return Response({
    #         'paddle_left_y': game.paddle1.position['y'],
    #         'paddle_right_y': game.paddle2.position['y']
    #     })

    # @action(detail=True, methods=['get'])
    # def get_state(self, request, pk=None):
    #     game_id = int(pk)
    #     if game_id not in self.games:
    #         return Response({'error': 'Game not found'}, status=404)

    #     game = self.games[game_id]
    #     ball = game.ball
    #     paddle1 = game.paddle1
    #     paddle2 = game.paddle2
    #     score = game.score

    #     res = ball.update(paddle1, paddle2)
    #     if res == 1:
    #         paddle1.restart()
    #         paddle2.restart()
    #         score['p1'] += 1
    #     elif res == 2:
    #         paddle1.restart()
    #         paddle2.restart()
    #         score['p2'] += 1

    #     state = {
    #         'ball_x': ball.position['x'],
    #         'ball_y': ball.position['y'],
    #         'paddle_left_y': paddle1.position['y'],
    #         'paddle_right_y': paddle2.position['y'],
    #         'score_left': score['p1'],
    #         'score_right': score['p2']
    #     }
    #     return Response(state)