from django import template
import json

register = template.Library()

@register.filter(name='profile_to_json')
def profile_to_json(profile):
    data = {
        "id": profile.user_id,
        "username": profile.username,
        "logged_in": profile.logged_in,
        "avatar": profile.avatar.url if profile.avatar else None,
        "bio": profile.bio,
        "status": profile.status,
        "language": profile.language,
        "qr_code": profile.qr_code.url if profile.qr_code else None,
    }
    return json.dumps(data)