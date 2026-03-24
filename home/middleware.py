from django.core.exceptions import PermissionDenied


class AdminSuperuserOnlyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        admin_path = request.path == '/admin' or request.path.startswith('/admin/')
        if admin_path and request.user.is_authenticated and not request.user.is_superuser:
            raise PermissionDenied

        return self.get_response(request)