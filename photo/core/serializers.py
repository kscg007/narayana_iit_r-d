# core/serializers.py

from rest_framework import serializers

class ContactFormSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    message = serializers.CharField()