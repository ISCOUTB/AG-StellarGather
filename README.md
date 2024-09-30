# AG-StellarGather
StellarGather es una plataforma para descubrir, registrar y gestionar eventos en línea como conferencias, conciertos, talleres y más. Los usuarios pueden buscar eventos por categoría, ubicación y fecha, registrarse para asistir y recibir notificaciones sobre eventos futuros.

StellarGather está basada en microservicios y utiliza tecnologías modernas como **FastAPI**, **MySQL**, **MongoDB**, **Docker**, **Apache** y **Redis** para ofrecer una experiencia escalable y modular.

## Arquitectura de la aplicación

La aplicación está dividida en varios microservicios y componentes:

- **SQL Microservice**: Gestiona la base de datos relacional (MySQL) para usuarios, eventos y registros.
- **NoSQL Microservice**: Gestiona la base de datos NoSQL (MongoDB) para manejar notificaciones y otros datos no estructurados.
- **Apache Web Server**: Sirve la página web de StellarGather.
- **Redis**: Utilizado como sistema de caché para mejorar el rendimiento y manejar sesiones de usuarios.
  
## Tecnologías principales

- **Backend**: FastAPI (con Python 3.12)
- **Bases de datos**:
  - **MySQL**: Para almacenar datos estructurados como usuarios, eventos y registros.
  - **MongoDB**: Para almacenar datos no estructurados como notificaciones e interacciones.
- **Frontend**: HTML5, CSS3 y JavaScript.
- **Servidor Web**: Apache, sirviendo las páginas y gestionando el contenido estático.
- **Redis**: Almacenamiento en caché para mejorar el rendimiento de la web.

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
- Redis
- Apache (sirviendo la aplicación web)
- Los microservicios SQL y NoSQL

### 3. Levantar los servicios con Docker

Para iniciar todos los servicios, ejecuta:

```bash
docker-compose up --build
```

Esto iniciará todos los contenedores: MySQL, MongoDB, Redis, Apache y los microservicios.

### 4. Verificar el funcionamiento

Una vez que los contenedores estén en ejecución, puedes acceder a la aplicación web en `http://localhost` o cada puerto.

Puedes interactuar con las APIs o la página web.


## Licencia

Este proyecto está licenciado bajo la Licencia Apache 2.0 - ver el archivo [LICENSE](LICENSE) para más detalles.

