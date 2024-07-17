from django.shortcuts import render
from django.contrib.auth.models import User
from auth_service.models import Profil
from com_service.models import Chat, ChatGroups, ChatGroups
from django.http import JsonResponse
from .models import BlockedUsers
import json
from django.shortcuts import get_object_or_404

def index(request, id):
    profil = Profil.objects.get(user_id=id)
    profils = Profil.objects.all()
    user_name = request.user.profil.username
    # groups = ChatGroups.objects.filter(members=request.user.profil)
    # for group in groups:
    #     group.group_name = group.groupName(user_name)
    return render(request, "auth_service/chat.html", {'profil': profil, 'profils': profils, 'user_name': user_name})

def load_messages(request, room_name, id):
    room, created = ChatGroups.objects.get_or_create(name=room_name)
    chats = Chat.objects.filter(room=room)
    
    # Récupérer les données des chats en vérifiant si un utilisateur est associé
    chats_data = []
    for chat in chats:
        user_id = chat.user.user_id if chat.user else None
        username = chat.user.username if chat.user else None
        
        if (chat.is_message_bot and chat.match.winner):
            chat_data = {
                'content': chat.content,
                'user_id': user_id,
                'username': username,
                'is_invitation': chat.is_invitation,
                'is_answered': chat.is_answered,
                'answer': chat.answer,
                'is_ready_button': chat.is_ready_button,
            }            
        else:
            chat_data = {
                'content': chat.content,
                'user_id': user_id,
                'username': username,
                'is_invitation': chat.is_invitation,
                'is_answered': chat.is_answered,
                'answer': chat.answer,
                'is_ready_button': chat.is_ready_button,
                'player1_id': chat.player1_id,
                'player2_id': chat.player2_id,
            }
        chats_data.append(chat_data)
    
    return JsonResponse({'chats': chats_data})

# def create_group(request, id):
#     if request.method == 'POST':
#         data = json.loads(request.body)
#         group_name = data.get('name')
#         members = data.get('members')
#         existing_group = ChatGroups.objects.filter(name=group_name).first()
#         if existing_group:
#             return JsonResponse({'success': False, 'message': 'Un groupe avec le même nom existe déjà.'})
#         group = ChatGroups.objects.create(name=group_name)
#         for member_data in members:
#             user_id = member_data['id']
#             member = Profil.objects.get(user_id=user_id)
#             group.members.add(member)
#         return JsonResponse({'success': True, 'message': 'Groupe créé avec succès!'})
#     else:
#         return JsonResponse({'success': False, 'message': 'Méthode non autorisée'})

# def get_group_members(request, id, room_name):
#     try:
#         group = ChatGroups.objects.get(name=room_name)
#         members_profiles = [{
#             'id': member.user_id,
#             'username': member.username,
#             'profile': {
#                 'avatar': member.avatar.url if member.avatar else None,
#                 # Ajoutez d'autres informations de profil si nécessaire
#             }
#         } for member in group.members.all()]
#         return JsonResponse({'success': True, 'members_profiles': members_profiles}, status=200)
#     except ChatGroups.DoesNotExist:
#         return JsonResponse({'success': False, 'message': 'Le groupe spécifié n\'existe pas.'}, status=500)
    
# def get_last_message(request, id, room_name):
#     last_message = Chat.objects.filter(room__name=room_name).exclude(id=id).order_by('-timestamp').first()
#     print(last_message)
#     if last_message:
#         data = {
#             'message': last_message.content,
#             'user_id': last_message.user.id,
#             'username': last_message.user.username
#         }
#         return JsonResponse({'lastMessage': data})
#     else:
#         return JsonResponse({'lastMessage': None})

def get_last_message(request, id, room_name):
    # Récupérer le dernier message
    last_message = Chat.objects.filter(room__name=room_name).order_by('-timestamp').first()
    if last_message:
        # Exclure le dernier message et récupérer l'avant-dernier
        before_last_message = Chat.objects.filter(room__name=room_name).exclude(user_id=last_message.id).order_by('-timestamp').first()
        if before_last_message:
            data = {
                'message': before_last_message.content,
                'user_id': before_last_message.user.user_id,
                'username': before_last_message.user.username
            }
            return JsonResponse({'lastMessage': data})
        else:
            return JsonResponse({'lastMessage': None})
    else:
        return JsonResponse({'lastMessage': None})



def check_is_blocked(request, user_id, id):
    logged_in_user_id = request.user.profil.user_id
    it_is_blocked = BlockedUsers.objects.filter(user_id=logged_in_user_id, blocked_user_id=user_id).exists()
    return JsonResponse({'it_is_blocked': it_is_blocked})
    
def get_users(request, id):
    users = User.objects.exclude(is_superuser=True).exclude(id=request.user.id).values('id', 'username')  # Récupérer tous les utilisateurs avec leurs ID et noms d'utilisateur
    return JsonResponse(list(users), safe=False)