import io
import qrcode
import pyotp
import base64
import random
import logging


from django.db import transaction
from django.shortcuts import render
from django.utils import timezone
from django.utils.timezone import now
from django.core.mail import send_mail
from django.contrib.auth import authenticate, logout
from django.contrib.auth.signals import user_logged_in


from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTP, PendingUser
from .serializers import SignupSerializer, OTPVerifySerializer, SetPasswordSerializer, LoginSerializer, LoginOTPRequestSerializer, PasswordResetSerializer, GoogleAuthenticatorRegisterSerializer, DashboardSerializer


logger = logging.getLogger('users')


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            name = serializer.validated_data['name']

            # Create or update PendingUser
            pending_user, created = PendingUser.objects.update_or_create(
                email=email,
                defaults={'name': name, 'otp_verified': False}
            )

            # Delete old OTPs for this email (invalidate previous OTPs)
            OTP.objects.filter(email=email).delete()

            # Generate new OTP
            otp_code = f"{random.randint(100000, 999999)}"
            OTP.objects.create(email=email, code=otp_code, created_at=timezone.now())

            # Send OTP email (prints to console or real email)
            send_mail(
                subject="Your OTP Code",
                message=f"Your OTP code is {otp_code}. It will expire in 5 minutes.",
                from_email='no-reply@narayanagroup.com',
                recipient_list=[email],
            )

            # Log OTP sent event (optional, see next steps)
            logger.info(f"OTP sent to {email}: {otp_code}")

            return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp_code = serializer.validated_data['otp']

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response({"error": "User already registered. Please login."}, status=400)
            
            if not PendingUser.objects.filter(email=email).exists():
                logger.warning(f"OTP verification failed: email {email} is not registered")
                return Response({"error": "Email is not registered or invalid email"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                otp_obj = OTP.objects.filter(email=email, code=otp_code, is_used=False).latest('created_at')
            except OTP.DoesNotExist:
                logger.warning(f"Invalid OTP attempt for {email}")
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.is_expired():
                # OTP expired: cleanup OTP and PendingUser atomically
                with transaction.atomic():
                    otp_obj.delete()
                    PendingUser.objects.filter(email=email).delete()
                logger.error(f"OTP expired for {email}, pending user deleted")
                return Response({"error": "OTP expired. Please click Resend OTP."}, status=status.HTTP_400_BAD_REQUEST)

            # OTP valid: mark used and mark PendingUser verified atomically
            with transaction.atomic():
                otp_obj.is_used = True
                otp_obj.save()

                try:
                    pending_user = PendingUser.objects.get(email=email)
                except PendingUser.DoesNotExist:
                    logger.warning(f"OTP verification failed: no pending user found for {email}")
                    return Response({"error": "No pending registration found. Please sign up."}, status=400)

                pending_user.otp_verified = True
                pending_user.save()

            logger.info(f"OTP verified for {email}")
            return Response({"message": "OTP verified, please login and set your password"}, status=status.HTTP_200_OK)

        logger.warning(f"OTP verification failed due to serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            if User.objects.filter(email=email).exists():
                logger.warning(f"SetPassword attempt for existing user: {email}")
                return Response({"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)

            if not PendingUser.objects.filter(email=email).exists():
                logger.warning(f"OTP verification failed: email {email} is not registered")
                return Response({"error": "Email is not registered or invalid email"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                pending_user = PendingUser.objects.get(email=email)
            except PendingUser.DoesNotExist:
                logger.warning(f"SetPassword attempt failed: user not found or not signed up for {email}")
                return Response({"error": "User not found. Please sign up first."}, status=status.HTTP_400_BAD_REQUEST)

            if not pending_user.otp_verified:
                logger.warning(f"SetPassword attempt failed: email not verified for {email}")
                return Response({"error": "Email not verified. Please verify OTP first."}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                # Create the user
                user = User.objects.create_user(email=email, name=pending_user.name, password=password)
                logger.info(f"User created: {email}")

                # Cleanup: delete pending user and all OTPs for this email
                pending_user.delete()
                OTP.objects.filter(email=email).delete()

                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)

                # Set tokens as HttpOnly cookies
                response = Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=False,  # Set to True only in production with HTTPS
                    samesite="Strict",
                )
                response.set_cookie(
                    key="refresh_token",
                    value=str(refresh),
                    httponly=True,
                    secure=False,  # Set to True only in production with HTTPS
                    samesite="Strict",
                )
                return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data.get('password')
        otp = serializer.validated_data.get('otp')
        totp = serializer.validated_data.get('totp')

        user_exists = User.objects.filter(email=email).exists()
        pending_user = PendingUser.objects.filter(email=email).first()

        # Restrict login if user is not verified
        if not user_exists:
            if not pending_user:
                return Response({"error": "User not found. Please sign up."}, status=status.HTTP_404_NOT_FOUND)
            if not pending_user.otp_verified:
                return Response({"error": "OTP not verified. Please sign up and complete verification process."}, status=status.HTTP_400_BAD_REQUEST)

        # Email only: status check
        if not password and not otp and not totp:
            if user_exists:
                return Response({"action": "login_password_or_otp_or_google_authenticator"}, status=status.HTTP_200_OK)
            elif pending_user and pending_user.otp_verified:
                return Response({"action": "set_password and register Authenticator"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "User not found. Please sign up."}, status=status.HTTP_404_NOT_FOUND)

        # Password login
        if password:
            if not user_exists:
                return Response({"error": "User not found. Please sign up."}, status=status.HTTP_404_NOT_FOUND)
            user = authenticate(request, email=email, password=password)
            if user is None:
                return Response({"error": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)
            if not user.is_active:
                return Response({"error": "User account is inactive."}, status=status.HTTP_403_FORBIDDEN)

            # Update last_login here
            user.last_login = now()
            user.save(update_fields=['last_login'])
            user_logged_in.send(sender=user.__class__, request=request, user=user)
            

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Set tokens as HttpOnly cookies
            response = Response({"message": "Login successful"})
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,  # Use HTTPS
                samesite="Strict",  # Prevent cross-site usage
            )
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite="Strict",
            )
            return response

        # OTP login
        if otp:
            if not user_exists:
                return Response({"error": "User not found. Please sign up."}, status=status.HTTP_404_NOT_FOUND)
            try:
                otp_obj = OTP.objects.filter(email=email, code=otp, is_used=False, otp_type='login').latest('created_at')
            except OTP.DoesNotExist:
                logger.warning(f"Invalid login OTP attempt for {email}")
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.is_expired():
                with transaction.atomic():
                    otp_obj.delete()
                logger.error(f"Login OTP expired for {email}")
                return Response({"error": "OTP expired. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
            

            with transaction.atomic():
                otp_obj.is_used = True
                otp_obj.save()
                user = User.objects.get(email=email)

                if not user.is_active:
                    return Response({"error": "User account is inactive."}, status=status.HTTP_403_FORBIDDEN)

                # Update last_login here
                user.last_login = now()
                user.save(update_fields=['last_login'])
                user_logged_in.send(sender=user.__class__, request=request, user=user)

                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)

                # Set tokens as HttpOnly cookies
                response = Response({"message": "Login successful via OTP"})
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=False,  # Use HTTPS
                    samesite="Strict",
                )
                response.set_cookie(
                    key="refresh_token",
                    value=str(refresh),
                    httponly=True,
                    secure=False,
                    samesite="Strict",
                )
                return response
        
        # Google Authenticator login
        if totp:
            if not user_exists:
                return Response({"error": "User not found. Please sign up."}, status=status.HTTP_404_NOT_FOUND)
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            if not user.is_active:
                return Response({"error": "User account is inactive."}, status=status.HTTP_403_FORBIDDEN)
            if not user.google_authenticator_secret:
                return Response({"error": "Google Authenticator is not registered for this user"}, status=status.HTTP_400_BAD_REQUEST)
            totp_obj = pyotp.TOTP(user.google_authenticator_secret)
            if totp_obj.verify(totp):
                # Update last_login and fire signal
                user.last_login = now()
                user.save(update_fields=['last_login'])
                user_logged_in.send(sender=user.__class__, request=request, user=user)
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                # Set tokens as HttpOnly cookies
                response = Response({"message": "Login successful via Google Authenticator"})
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=False,
                    samesite="Strict",
                )
                response.set_cookie(
                    key="refresh_token",
                    value=str(refresh),
                    httponly=True,
                    secure=False,
                    samesite="Strict",
                )
                return response
            else:
                return Response({"error": "Invalid Google Authenticator code"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)


class LoginOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginOTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            # Check if user exists
            if not User.objects.filter(email=email).exists():
                return Response({"error": "User not found. Please sign up."}, status=status.HTTP_404_NOT_FOUND)

            # Delete old login OTPs for this email
            OTP.objects.filter(email=email, otp_type='login').delete()

            # Generate new login OTP
            otp_code = f"{random.randint(100000, 999999)}"
            OTP.objects.create(email=email, code=otp_code, otp_type='login', created_at=timezone.now())

            # Send OTP email
            send_mail(
                subject="Your Login OTP Code",
                message=f"Your login OTP code is {otp_code}. It will expire in 5 minutes.",
                from_email='no-reply@narayanagroup.com',
                recipient_list=[email],
            )

            logger.info(f"Login OTP sent to {email}: {otp_code}")

            return Response({"message": "Login OTP sent to your email"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data.get('otp')
        password = serializer.validated_data.get('password')

        if not otp and not password:
            # Step 1: Send OTP
            OTP.objects.filter(email=email, otp_type='reset_password').delete()
            otp_code = f"{random.randint(100000, 999999)}"
            OTP.objects.create(email=email, code=otp_code, otp_type='reset_password', created_at=timezone.now())
            send_mail(
                subject="Your Password Reset OTP",
                message=f"Your password reset OTP is {otp_code}. It expires in 5 minutes.",
                from_email='no-reply@narayanagroup.com',
                recipient_list=[email],
            )
            return Response({"message": "Password reset OTP sent to your email"}, status=status.HTTP_200_OK)

        elif otp and not password:
            # Step 2: Verify OTP
            try:
                otp_obj = OTP.objects.filter(email=email, code=otp, is_used=False, otp_type='reset_password').latest('created_at')
            except OTP.DoesNotExist:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.is_expired():
                otp_obj.delete()
                return Response({"error": "OTP expired. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

            otp_obj.is_used = True
            otp_obj.save()
            return Response({"message": "OTP verified. You can now reset your password."}, status=status.HTTP_200_OK)

        elif otp and password:
            # Step 3: Reset password
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            # Optional: Verify OTP again here or require fresh OTP verification before password reset

            user.set_password(password)
            user.save()
            return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)

        else:
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
        


class GoogleAuthenticatorRegisterView(APIView):
    permission_classes = [IsAuthenticated]  # Require the user to be authenticated

    def post(self, request):
        serializer = GoogleAuthenticatorRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = request.user.email  # Use the authenticated user's email

        user = User.objects.get(email=email)
    
        # Generate a secret key for Google Authenticator
        secret = pyotp.random_base32()

        # Save the secret key to the user's model
        user.google_authenticator_secret = secret
        user.save()

        # Generate a QR code URL for Google Authenticator
        totp = pyotp.TOTP(secret)
        otp_auth_url = totp.provisioning_uri(name=email, issuer_name="N_IIT_RAW")

        # Generate the QR code as an image
        qr = qrcode.make(otp_auth_url)
        buffer = io.BytesIO()
        qr.save(buffer, format="PNG")
        buffer.seek(0)

        # Convert the QR code image to a base64-encoded data URL
        qr_code_data_url = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"

        return Response({
            "message": "Google Authenticator registration initiated",
            "qr_code_url": qr_code_data_url  # Send only the QR code
        }, status=status.HTTP_200_OK)

class GoogleAuthenticatorVerifyView(APIView):
    permission_classes = [AllowAny]  # Allow access to everyone (no authentication required)

    def post(self, request):
        # Get the email and OTP from the request
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user has Google Authenticator enabled
        if not user.google_authenticator_secret:
            return Response({"error": "Google Authenticator is not registered for this user"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the OTP
        totp = pyotp.TOTP(user.google_authenticator_secret)
        if totp.verify(otp):
            # OTP is valid, issue tokens or mark the user as logged in
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Google Authenticator verified",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Blacklist the refresh token
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # Blacklist the token to prevent reuse
            except Exception as e:
                # Handle invalid or already blacklisted tokens
                pass

        # Log the user out of the session
        logout(request)

        # Clear the cookies
        response = Response({"message": "Logged out successfully"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


class ProtectedPageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return render(request, 'login.html')


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = DashboardSerializer(request.user)
        # In the future, you can add more data to this response
        return Response({
            "user": serializer.data,
            # "other_dashboard_data": ...,
        })

