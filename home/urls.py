from django.urls import path
from . import views

urlpatterns =[
    path('home/', views.index),# our domain.com/home/
    path('home/posts', views.consume_api_posts),
    path('home/users', views.consume_api_users),
    path('home/login', views.login)
]