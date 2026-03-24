from django.urls import path
from . import views

app_name = 'home'

urlpatterns =[
    path('', views.entrypoint, name='entry'),
    path('home/', views.index, name='index'),# our domain.com/home/
    path('home/login', views.login_page, name='login'),
    path('home/auth/login', views.login_user, name='login_user'),
    path('home/auth/logout', views.logout_user, name='logout'),
    path('home/auth/signup', views.signup_user, name='signup_user'),
]