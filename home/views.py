import json

from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

# Create your views here.


def entrypoint(request):
    if request.user.is_authenticated:
        return redirect('home:index')
    return redirect('home:login')


@login_required
def index(request):
    return render(request, 'home/index.html')


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

    if not email or not password:
        return JsonResponse({'ok': False, 'message': 'Please enter both email and password.'}, status=400)

    user_obj = User.objects.filter(email=email).first()
    auth_username = user_obj.username if user_obj else email

    user = authenticate(request, username=auth_username, password=password)
    if user is None:
        return JsonResponse({'ok': False, 'message': 'Invalid email or password.'}, status=401)

    auth_login(request, user)
    return JsonResponse({'ok': True, 'message': 'Login successful.'})


def logout_user(request):
    user= User.objects.filter(email=request.user.email).update(is_active=False)
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



    