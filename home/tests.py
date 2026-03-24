from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from home.models import Employee, SivilStatus
from datetime import date


@override_settings(DEBUG=False)
class AdminAccessControlTests(TestCase):
	def test_non_superuser_gets_403_on_admin(self):
		user = User.objects.create_user(
			username='employee',
			email='employee@example.com',
			password='StrongPass123!'
		)

		self.client.force_login(user)
		response = self.client.get('/admin/')

		self.assertEqual(response.status_code, 403)
		self.assertContains(response, 'You do not have permission to access the admin area.', status_code=403)

	def test_superuser_can_access_admin(self):
		admin_user = User.objects.create_superuser(
			username='root',
			email='root@example.com',
			password='StrongPass123!'
		)

		self.client.force_login(admin_user)
		response = self.client.get('/admin/')

		self.assertEqual(response.status_code, 200)


class EmployeeModelTests(TestCase):
	def test_employee_id_is_auto_generated_with_emp_prefix(self):
		status = SivilStatus.objects.create(status='Célibataire')
		employee = Employee.objects.create(
			full_name='John Doe',
			gender=Employee.GenderChoices.MALE,
			status=status,
			birth_date=date(2000, 1, 1),
			security_social_number='SSN-10001',
			age=0,
		)

		self.assertTrue(employee.employee_id.startswith('EMP-'))

	def test_age_is_computed_on_save(self):
		status = SivilStatus.objects.create(status='Marié(e)')
		employee = Employee.objects.create(
			full_name='Jane Doe',
			gender=Employee.GenderChoices.FEMALE,
			status=status,
			birth_date=date(2000, 1, 1),
			security_social_number='SSN-10002',
			age=0,
		)

		today = date.today()
		expected_age = today.year - 2000 - ((today.month, today.day) < (1, 1))
		self.assertEqual(employee.age, expected_age)
