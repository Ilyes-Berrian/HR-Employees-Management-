from django.urls import path
from . import views

urlpatterns =[
    path('home/', views.index),# our domain.com/home/
    path('home/login', views.login_page),
    path('home/auth/login', views.login_user),
    path('home/auth/signup', views.signup_user),
]