from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from datetime import timedelta

class OTP(models.Model):
    OTP_TYPE_CHOICES = [
        ('signup', 'Signup'),
        ('login', 'Login'),
        ('reset_password', 'Reset Password'),
    ]

    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    otp_type = models.CharField(max_length=15, choices=OTP_TYPE_CHOICES, default='signup')

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)

    def __str__(self):
        return f"{self.email} - {self.code} ({self.otp_type})"


class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    otp_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class UserManager(BaseUserManager):
    def create(self, *args, **kwargs):
        raise NotImplementedError("Use create_user() instead of create() to create a user.")
    
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email must be set')
        email = self.normalize_email(email)

        # Check if the user exists in PendingUser and is OTP verified (skip for superusers)
        if not extra_fields.get('is_superuser', False):  # Skip OTP check for superusers
            pending_user = PendingUser.objects.filter(email=email).first()
            if not pending_user or not pending_user.otp_verified:
                raise ValueError('User must complete OTP verification before account creation.')

        # Enforce domain restriction only if not superuser
        if not extra_fields.get('is_superuser', False):  # Skip domain restriction for superusers
            if not email.lower().endswith('@narayanagroup.com'):
                raise ValueError('Email must be @narayanagroup.com domain')
        
        # Create the user
        user = self.model(email=email, name=name, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not password:
            raise ValueError('Superuser must have a password.')

        # Create the superuser without OTP verification or domain restriction
        return self.create_user(email, name, password, **extra_fields)
    
    def get_by_natural_key(self, email):
        # Retrieve the user by their email (natural key)
        return self.get(email=email)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, primary_key=True)  # Set email as primary key
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_device = models.CharField(max_length=255, null=True, blank=True)

    # Google Authenticator fields
    google_authenticator_secret = models.CharField(max_length=32, blank=True, null=True)
    google_authenticator_enabled = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'  # Use email as the unique identifier for authentication
    REQUIRED_FIELDS = ['name']  # Fields required when creating a superuser

    objects = UserManager()

    def __str__(self):
        return self.email
    
    def create(self, *args, **kwargs):
        raise NotImplementedError("Use create_user() or save() instead of create() to create a user.")

    def save(self, *args, **kwargs):
        # Check if this is a new user (i.e., the user does not already exist in the database)
        if not self.pk:  # `pk` is None for new objects
            if not self.email:
                raise ValueError('Email must be set')
            self.email = self.email.lower()

            # Check if the user exists in PendingUser and is OTP verified (skip for superusers)
            if not self.is_superuser:  # Skip OTP check for superusers
                pending_user = PendingUser.objects.filter(email=self.email).first()
                if not pending_user or not pending_user.otp_verified:
                    raise ValueError('User must complete OTP verification before account creation.')

            # Enforce domain restriction only if not superuser
            if not self.is_superuser:  # Skip domain restriction for superusers
                if not self.email.endswith('@narayanagroup.com'):
                    raise ValueError('Email must be @narayanagroup.com domain')

            # Set the password if provided
            if not self.password:
                self.set_unusable_password()
            else:
                self.set_password(self.password)

        # Call the original save method
        super().save(*args, **kwargs)