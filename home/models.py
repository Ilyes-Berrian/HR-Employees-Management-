from datetime import date
from django.core.exceptions import ValidationError
from django.db import models
from sequences import get_next_value


class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class SivilStatus(models.Model):
    class StatusChoices(models.TextChoices):
        CELIBATAIRE = 'Célibataire', 'Célibataire'
        MARIE = 'Marié(e)', 'Marié(e)'
        DIVORCE = 'Divorcé(e)', 'Divorcé(e)'
        VEUF = 'Veuf/Veuve', 'Veuf/Veuve'

    status = models.CharField(max_length=15, primary_key=True, choices=StatusChoices.choices)

    class Meta:
        verbose_name_plural = 'Sivil Statuses'
        db_table = 'SIVIL_STATUS'

    def __str__(self):
        return self.status


class Employee(models.Model):
    class GenderChoices(models.TextChoices):
        MALE = 'M', 'M'
        FEMALE = 'F', 'F'

    employee_id = models.CharField(max_length=15, db_column='employee_id', primary_key=True, unique=True, editable=False, blank=True)
    full_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=1, choices=GenderChoices.choices)
    status = models.ForeignKey(SivilStatus, db_column='status', on_delete=models.PROTECT)
    birth_date = models.DateField()
    age = models.PositiveIntegerField()
    security_social_number = models.CharField(max_length=20, unique=True, blank=True, null=True)

    class Meta:
        db_table = 'Employee'

    @staticmethod
    def _calculate_age(birth_date):
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    def clean(self):
        super().clean()
        if self.birth_date and self.birth_date > date.today():
            raise ValidationError({'birth_date': 'Birth date cannot be in the future.'})

    def save(self, *args, **kwargs):
        if self.birth_date:
            self.age = self._calculate_age(self.birth_date)

        exclude_fields = ['employee_id'] if not self.employee_id else None
        self.full_clean(exclude=exclude_fields)

        if not self.employee_id:
            next_number = get_next_value('employee_id_sequence')
            self.employee_id = f'EMP-{next_number:03d}'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.employee_id


class Department(models.Model):
    class DepartmentChoices(models.TextChoices):
        RH = 'RH', 'RH'
        FINANCE = 'Finance', 'Finance'
        MARKETING = 'Marketing', 'Marketing'
        COMMERCIAL = 'Commercial', 'Commercial'
        PRODUCTION = 'Production', 'Production'
        LOGISTIQUE = 'Logistique', 'Logistique'
        QUALITE = 'Qualité', 'Qualité'

    name = models.CharField(max_length=15, primary_key=True, choices=DepartmentChoices.choices)

    class Meta:
        db_table = 'Department'

    def __str__(self):
        return self.name


class ContractType(models.Model):
    class ContractChoices(models.TextChoices):
        CDI= 'CDI', 'CDI'
        CDD = 'CDD', 'CDD'
        Stage= 'Stage', 'Stage'
        Alternance= 'Alternance', 'Alternance'

    employee_id = models.ForeignKey(Employee, db_column='employee_id', on_delete=models.CASCADE)
    Contract_Type = models.CharField(max_length=15, choices=ContractChoices.choices, null=False)
    Hire_Date = models.DateField(blank=True, null=False)
    End_Date = models.DateField(blank=True, null=False)

    class Meta:
        db_table = 'ContractType'
        constraints = [
            models.UniqueConstraint(fields=['employee_id', 'Contract_Type'], name='pk_contracttype_employee_contract'),
        ]

    def clean(self):
        super().clean()
        if self.End_Date <= self.Hire_Date:
            raise ValidationError({'End_Date': 'End date must be greater than hire date.'})

    def __str__(self):
        return f'{self.employee_id} - {self.Contract_Type}'


class LeaveInfo(models.Model):
    employee_id = models.ForeignKey(Employee, db_column='employee_id', on_delete=models.CASCADE)
    Leave_Date = models.DateField()
    Leave_Reason = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'LeaveInfo'
        constraints = [
            models.UniqueConstraint(fields=['employee_id', 'Leave_Date'], name='pk_leaveinfo_employee_date'),
        ]

    def __str__(self):
        return f'Leave for {self.employee_id} on {self.Leave_Date}'


class JobInfo(models.Model):
    class ProfessionStatusChoices(models.TextChoices):
        CADRE = 'Cadre', 'Cadre'
        NON_CADRE = 'Non-Cadre', 'Non-Cadre'

    class ActivityStatusChoices(models.TextChoices):
        ACTIF = 'Actif', 'Actif'
        SORTI = 'Sorti', 'Sorti'

    employee_id = models.ForeignKey(Employee, db_column='employee_id', on_delete=models.CASCADE)
    Job_Title = models.CharField(max_length=15)
    Department_Name = models.ForeignKey(Department, db_column='Department_Name', on_delete=models.PROTECT)
    Profession_Status = models.CharField(max_length=10, choices=ProfessionStatusChoices.choices, blank=True)
    Seniority = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    Activity_Status = models.CharField(max_length=10, choices=ActivityStatusChoices.choices, blank=True)
    Contract_Type = models.ForeignKey(ContractType, db_column='Contract_Type', on_delete=models.PROTECT)

    class Meta:
        db_table = 'JobInfo'
        constraints = [
            models.UniqueConstraint(fields=['employee_id', 'Job_Title'], name='pk_jobinfo_employee_title'),
        ]

    def _calculate_seniority(self):
        if not self.Contract_Type or not self.Contract_Type.Hire_Date:
            return None

        end_date = self.Contract_Type.End_Date or date.today()
        return round(((end_date - self.Contract_Type.Hire_Date).days /30)/12, 2)

    def _calculate_activity_status(self):
        if self.Contract_Type and self.Contract_Type.End_Date and self.Contract_Type.End_Date < date.today():
            return self.ActivityStatusChoices.SORTI
        return self.ActivityStatusChoices.ACTIF

    def save(self, *args, **kwargs):
        self.Seniority = self._calculate_seniority()
        self.Activity_Status = self._calculate_activity_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.employee_id} - {self.Job_Title}'


class Salary(models.Model):
    employee_id = models.OneToOneField(Employee, db_column='employee_id', primary_key=True, on_delete=models.CASCADE)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'Salary'

    def clean(self):
        super().clean()
        if self.net_salary > self.gross_salary:
            raise ValidationError({'net_salary': 'Net salary cannot be greater than gross salary.'})

    def __str__(self):
        return f'Salary for {self.employee_id}'
    






