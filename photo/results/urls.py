from django.urls import path
from .views import InternalResultsView, FinalResultsView

app_name = "results"

urlpatterns = [
    path('internal/', InternalResultsView.as_view(), name='internal'),
    path('final/', FinalResultsView.as_view(), name='final'),
]