from django.urls import path
from .views import SignupView, OTPVerifyView, SetPasswordView, LoginView, LoginOTPRequestView, PasswordResetView, GoogleAuthenticatorRegisterView, GoogleAuthenticatorVerifyView, LogoutView, ProtectedPageView

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

app_name = "users"

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('otp-verify/', OTPVerifyView.as_view(), name='otp-verify'),
    path('set-password/', SetPasswordView.as_view(), name='set-password'),
    path('login/', LoginView.as_view(), name='login'),
    path('login-otp-request/', LoginOTPRequestView.as_view(), name='login-otp-request'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('logout/', LogoutView.as_view(), name = 'logout'),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('google-auth/register/', GoogleAuthenticatorRegisterView.as_view(), name='google_auth_register'),
    path('google-auth/verify/', GoogleAuthenticatorVerifyView.as_view(), name='google_auth_verify'),

    path('protected/', ProtectedPageView.as_view(), name='protected'),
]

    