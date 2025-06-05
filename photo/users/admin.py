# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# from .models import User
# class UserAdmin(BaseUserAdmin):
#     list_display = ('email', 'name', 'is_staff', 'is_active')
#     list_filter = ('is_staff', 'is_active')
#     search_fields = ('email', 'name')
#     ordering = ('email',)
#     fieldsets = (
#         (None, {'fields': ('email', 'password')}),
#         ('Personal info', {'fields': ('name',)}),
#         ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
#         ('Important dates', {'fields': ('last_login', 'date_joined')}),
#     )
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': ('email', 'name', 'password1', 'password2', 'is_staff', 'is_active')}
#         ),
#     )

# admin.site.register(User, UserAdmin)


from .models import User, OTP, PendingUser
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'is_staff', 'is_active')
    search_fields = ('email', 'name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )


class OTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'created_at', 'is_used')
    list_filter = ('is_used', 'created_at')
    search_fields = ('email', 'code')
    ordering = ('-created_at',)


class PendingUserAdmin(admin.ModelAdmin):
    list_display = ('email','name','otp_verified','created_at')
    list_filter = ('otp_verified', 'created_at')
    search_fields = ('email', 'name')
    order = ('-created_at')

admin.site.register(User, UserAdmin)
admin.site.register(OTP, OTPAdmin)
admin.site.register(PendingUser, PendingUserAdmin)