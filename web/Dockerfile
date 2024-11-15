FROM php:8.2-apache

# Modifica el archivo httpd.conf para habilitar .htaccess y permitir la carga de archivos
COPY apache2.conf /etc/apache2/
    
# Asegúrate de que Apache puede servir archivos desde el directorio html
RUN chmod -R 755 /var/www/html