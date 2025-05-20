from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.core.mail import send_mail
from .serializers import ContactFormSerializer

class AboutView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "title": "About Us",
            "content": (
                "Welcome to Narayana Group! We are dedicated to excellence in education, "
                "empowering students to achieve their goals and make a difference."
            )
        })

class ContactView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "email": "contact@narayanagroup.com",
            "phone": "+91-1234567890",
            "address": "123, Main Road, Hyderabad, India"
        })

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data['name']
            email = serializer.validated_data['email']
            message = serializer.validated_data['message']
            # Send email to your team
            send_mail(
                subject=f"Contact Us Query from {name}",
                message=f"From: {name} <{email}>\n\n{message}",
                from_email="no-reply@narayanagroup.com",
                recipient_list=["contact@narayanagroup.com"],  # Change as needed
                fail_silently=False,
            )
            return Response({"message": "Your query has been sent. Thank you!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)