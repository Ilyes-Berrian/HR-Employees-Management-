from django.urls import path
from . import views

app_name = 'home'

urlpatterns =[
    path('', views.entrypoint, name='entry'),
    path('home/', views.index, name='index'),# our domain.com/home/
    path('home/login', views.login_page, name='login'),
    path('home/auth/login', views.login_user, name='login_user'),
    path('home/auth/profile', views.get_profile, name='get_profile'),
    path('home/auth/profile/update', views.update_profile, name='update_profile'),
    path('home/auth/password/update', views.update_password, name='update_password'),
    path('home/auth/password/forgot/send-code', views.forgot_password_send_code, name='forgot_password_send_code'),
    path('home/auth/password/forgot/verify-code', views.forgot_password_verify_code, name='forgot_password_verify_code'),
    path('home/auth/password/forgot/reset', views.forgot_password_reset, name='forgot_password_reset'),
    path('home/auth/logout', views.logout_user, name='logout'),
    path('home/auth/signup', views.signup_user, name='signup_user'),
]