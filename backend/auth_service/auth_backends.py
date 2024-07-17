# from django.contrib.auth.backends import BaseBackend
# from django.contrib.auth import get_user_model
# # from django.db.models import Q

# import logging
# logger = logging.getLogger(__name__)

# class EmailOrUsernameModelBackend(BaseBackend):
#     def authenticate(self, request, username=None, password=None, **kwargs):
#         logger.debug("LAAAAAaa...")
#         User = get_user_model()
        
#         if '@' in username:  # Si l'entrée ressemble à une adresse e-mail
#             logger.debug("Attempting email authentication...")
#             user = User.objects.get(email=username)
#         else:  # Sinon, tente l'authentification par nom d'utilisateur
#             logger.debug("Attempting username authentication...")
#             user = User.objects.get(username=username)

#         if user and user.check_password(password):
#             return user
#         return None