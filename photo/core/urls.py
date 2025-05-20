from django.urls import path
from .views import AboutView, ContactView

app_name = "core"

urlpatterns = [
    # path('', LandingView.as_view(), name='landing'),
    path('about/', AboutView.as_view(),name="about"),
    path('contactus/',ContactView.as_view(),name="contactus"),
]