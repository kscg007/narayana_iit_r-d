from datetime import timedelta

from django.utils import timezone

from .models import OTP, PendingUser

from celery import shared_task

from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


@shared_task
def cleanup_expired_otps_and_pending_users():
    now = timezone.now()
    otp_expiry_time = now - timedelta(minutes=5)
    pending_user_expiry_time = now - timedelta(hours=1)

    # Delete expired OTPs
    OTP.objects.filter(created_at__lt=otp_expiry_time).delete()

    # Delete stale PendingUsers who haven't verified OTP within 1 hour
    PendingUser.objects.filter(otp_verified=False, created_at__lt=pending_user_expiry_time).delete()



@shared_task
def cleanup_expired_blacklist_tokens():
    now = timezone.now()
    # Delete blacklisted tokens whose outstanding token has expired
    expired_tokens = OutstandingToken.objects.filter(expires_at__lt=now)
    BlacklistedToken.objects.filter(token__in=expired_tokens).delete()
    expired_tokens.delete()




# # In users/tasks.py

# from celery import shared_task
# from users.models import OTP

# @shared_task
# def test_db_connection():
#     count = OTP.objects.count()
#     return f"OTP count: {count}"