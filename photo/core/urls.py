from django.urls import path
from .views import LandingView, LoginView, SignupView

app_name = "core"

urlpatterns = [
    path('', LandingView.as_view(), name='landing'),
    # path('signup/', SignupView.as_view(), name = 'signup'),
    # path('login/', LoginView.as_view(),name='login'),
]