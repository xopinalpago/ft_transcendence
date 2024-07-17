import sys
import tty
import os
import termios
import requests
import threading
import time
import select
from decouple import config
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


BASE_URL = f"https://{config('IP')}:8000/game/pong/CLI/"

def create_game():
    response = requests.post(f"{BASE_URL}create_game/", verify=False)
    if response.status_code == 200:
        data = response.json()['data']
        print(f"Game created successfully")
        return data['game_id']
    else:
        print("Failed to create game")
        print(response.json())
        return None

def update_game(game_id, left_direction="", right_direction=""):
    response = requests.post(
        f"{BASE_URL}{game_id}/update_game/", 
        json={"left_direction": left_direction, "right_direction": right_direction},
        verify=False
    )
    if response.status_code == 200:
        data = response.json()['data']
        draw_game(data)
        # print(f"Game {game_id} updated successfully: {data}")
        return True
    elif response.status_code == 401:
        end_game(game_id)
        return False
    else:
        print(f"Failed to update game {game_id}")
        print(response.json())
        return False

def get_game_state(game_id):
    response = requests.get(f"{BASE_URL}{game_id}/get_game_state/", verify=False)
    if response.status_code == 200:
        data = response.json()['data']
        print(f"Game state for game {game_id}: {data}")
    else:
        print(f"Failed to get game state for game {game_id}")
        print(response.json())

def end_game(game_id):
    response = requests.post(f"{BASE_URL}{game_id}/end_game/", verify=False)
    if response.status_code == 200:
        print(f"Game {game_id} ended successfully")
    else:
        print(f"Failed to end game {game_id}")
        print(response.json())

def get_key():
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(sys.stdin.fileno())
        rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
        if rlist:
            key = sys.stdin.read(1)
            if key == '\x1b':
                key += sys.stdin.read(2)
            return key
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ''



def draw_game(state):
    os.system('cls' if os.name == 'nt' else 'clear')
    width = 100
    height = 30  # Adjusted height to accommodate 5 extra lines for paddles and space
    print(f"P1: {state['score_p1']} - P2 {state['score_p2']}")
    
    for y in range(height):
        row = ''
        for x in range(width):
            if y == 0 or y == height - 4:
                row += '-'
            elif (x == 0 or x == width - 1) and y <= height - 4:
                row += '|'
            elif x == 2 and (y - 1 >= int(state['left_paddle_position']['y'] * (height - 5)) and y - 1 <= int(state['left_paddle_position']['y'] * (height - 7)) + 4):
                row += '|'
            elif x == width - 3 and (y - 1 >= int(state['right_paddle_position']['y'] * (height - 5)) and y - 1 <= int(state['right_paddle_position']['y'] * (height - 7)) + 4):
                row += '|'
            elif int(state['ball_position']['x'] * (width - 2)) == x - 1 and int(state['ball_position']['y'] * (height - 5)) == y - 1:
                row += 'O'
            else:
                row += ' '
        print(row)
    
    print("\nUse 'w'/'s' for left paddle and 'up'/'down' arrows for right paddle. Press 'q' to quit.")


def main():
    in_game = False
    left_direction = ''
    right_direction = ''
    game_id = create_game()
    if game_id:
        in_game = True
        current_key = ''
        while in_game:
            key = get_key()
            if key == 'w' and current_key != 'w':
                left_direction = 'up'
                current_key = 'w'
            elif key == 's' and current_key != 's':
                left_direction = 'down'
                current_key = 's'
            elif key == '\x1b[A' and current_key != '\x1b[A':  # Flèche vers le haut
                right_direction = 'up'
                current_key = '\x1b[A'
            elif key == '\x1b[B' and current_key != '\x1b[B':  # Flèche vers le bas
                right_direction = 'down'
                current_key = '\x1b[B'
            elif key == 'q':
                in_game = False
                end_game(game_id)
                break
            elif key != current_key:
                left_direction = ''
                right_direction = ''
                current_key = key
            in_game = update_game(game_id, left_direction, right_direction)
            # time.sleep(0.1)
            # if in_game:
                # get_game_state(game_id)

if __name__ == "__main__":
    main()