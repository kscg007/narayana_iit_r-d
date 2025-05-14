from rest_framework_simplejwt.authentication import JWTAuthentication

class JWTAuthCookie(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None  # No token at all

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            # Instead of raising, just return None so AllowAny views work
            return None