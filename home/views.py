from django.shortcuts import render
from django.http import HttpResponse
import requests

# Create your views here.

def index(request):
    return render(request, 'home/index.html')

def  login(request):
    return render(request, 'home/login.html')

def consume_api_posts(request):
    url = "https://jsonplaceholder.typicode.com/posts"
    response = requests.get(url)
    data = response.json()
    return HttpResponse(str(dict((data))))
    
def consume_api_users(request):
    url = "https://jsonplaceholder.typicode.com/users"
    response = requests.get(url)
    data = response.json()
    return HttpResponse(str(data))


    