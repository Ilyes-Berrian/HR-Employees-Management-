import pymysql

# Django 6 checks for mysqlclient>=2.2.1; make PyMySQL pass that gate.
pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.__version__ = "2.2.1"
pymysql.install_as_MySQLdb()
