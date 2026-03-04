from django.db import models

# Create your models here.

class user(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
class departement(models.Model):
    Depatement_Name=models.CharField(max_length=50)
    Employee_Count=models.IntegerField()