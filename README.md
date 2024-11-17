# AG-StellarGather
StellarGather es una plataforma para descubrir, registrar y gestionar eventos en línea como conferencias, conciertos, talleres y mucho más. Los usuarios pueden buscar eventos por categoría, ubicación, fecha y organizador; y registrarse para asistir.

StellarGather está basada en microservicios y datos; utiliza tecnologías modernas como **FastAPI**, **MySQL**, **MongoDB**, **Docker** y **Apache con PHP** para ofrecer una experiencia escalable y modular.

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=ISCOUTB_AG-StellarGather)](https://sonarcloud.io/summary/new_code?id=ISCOUTB_AG-StellarGather)

## Arquitectura de la aplicación

La aplicación está dividida en dos microservicios y componentes:

- **SQL Microservice**: Gestiona mediante varios endpoints la base de datos relacional (MySQL) para usuarios, eventos, registros, organizadores, categorías, comentarios y estadísticas.
- **NoSQL Microservice**: Gestiona mediante varios endpoints la base de datos NoSQL (MongoDB) para los mensajes de contacto, newsletter, interaciones y errores.
- **phpMyAdmin**: Administración visual de la base de datos MySQL.
- **MongoExpress**: Administración visual de la base de datos MongoDB.
- **Apache Web Server con PHP**: Sirve la página web de StellarGather.
  
## Tecnologías principales

- **Backend**: FastAPI (con Python 3.13)
- **Bases de datos**:
  - **MySQL**: Para almacenar datos estructurados como usuarios, eventos, registros, organizadores, categorías y comentarios.
  - **MongoDB**: Para almacenar datos no estructurados como los mensajes de contacto, newsletter, interaciones y errores.
- **Frontend**: HTML5, CSS3 con Bootstrap y JavaScript.
- **Servidor Web**: Apache con PHP 8.2, sirviendo las páginas y gestionando el contenido estático.

## Requisitos previos

Antes de comenzar, asegúrate de tener los siguientes software instalados:

- **Docker** y **Docker Compose**

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/ISCOUTB/AG-StellarGather
cd AG-StellarGather
```

### 2. Configurar el archivo `docker-compose.yml`

El archivo `docker-compose.yml` está configurado para levantar todos los servicios necesarios:

- MySQL
- MongoDB
- Apache con PHP (sirviendo la aplicación web)
- Los microservicios SQL y NoSQL

### 3. Levantar los servicios con Docker

Para iniciar todos los servicios, ejecuta en el directorio del proyecto:

```bash
docker compose up --build
```

Esto iniciará todos los contenedores: MySQL, MongoDB, Apache con PHP y los microservicios.

### 4. Verificar el funcionamiento

Una vez que los contenedores estén en ejecución, puedes acceder a la aplicación web en `http://localhost:8013` o cada puerto.

Puedes interactuar con las APIs en los puertos 8010/8012 (si desea ver los endpoints disponibles entras a /docs) o la página web (8013).

### 5. Notas adicionales

- Al descargar el proyecto y montarlo en algún servidor, deberá actualizar el `config.js` y el `auth.js` con los nuevos valores para `API_BASE_URL` , `NO_SQL_API_BASE_URL`, `URL_PAGE_BASE`. Además, deberá colocar la url en la sección `origins` en el `main.py` de ambos microservicios (SQL y NoSQL) para no tener problemas con el `CORS`.
- Al descargar el proyecto, está completamente vacio: No eventos, No usuarios, No registros, No comentarios, No categorias, No organizadores, No administradores.
- Para que funcione la parte de "Datos dinámicos (v1.0)" debera ingresar su `api_key_stellargather` (conseguida en OpenAI) en el `main.py` del microservicio SQL.
- Los usuarios y contraseñas para mysql, phpmyadmin y mongo-express son los predeterminados.
- Si desea comenzar a agregar eventos y todo lo relacionado a ello. Deberá primero crear una cuenta. Luego deberá ingresar a phpMyAdmin y agregar un nueva fila a la tabla admin_users, simplemente selecciona el id del usuario que desea que sea administrador.

## Licencia

Este proyecto está licenciado bajo GNU Affero General Public License v3.0 - ver el archivo [LICENSE](LICENSE) para más detalles.

