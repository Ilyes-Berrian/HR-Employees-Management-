import json
import random
import os
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.template.loader import render_to_string
from django.conf import settings
from django.views.decorators.http import require_POST
from .models import UserProfile

# Create your views here.


def entrypoint(request):
    if request.user.is_authenticated:
        return redirect('home:index')
    return redirect('home:login')


@login_required
def index(request):
    return render(request, 'home/index.html')


def _serialize_profile(request, auth_user, profile):
    image_url = ''
    if profile.profile_image:
        image_url = request.build_absolute_uri(profile.profile_image.url)

    return {
        'fullName': auth_user.get_full_name().strip() or auth_user.username,
        'username': auth_user.username or '',
        'bio': profile.bio or '',
        'profileImageUrl': image_url,
        'email': auth_user.email or '',
        'isActive': auth_user.is_active,
    }


@login_required
def get_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    return JsonResponse({'ok': True, 'profile': _serialize_profile(request, request.user, profile)})


@login_required
@require_POST
def update_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    full_name = (request.POST.get('fullName') or '').strip()
    username = (request.POST.get('username') or '').strip()
    bio = (request.POST.get('bio') or '').strip()
    remove_profile_image = (request.POST.get('removeProfileImage') or '').strip() == '1'
    image_file = request.FILES.get('profileImage')

    if not full_name:
        return JsonResponse({'ok': False, 'message': 'Full name is required.'}, status=400)

    if not username:
        return JsonResponse({'ok': False, 'message': 'Username is required.'}, status=400)

    if User.objects.filter(username=username).exclude(pk=request.user.pk).exists():
        return JsonResponse({'ok': False, 'message': 'This username is already taken.'}, status=400)

    first, _, remainder = full_name.partition(' ')
    request.user.first_name = first
    request.user.last_name = remainder.strip()
    request.user.username = username
    request.user.save(update_fields=['first_name', 'last_name', 'username'])

    profile.bio = bio

    if remove_profile_image and profile.profile_image:
        profile.profile_image.delete(save=False)
        profile.profile_image = None

    if image_file:
        if not image_file.content_type or not image_file.content_type.startswith('image/'):
            return JsonResponse({'ok': False, 'message': 'Please upload a valid image file.'}, status=400)
        profile.profile_image = image_file

    profile.save()

    return JsonResponse(
        {
            'ok': True,
            'message': 'Profile updated successfully.',
            'profile': _serialize_profile(request, request.user, profile),
        }
    )


@login_required
@require_POST
def update_password(request):
    current_password = (request.POST.get('currentPassword') or '').strip()
    new_password = (request.POST.get('newPassword') or '').strip()
    confirm_password = (request.POST.get('confirmPassword') or '').strip()

    if not current_password or not new_password or not confirm_password:
        return JsonResponse({'ok': False, 'message': 'Please fill in all password fields.'}, status=400)

    if not request.user.check_password(current_password):
        return JsonResponse({'ok': False, 'message': 'Current password is incorrect.'}, status=400)

    if new_password != confirm_password:
        return JsonResponse({'ok': False, 'message': "New password and confirmation do not match."}, status=400)

    try:
        validate_password(new_password, user=request.user)
    except ValidationError as exc:
        first_message = exc.messages[0] if exc.messages else 'Weak password.'
        return JsonResponse({'ok': False, 'message': first_message}, status=400)

    request.user.set_password(new_password)
    request.user.save(update_fields=['password'])
    update_session_auth_hash(request, request.user)

    return JsonResponse({'ok': True, 'message': 'Password updated successfully.'})


def login_page(request):
    if request.user.is_authenticated:
        return redirect('home:index')
    return render(request, 'home/login.html')


def permission_denied_page(request, exception):
    return render(request, 'home/403.html', status=403)


@require_POST
def login_user(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'message': 'Invalid request payload.'}, status=400)

    email = (payload.get('email') or '').strip().lower()
    password = (payload.get('password') or '').strip()
    raw_remember_me = payload.get('rememberMe', False)
    if isinstance(raw_remember_me, bool):
        remember_me = raw_remember_me
    elif isinstance(raw_remember_me, str):
        remember_me = raw_remember_me.strip().lower() in {'1', 'true', 'yes', 'on'}
    else:
        remember_me = bool(raw_remember_me)
        
    if not email or not password:
        return JsonResponse({'ok': False, 'message': 'Please enter both email and password.'}, status=400)

    user_obj = User.objects.filter(email=email).first()
    auth_username = user_obj.username if user_obj else email

    user = authenticate(request, username=auth_username, password=password)
    if user is None:
        return JsonResponse({'ok': False, 'message': 'Invalid email or password.'}, status=401)

    auth_login(request, user)
    if remember_me:
        request.session.set_expiry(60*60*24*30) #30 days
    else:
        request.session.set_expiry(0)
        
    return JsonResponse({'ok': True, 'message': 'Login successful.'})


def logout_user(request):
    auth_logout(request)
    return redirect('home:login')


@require_POST
def signup_user(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'message': 'Invalid request payload.'}, status=400)

    name = (payload.get('name') or '').strip()
    username = (payload.get('username') or '').strip()
    email = (payload.get('email') or '').strip().lower()
    password = (payload.get('password') or '').strip()
    confirm_password = (payload.get('confirmPassword') or '').strip()

    if not name or not username or not email or not password or not confirm_password:
        return JsonResponse({'ok': False, 'code': 'required_fields', 'message': 'Please fill in all fields.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'ok': False, 'code': 'username_exists', 'message': 'This username is already taken.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'ok': False, 'code': 'invalid_email', 'message': 'Invalid email address.'}, status=400)

    if password != confirm_password:
        return JsonResponse({'ok': False, 'code': 'password_mismatch', 'message': "Password doesn't match."}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({'ok': False, 'code': 'user_exists', 'message': 'This email is already registered.'}, status=400)

    try:
        validate_password(password)
    except ValidationError:
        return JsonResponse({'ok': False, 'code': 'weak_password', 'message': 'Weak password.'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password, first_name=name.split(' ')[0], last_name=' '.join(name.split(' ')[1:]),is_active=True)
    auth_login(request, user)
    return JsonResponse({'ok': True, 'message': 'Account created successfully.'}, status=201)


FORGOT_PASSWORD_SESSION_KEY = os.getenv('FORGOT_PASSWORD_SESSION_KEY', '')


@require_POST
def forgot_password_send_code(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'message': 'Invalid request payload.'}, status=400)

    email = (payload.get('email') or '').strip().lower()
    if not email:
        return JsonResponse({'ok': False, 'message': 'Email is required.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'ok': False, 'message': 'Invalid email address.'}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return JsonResponse({'ok': False, 'message': 'No account found with this email.'}, status=404)

    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    request.session[FORGOT_PASSWORD_SESSION_KEY] = {
        'email': email,
        'code': code,
        'verified': False,
        'attempts': 0,
    }
    request.session.modified = True

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
    subject = 'Your Password Reset Verification Code'
    template_context = {
        'code': code,
        'app_name': 'HR Management',
    }
    text_message = render_to_string('home/emails/password_reset_code.txt', template_context)
    html_message = render_to_string('home/emails/password_reset_code.html', template_context)

    try:
        send_mail(
            subject,
            text_message,
            from_email,
            [email],
            fail_silently=False,
            html_message=html_message,
        )
    except Exception:
        request.session.pop(FORGOT_PASSWORD_SESSION_KEY, None)
        request.session.modified = True
        return JsonResponse({'ok': False, 'message': 'Failed to send verification email. Check your email settings.'}, status=500)

    return JsonResponse({'ok': True, 'message': 'Verification code sent to your inbox.'})


@require_POST
def forgot_password_verify_code(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'message': 'Invalid request payload.'}, status=400)

    email = (payload.get('email') or '').strip().lower()
    code = (payload.get('code') or '').strip()
    if not email or not code:
        return JsonResponse({'ok': False, 'message': 'Email and verification code are required.'}, status=400)

    flow = request.session.get(FORGOT_PASSWORD_SESSION_KEY)
    if not flow:
        return JsonResponse({'ok': False, 'message': 'Reset session expired. Please request a new code.'}, status=400)

    if flow.get('email') != email:
        return JsonResponse({'ok': False, 'message': 'Email does not match the current reset request.'}, status=400)

    attempts = int(flow.get('attempts', 0)) + 1
    flow['attempts'] = attempts

    if attempts > 5:
        request.session.pop(FORGOT_PASSWORD_SESSION_KEY, None)
        request.session.modified = True
        return JsonResponse({'ok': False, 'message': 'Too many failed attempts. Please request a new code.'}, status=429)

    if flow.get('code') != code:
        request.session[FORGOT_PASSWORD_SESSION_KEY] = flow
        request.session.modified = True
        return JsonResponse({'ok': False, 'message': 'Invalid verification code.'}, status=400)

    flow['verified'] = True
    request.session[FORGOT_PASSWORD_SESSION_KEY] = flow
    request.session.modified = True

    return JsonResponse({'ok': True, 'message': 'Code verified. You can now set a new password.'})


@require_POST
def forgot_password_reset(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'message': 'Invalid request payload.'}, status=400)

    email = (payload.get('email') or '').strip().lower()
    new_password = (payload.get('newPassword') or '').strip()
    confirm_password = (payload.get('confirmPassword') or '').strip()

    if not email or not new_password or not confirm_password:
        return JsonResponse({'ok': False, 'message': 'Please fill in all required fields.'}, status=400)

    if new_password != confirm_password:
        return JsonResponse({'ok': False, 'message': 'New password and confirmation do not match.'}, status=400)

    flow = request.session.get(FORGOT_PASSWORD_SESSION_KEY)
    if not flow:
        return JsonResponse({'ok': False, 'message': 'Reset session expired. Please request a new code.'}, status=400)

    if flow.get('email') != email:
        return JsonResponse({'ok': False, 'message': 'Email does not match the current reset request.'}, status=400)

    if not flow.get('verified'):
        return JsonResponse({'ok': False, 'message': 'Please verify your code first.'}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        request.session.pop(FORGOT_PASSWORD_SESSION_KEY, None)
        request.session.modified = True
        return JsonResponse({'ok': False, 'message': 'No account found with this email.'}, status=404)

    try:
        validate_password(new_password, user=user)
    except ValidationError as exc:
        first_message = exc.messages[0] if exc.messages else 'Weak password.'
        return JsonResponse({'ok': False, 'message': first_message}, status=400)

    user.set_password(new_password)
    user.save(update_fields=['password'])

    request.session.pop(FORGOT_PASSWORD_SESSION_KEY, None)
    request.session.modified = True

    return JsonResponse({'ok': True, 'message': 'Password changed successfully. You can now log in.'})



