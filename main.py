import os
import sys
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "coderx.settings")
    execute_from_command_line(sys.argv)
else:
    # For gunicorn to import
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "coderx.settings")
    
    # Import Django WSGI application after setting environment variables
    from django.core.wsgi import get_wsgi_application
    app = get_wsgi_application()