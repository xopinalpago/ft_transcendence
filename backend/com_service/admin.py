from django.contrib import admin

from com_service.models import Chat, BlockedUsers, ChatGroups

admin.site.register(Chat)
admin.site.register(BlockedUsers)
admin.site.register(ChatGroups)
