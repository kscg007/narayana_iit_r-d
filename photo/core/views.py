from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.
from django.views.generic import TemplateView

class LandingView(TemplateView):
    template_name = 'landing.html'


class LoginView(TemplateView):
    template_name = 'login.html'

class SignupView(TemplateView):
    template_name = 'signup.html'