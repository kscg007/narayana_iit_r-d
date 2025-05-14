from rest_framework import serializers
from .models import User

class SignupSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()

    def validate_email(self, value):
        # Check email domain
        if not value.lower().endswith('@narayanagroup.com'):
            raise serializers.ValidationError("Email must be @narayanagroup.com domain")
        # Check if user already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class SetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        # Optionally check if OTP was verified for this email
        # Or check if user already exists to prevent duplicate
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(required=False, write_only=True, allow_blank=True)
    otp = serializers.CharField(required=False, write_only=True, max_length=6, allow_blank=True)
    totp = serializers.CharField(required=False, write_only=True, max_length=6, allow_blank=True)

    def validate_email(self, value):
        if not value.lower().endswith('@narayanagroup.com'):
            raise serializers.ValidationError("Email must be @narayanagroup.com domain")
        return value

    def validate(self, data):
        password = data.get('password')
        otp = data.get('otp')
        totp = data.get('totp')

        # Only one of password, otp, or totp should be provided
        provided = [bool(password), bool(otp), bool(totp)]
        if sum(provided) > 1:
            raise serializers.ValidationError("Provide only one of password, otp, or totp.")

        # Allow email-only for status check
        return data


class LoginOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not value.lower().endswith('@narayanagroup.com'):
            raise serializers.ValidationError("Email must be @narayanagroup.com domain")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(required=False, max_length=6, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, min_length=8, allow_blank=True)

    def validate_email(self, value):
        if not value.lower().endswith('@narayanagroup.com'):
            raise serializers.ValidationError("Email must be @narayanagroup.com domain")
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist")
        return value

    def validate(self, data):
        otp = data.get('otp')
        password = data.get('password')

        if otp and password:
            # Both otp and password present → confirm reset
            pass
        elif otp and not password:
            # OTP verification step
            pass
        elif not otp and not password:
            # OTP request step
            pass
        else:
            raise serializers.ValidationError("Invalid combination of fields. Provide either email only, email+otp, or email+otp+password.")
        return data
    
class GoogleAuthenticatorRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Check if the user exists
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User not found")
        return value