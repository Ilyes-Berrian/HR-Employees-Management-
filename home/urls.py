from django.urls import path
from . import views

urlpatterns =[
    path('', views.index),# our domain.com/home/
    path('/posts', views.consume_api_posts),
    path('/users', views.consume_api_users),
    path('/login', views.login)
]