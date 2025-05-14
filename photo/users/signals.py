from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.db.models.signals import post_delete
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from django.conf import settings



def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip



@receiver(user_logged_in)
def update_login_info(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    device = request.META.get('HTTP_USER_AGENT', '')
    user.last_login_ip = ip
    user.last_login_device = device
    user.save(update_fields=['last_login_ip', 'last_login_device'])



@receiver(post_delete, sender=settings.AUTH_USER_MODEL)
def delete_user_tokens(sender, instance, **kwargs):
    """
    Deletes all tokens associated with a user when the user is deleted.
    """
    try:
        OutstandingToken.objects.filter(user=instance).delete()
        # print(f"Deleted all tokens for user: {instance.email}")
    except Exception as e:
        print(f"Error deleting tokens for user {instance.email}: {e}")