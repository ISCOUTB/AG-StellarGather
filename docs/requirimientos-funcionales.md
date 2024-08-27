# Requerimientos Funcionales para StellarGather

## Requerimiento de Software: Gestión de Usuarios

**ID:** RF-001  
**Descripción:**  
El sistema debe permitir a los usuarios registrarse, iniciar sesión, y gestionar sus perfiles de manera segura. Los usuarios deben poder acceder y actualizar su información personal y preferencias.

**Requisitos Funcionales:**
- **RF-001.1:** El sistema debe permitir a los usuarios registrarse mediante un formulario de inscripción que recoja información básica como nombre, correo electrónico y contraseña.
- **RF-001.2:** El sistema debe permitir a los usuarios iniciar sesión utilizando su correo electrónico y contraseña.
- **RF-001.3:** El sistema debe ofrecer la opción de recuperar la contraseña en caso de olvido.
- **RF-001.4:** Los usuarios deben poder acceder a su perfil para ver y actualizar su información personal y preferencias.
- **RF-001.5:** El sistema debe garantizar que los usuarios solo puedan acceder y modificar sus propios datos personales.

**Prioridad:** Alta  
**Dependencias:** Ninguna  
**Notas:** La gestión de usuarios es fundamental para el funcionamiento de la plataforma, ya que asegura que los usuarios puedan acceder a sus perfiles y gestionar su información personal de manera segura.

---

## Requerimiento de Software: Exploración de Eventos

**ID:** RF-002  
**Descripción:**  
El sistema debe permitir a los usuarios buscar eventos y visualizar detalles específicos de cada uno. Los usuarios deben poder buscar eventos por diferentes criterios como nombre, categoría, ubicación y fecha.

**Requisitos Funcionales:**
- **RF-002.1:** El sistema debe ofrecer una barra de búsqueda que permita a los usuarios buscar eventos por nombre.
- **RF-002.2:** El sistema debe proporcionar filtros para que los usuarios puedan refinar la búsqueda de eventos por categoría, ubicación y fecha.
- **RF-002.3:** Los usuarios deben poder ver una lista de eventos que coincidan con sus criterios de búsqueda.
- **RF-002.4:** El sistema debe mostrar detalles completos del evento, incluyendo la descripción, la fecha, y la ubicación cuando el usuario seleccione un evento de la lista.

**Prioridad:** Alta  
**Dependencias:** Requiere implementación de la gestión de usuarios para personalización de búsqueda.  
**Notas:** La capacidad de explorar eventos es crucial para la funcionalidad principal de la plataforma.

---

## Requerimiento de Software: Registro y Gestión de Eventos

**ID:** RF-003  
**Descripción:**  
El sistema debe permitir a los usuarios registrarse en eventos y gestionar sus registros. Esto incluye la recepción de confirmaciones y recordatorios, así como la capacidad de cancelar registros.

**Requisitos Funcionales:**
- **RF-003.1:** El sistema debe permitir a los usuarios registrarse para eventos mediante un botón de "Registrar" en la página de detalles del evento.
- **RF-003.2:** El sistema debe enviar una confirmación de registro al usuario por correo electrónico una vez que se complete el registro.
- **RF-003.3:** El sistema debe enviar recordatorios por correo electrónico a los usuarios registrados antes de la fecha del evento.
- **RF-003.4:** Los usuarios deben poder ver una lista de eventos a los que están registrados en su perfil y gestionar esos registros, incluyendo la opción de cancelarlos.

**Prioridad:** Alta  
**Dependencias:** Requiere implementación de la exploración de eventos.  
**Notas:** La gestión de registros y notificaciones es esencial para la experiencia del usuario en la plataforma.

---

## Requerimiento de Software: Notificaciones y Recordatorios

**ID:** RF-004  
**Descripción:**  
El sistema debe enviar notificaciones y recordatorios a los usuarios sobre eventos de interés y eventos a los que están registrados.

**Requisitos Funcionales:**
- **RF-004.1:** El sistema debe enviar notificaciones a los usuarios cuando se publiquen nuevos eventos que coincidan con sus intereses o preferencias.
- **RF-004.2:** El sistema debe enviar recordatorios a los usuarios sobre los eventos a los que están registrados, con al menos un recordatorio previo al evento.

**Prioridad:** Media  
**Dependencias:** Requiere implementación de la gestión de eventos y registros.  
**Notas:** Las notificaciones y recordatorios mejoran la participación del usuario en los eventos.

---

## Requerimiento de Software: Calificaciones y Comentarios

**ID:** RF-005  
**Descripción:**  
El sistema debe permitir a los usuarios dejar calificaciones y comentarios sobre eventos a los que asistieron.

**Requisitos Funcionales:**
- **RF-005.1:** El sistema debe permitir a los usuarios calificar los eventos en una escala predefinida (por ejemplo, de 1 a 5 estrellas).
- **RF-005.2:** El sistema debe permitir a los usuarios dejar comentarios sobre los eventos en los que han participado.
- **RF-005.3:** Los comentarios y calificaciones deben ser visibles para otros usuarios que consulten la página del evento.

**Prioridad:** Baja  
**Dependencias:** Requiere que los usuarios hayan asistido a los eventos y que el sistema gestione sus registros.  
**Notas:** Las reseñas ayudan a otros usuarios a tomar decisiones informadas sobre eventos y fomentan la retroalimentación.

---
