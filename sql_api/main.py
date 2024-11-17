from fastapi import FastAPI, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from database import execute_query, execute_non_query
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from openai import OpenAI
import pandas as pd
import matplotlib.pyplot as plt
import io
import base64

USER_NOT_FOUND = "User not found"
EVENT_NOT_FOUND = "Event not found"
REGISTRATION_NOT_FOUND = "Registration not found"
ORGANIZER_NOT_FOUND = "Organizer not found"
CATEGORY_NOT_FOUND = "Category not found"
FEEDBACK_NOT_FOUND = "Feedback not found"

app = FastAPI(
    title="StellarGather SQL Service API",
    description="API para gestionar usuarios, eventos y registros de usuarios en la plataforma StellarGather. Esta API es responsable de gestionar datos de usuarios, información de eventos y detalles de registro mediante una base de datos SQL (MySQL).",
    version="1.0.0",
    contact={"email": "support@stellargather.com"},
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html"
    },
)

origins = [
    "http://localhost:8013",
    "http://129.153.69.231:8013",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Contexto de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Modelos de datos para la API
class User(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    gender: Optional[str] = None
    country: Optional[str] = None
    phone_number: Optional[str] = None
    birth_date: Optional[date] = None

class Event(BaseModel):
    name: str
    description: str
    location: str
    city: str
    country: str
    date: datetime  # El formato debe coincidir con 'YYYY-MM-DD HH:MM:SS'
    max_capacity: int 
    price: float
    organizer_id: int

class Registration(BaseModel):
    user_id: int
    event_id: int
    date: datetime | None = None
    status: str | None = None

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordValidation(BaseModel):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    phone_number: Optional[str] = None
    birth_date: Optional[date] = None
    password: Optional[str] = None

    class Config:
        from_attributes = True

class Organizer(BaseModel):
    name: str
    email: str
    phone: str | None = None

class Category(BaseModel):
    name: str

class EventCategory(BaseModel):
    event_id: int
    category_id: int

class Question(BaseModel):
    question: str

class AnswerChatGPT(BaseModel):
    response_type: str
    sql_query: str
    chart_type: str | None = None
    x_axis: str | None = None
    y_axis: str | None = None
    data_source: str | None = None
    timeframe: str | None = None

class AnswerSQLText(BaseModel):
    text_response: str | None = None
    sql_query: str | None = None
    sql_response: str | None = None

class Feedback(BaseModel):
    user_id: int
    event_id: int
    comment_text: str
    rating_value: int = Field(None, ge=1, le=5)

# Modelo de respuesta para la API
class UserResponse(BaseModel):
    id : int
    username: str
    email: str
    full_name: str
    gender: Optional[str] = None
    country: Optional[str] = None
    phone_number: Optional[str] = None
    birth_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    id : int
    name: str
    description: str
    location: str
    city: str
    country: str
    date: datetime
    max_capacity: int 
    price: float
    organizer_id: int

    class Config:
        from_attributes = True

class RegistrationResponse(BaseModel):
    user_id: int
    event_id: int
    date: datetime 
    status: str
    
    class Config:
        from_attributes = True

class OrganizerResponse(BaseModel):
    id : int
    name: str
    email: str
    phone: str | None = None
    
    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id : int
    name: str

    class Config:
        from_attributes = True

class EventCategoryResponse(BaseModel):
    message: str

    class Config:
        from_attributes = True

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    comment_text: str
    rating_value: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Endpoints para manejo de Usuarios

# Obtener todos los usuarios
@app.get("/users", response_model=List[UserResponse], tags=["users"])
def get_users():
    query = "SELECT * FROM users"
    users = execute_query(query)
    return [UserResponse(**user) for user in users]

# Crear un nuevo usuario
@app.post("/users", response_model=UserResponse, tags=["users"])
def create_user(user: User):
    # Verificar si el nombre de usuario ya está registrado
    query_check_username = "SELECT id FROM users WHERE username = %s"
    existing_username = execute_query(query_check_username, (user.username,))
    
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Verificar si el correo electrónico ya está registrado
    query_check_email = "SELECT id FROM users WHERE email = %s"
    existing_email = execute_query(query_check_email, (user.email,))
    
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hashear la contraseña antes de guardarla
    hashed_password = pwd_context.hash(user.password)

    # Insertar el nuevo usuario en la base de datos
    query_insert_user = """
    INSERT INTO users (username, email, password, full_name, gender, country, phone_number, birth_date) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        user.username,
        user.email,
        hashed_password,
        user.full_name,
        user.gender,
        user.country,
        user.phone_number,
        user.birth_date
    )
    execute_non_query(query_insert_user, params)

    # Obtener el nuevo usuario por su nombre de usuario o correo (para obtener datos como 'created_at' y 'updated_at')
    query_get_user = """
    SELECT id, username, email, full_name, gender, country, phone_number, birth_date, created_at, updated_at
    FROM users WHERE username = %s OR email = %s
    """
    user_data = execute_query(query_get_user, (user.username, user.email))

    if not user_data:
        raise HTTPException(status_code=400, detail="User creation failed")

    # Devuelve el usuario recién creado
    return UserResponse(**user_data[0])


# Obtener un usuario por su id
@app.get("/users/{user_id}", response_model=UserResponse, tags=["users"])
def get_user_by_id(user_id: int):
    query = """
    SELECT id, username, email, full_name, gender, country, phone_number, birth_date, created_at, updated_at 
    FROM users 
    WHERE id = %s
    """
    user = execute_query(query, (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND)
    
    return UserResponse(**user[0])

# Verificar si un usuario es administrador
@app.get("/users/{user_id}/is-admin", response_model=dict, tags=["users"])
def is_admin(user_id: int):
    query = "SELECT COUNT(*) AS is_admin FROM admin_users WHERE user_id = %s"
    result = execute_query(query, (user_id,))
    if result[0]["is_admin"] == 1:
        return {"user_id": user_id, "is_admin": True}
    else:
        return {"user_id": user_id, "is_admin": False}

# Actualizar un usuario por su id
@app.put("/users/{user_id}", response_model=UserResponse, tags=["users"])
def update_user(user_id: int, user: UserUpdate):
    # Primero obtenemos los datos actuales del usuario para asegurarnos de no sobrescribir campos no proporcionados
    query_get_user = """
    SELECT id, username, email, password, full_name, gender, country, phone_number, birth_date, created_at, updated_at
    FROM users WHERE id = %s
    """
    current_user_data = execute_query(query_get_user, (user_id,))
    
    if not current_user_data:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND)

    current_user = current_user_data[0]

    # Si la contraseña es proporcionada, se debe actualizar
    if user.password:
        # Hasheamos la nueva contraseña antes de guardarla
        updated_password = pwd_context.hash(user.password)
    else:
        # Si no se proporciona contraseña, mantenemos la actual
        updated_password = current_user['password']
    
    # Si no se proporciona un campo opcional, mantenemos el valor actual
    updated_username = user.username if user.username else current_user['username']
    updated_email = user.email if user.email else current_user['email']
    updated_full_name = user.full_name if user.full_name else current_user['full_name']
    updated_gender = user.gender if user.gender else current_user['gender']
    updated_country = user.country if user.country else current_user['country']
    updated_phone_number = user.phone_number if user.phone_number else current_user['phone_number']
    updated_birth_date = user.birth_date if user.birth_date else current_user['birth_date']

    # Realizamos la actualización de los datos del usuario
    query = """
    UPDATE users SET 
        username = %s, 
        email = %s, 
        password = %s, 
        full_name = %s, 
        gender = %s, 
        country = %s, 
        phone_number = %s, 
        birth_date = %s
    WHERE id = %s
    """
    params = (
        updated_username, 
        updated_email, 
        updated_password, 
        updated_full_name, 
        updated_gender, 
        updated_country, 
        updated_phone_number, 
        updated_birth_date,
        user_id
    )

    rows_affected = execute_non_query(query, params)

    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="User not found or not updated")
    
    # Obtener los datos actualizados, incluyendo los campos 'created_at' y 'updated_at'
    query_get_updated_user = """
    SELECT id, username, email, full_name, gender, country, phone_number, birth_date, created_at, updated_at
    FROM users WHERE id = %s
    """
    updated_user_data = execute_query(query_get_updated_user, (user_id,))
    
    return UserResponse(**updated_user_data[0])

# Eliminar un usuario por su id
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["users"])
def delete_user(user_id: int):
    query = "DELETE FROM users WHERE id = %s"
    rows_affected = execute_non_query(query, (user_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND)

# Login de un usuario
@app.post("/users/login", tags=["users"])
def login(user: UserLogin):
    # Consulta para verificar si el usuario existe y obtener la contraseña almacenada
    query = "SELECT id, full_name ,password FROM users WHERE username = %s"
    params = (user.username,)
    result = execute_query(query, params)

    if not result:
        # Si el usuario no se encuentra, devuelve un error 404
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user_id, full_name, stored_password = result[0]["id"], result[0]["full_name"], result[0]["password"]

    # Verificación de la contraseña ingresada contra la almacenada
    if not pwd_context.verify(user.password, stored_password):
        # Si la contraseña no coincide, devuelve un error 401
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    # Retorna un mensaje de éxito, el ID del usuario y su nombre
    return {"message": "Inicio de sesión exitoso", "user_id": user_id, "full_name": full_name}

# Endpoint para validar la contraseña del usuario
@app.post("/users/validate-password/{user_id}", status_code=status.HTTP_200_OK, tags=["users"])
def validate_password(user_id: int, password: PasswordValidation):
    # Obtener la contraseña almacenada del usuario por su ID
    query = "SELECT password FROM users WHERE id = %s"
    user_data = execute_query(query, (user_id,))

    if not user_data:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND)
    
    stored_password_hash = user_data[0]['password']
    
    # Verificar si la contraseña ingresada coincide con el hash almacenado
    if pwd_context.verify(password.password, stored_password_hash):
        return {"message": "Password is valid"}
    else:
        raise HTTPException(status_code=400, detail="Incorrect password")

# Obtener eventos registrados por un usuario
@app.get("/users/{user_id}/registration-events", response_model=List[dict], tags=["users"])
def get_registration_events_by_user(user_id: int, page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(10, ge=1)):

    if limit is not None:
        skip = (page - 1) * limit
        query = """
        SELECT events.id AS event_id, events.name, events.description, events.location, events.date as event_date, events.max_capacity, events.price, events.organizer_id, registrations.id AS registration_id, registrations.date AS registration_date, registrations.status
        FROM registrations
        JOIN events ON registrations.event_id = events.id
        WHERE registrations.user_id = %s
        ORDER BY registrations.id DESC
        LIMIT %s OFFSET %s
        """
        events = execute_query(query, (user_id, limit, skip))
    else:
        query = """
        SELECT events.id AS event_id, events.name, events.description, events.location, events.date as event_date, events.max_capacity, events.price, events.organizer_id, registrations.id AS registration_id, registrations.date AS registration_date, registrations.status
        FROM registrations
        JOIN events ON registrations.event_id = events.id
        WHERE registrations.user_id = %s
        ORDER BY registrations.id DESC
        """
        events = execute_query(query, (user_id,))
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this user")
    return events

# Obtener el conteo de eventos registrados por un usuario
@app.get("/users/{user_id}/registrations-count", response_model=dict, tags=["users"])
def get_registration_count_by_user(user_id: int):
    query = "SELECT COUNT(*) AS registration_count FROM registrations WHERE user_id = %s"
    result = execute_query(query, (user_id,))
    if not result:
        raise HTTPException(status_code=404, detail="User not found or no registrations found")
    return {"user_id": user_id, "registration_count": result[0]["registration_count"]}

# Endpoints para manejo de Eventos
# Obtener todos los eventos
@app.get("/events", response_model=List[EventResponse], tags=["events"])
def get_events(page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(10, ge=1)):
    
    if limit is not None:
        skip = (page - 1) * limit
        query = """
        SELECT * FROM events
        LIMIT %s OFFSET %s
        """
        events = execute_query(query, (limit, skip))
    else:
        query = """
        SELECT * FROM events
        """
        events = execute_query(query)
    
    return [EventResponse(**event) for event in events]

# Obtener los eventos más recientes (ordenados por ID en orden descendente)
@app.get("/events-desc", response_model=List[EventResponse], tags=["events"])
def get_events_desc(page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(10, ge=1)):
    skip = (page - 1) * limit

    if limit is not None:
        query = """
        SELECT * FROM events
        ORDER BY id DESC
        LIMIT %s OFFSET %s
        """
        events = execute_query(query, (limit, skip))
    else:
        query = """
        SELECT * FROM events
        ORDER BY id DESC
        """
        events = execute_query(query)
    
    return [EventResponse(**event) for event in events]

# Crear un nuevo evento
@app.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED, tags=["events"])
def create_event(event: Event):
    # Verificar si el evento existe
    query_check_event = "SELECT id FROM events WHERE name = %s AND description = %s"
    existing_event = execute_query(query_check_event, (event.name, event.description))

    if existing_event:
        raise HTTPException(status_code=400, detail="Event already exists")

    query = """
    INSERT INTO events (name, description, location, city, country, date, max_capacity, price, organizer_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (event.name, event.description, event.location, event.city, event.country, event.date, event.max_capacity, event.price, event.organizer_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Event not created")
    
    # Obtener el nuevo evento por su nombre y descripción
    query_get_event = "SELECT * FROM events WHERE name = %s AND description = %s"
    event_data = execute_query(query_get_event, (event.name, event.description))
    return EventResponse(**event_data[0])


# Obtener un evento por su id
@app.get("/events/{event_id}", response_model=EventResponse, tags=["events"])
def get_event_by_id(event_id: int):
    query = "SELECT * FROM events WHERE id = %s"
    event = execute_query(query, (event_id,))
    if not event:
        raise HTTPException(status_code=404, detail=EVENT_NOT_FOUND)
    
    return EventResponse(**event[0])

# Actualizar un evento por su id
@app.put("/events/{event_id}", response_model=EventResponse, tags=["events"])
def update_event(event_id: int, event: Event):
    query = "UPDATE events SET name = %s, description = %s, location = %s, date = %s, max_capacity = %s, price = %s, organizer_id = %s WHERE id = %s"
    params = (event.name, event.description, event.location, event.date, event.max_capacity, event.price, event.organizer_id, event_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Event not found or not updated")
    
    # Obtener los datos actualizados del evento
    query_get_updated_event = "SELECT * FROM events WHERE id = %s"
    updated_event_data = execute_query(query_get_updated_event, (event_id,))
    
    return EventResponse(**updated_event_data[0])

# Eliminar un evento por su id
@app.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["events"])
def delete_event(event_id: int):
    query = "DELETE FROM events WHERE id = %s"
    rows_affected = execute_non_query(query, (event_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail=EVENT_NOT_FOUND)

# Obtener las inscripciones de un evento
@app.get("/events/{event_id}/registrations", response_model=dict, tags=["events"])
def get_event_registrations(event_id: int):
    query_registrations = """
    SELECT registrations.id, registrations.user_id, registrations.event_id, registrations.status, users.username, users.email, users.full_name
    FROM registrations
    JOIN users ON registrations.user_id = users.id
    WHERE registrations.event_id = %s AND registrations.status = 'registered'
    """
    registrations = execute_query(query_registrations, (event_id,))
    
    query_event = "SELECT max_capacity FROM events WHERE id = %s"
    event = execute_query(query_event, (event_id,))
    if not event:
        raise HTTPException(status_code=404, detail=EVENT_NOT_FOUND)
    
    max_capacity = event[0]['max_capacity']
    available_slots = max_capacity - len(registrations) if registrations else max_capacity
    
    return {
        "event_id": event_id,
        "registrations_count": len(registrations),
        "available_slots": available_slots,
        "registrations": registrations
    }

#Obtener los feedbacks de un evento
@app.get("/events/{event_id}/feedbacks", response_model=List[FeedbackResponse], tags=["events"])
def get_event_feedbacks(event_id: int, page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(20, ge=1)):
    
    if limit is not None:
        skip = (page - 1) * limit
        query = """
        SELECT * 
        FROM feedbacks 
        WHERE event_id = %s
        ORDER BY timestamp DESC
        LIMIT %s OFFSET %s
        """
        feedbacks = execute_query(query, (event_id, limit, skip))
    else:
        query = """
        SELECT * 
        FROM feedbacks 
        WHERE event_id = %s
        ORDER BY timestamp DESC
        """
        feedbacks = execute_query(query, (event_id,))
    if not feedbacks:
        raise HTTPException(status_code=404, detail="No feedbacks found for this event")
    return feedbacks

# Obtener los próximos eventos con plazas disponibles
@app.get("/upcoming-events", response_model=List[EventResponse], tags=["events"])
def get_upcoming_events(limit: int = Query(10, ge=1), skip: int = Query(0, ge=0)):
    query = """
    SELECT e.* 
    FROM events e
    LEFT JOIN (
        SELECT event_id, COUNT(*) as registrations_count
        FROM registrations
        GROUP BY event_id
    ) r ON e.id = r.event_id
    WHERE e.date >= NOW() AND (e.max_capacity > IFNULL(r.registrations_count, 0))
    ORDER BY e.date ASC
    LIMIT %s OFFSET %s
    """
    
    # Ejecutar la consulta con los parámetros limit y skip
    events = execute_query(query, (limit, skip))
    
    if not events:
        raise HTTPException(status_code=404, detail="No upcoming events with available slots found")
    
    return [EventResponse(**event) for event in events]


# Obtener el conteo total de eventos
@app.get("/events-count", response_model=dict, tags=["events"])
def get_event_count():
    query = "SELECT COUNT(*) AS event_count FROM events"
    result = execute_query(query)
    return {"event_count": result[0]["event_count"]}

# Obtener el conteo total de eventos un día específico
@app.get("/events/count/by-date/{event_date}", response_model=dict, tags=["events"])
def get_event_count_by_specific_day(event_date: str):
    try:
        date = datetime.strptime(event_date, "%Y-%m-%d").date()  # Solo conservamos la fecha, no la hora
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    query = "SELECT COUNT(*) AS event_count FROM events WHERE DATE(date) = %s"
    result = execute_query(query, (date,))
    return {"event_count": result[0]["event_count"]}

# Obtener los eventos por fecha específica
@app.get("/events/date/{event_date}", response_model=List[EventResponse], tags=["events"])
def get_events_by_date(event_date: str, page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(12, ge=1)):
    try:
        date = datetime.strptime(event_date, "%Y-%m-%d").date()  # Solo conservamos la fecha, no la hora
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    if limit is not None:
        skip = (page - 1) * limit
        query = "SELECT * FROM events WHERE DATE(date) = %s LIMIT %s OFFSET %s"
        events = execute_query(query, (date, limit, skip))
    else:
        query = "SELECT * FROM events WHERE DATE(date) = %s"
        events = execute_query(query, (date,))
    
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this date")
    
    return [EventResponse(**event) for event in events]

# Obtener el conteo de eventos por fecha
@app.get("/events/count/by-date", response_model=List[dict], tags=["events"])
def get_event_count_by_date():
    query = """
    SELECT DATE(date) AS event_date, COUNT(*) AS event_count
    FROM events
    GROUP BY event_date
    ORDER BY event_date ASC
    """
    results = execute_query(query)
    return results

# Obtener eventos por país específico
@app.get("/events/country/{country}", response_model=List[EventResponse], tags=["events"])
def get_events_by_country(country: str, page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(10, ge=1)):

    if limit is not None:
        skip = (page - 1) * limit
        query = "SELECT * FROM events WHERE country = %s LIMIT %s OFFSET %s"
        events = execute_query(query, (country, limit, skip))
    else:
        query = "SELECT * FROM events WHERE country = %s"
        events = execute_query(query, (country,))

    if not events:
        raise HTTPException(status_code=404, detail="No events found for this country")
    return [EventResponse(**event) for event in events]

# Obtener el conteo de eventos por país
@app.get("/events/count/by-country", response_model=List[dict], tags=["events"])
def get_event_count_by_country():
    query = """
    SELECT country, COUNT(*) AS event_count
    FROM events
    GROUP BY country
    ORDER BY country ASC
    """
    results = execute_query(query)
    return results

# Obtener el conteo de eventos por país específico
@app.get("/events/count/by-country/{country}", response_model=dict, tags=["events"])
def get_event_count_by_specific_country(country: str):
    query = "SELECT COUNT(*) AS event_count FROM events WHERE country = %s"
    result = execute_query(query, (country,))
    return {"country": country, "event_count": result[0]["event_count"]}

# Obtener los eventos por organizador de eventos
@app.get("/events/organizer/{organizer_id}", response_model=List[EventResponse], tags=["events"])
def get_events_by_organizer(organizer_id: int, page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(10, ge=1)):
        
        if limit is not None:
            skip = (page - 1) * limit
            query = "SELECT * FROM events WHERE organizer_id = %s LIMIT %s OFFSET %s"
            events = execute_query(query, (organizer_id, limit, skip))
        else:
            query = "SELECT * FROM events WHERE organizer_id = %s"
            events = execute_query(query, (organizer_id,))
        
        if not events:
            raise HTTPException(status_code=404, detail="No events found for this organizer")
        
        return [EventResponse(**event) for event in events]

# Obtener el conteo de eventos por organizador
@app.get("/events/count/by-organizer", response_model=List[dict], tags=["events"])
def get_event_count_by_organizer():
    query = """
    SELECT organizers.id, organizers.name AS organizer_name, COUNT(events.id) AS event_count
    FROM events
    JOIN organizers ON events.organizer_id = organizers.id
    GROUP BY organizers.id
    ORDER BY organizer_name ASC
    """
    results = execute_query(query)
    return results

# Obtener el conteo de eventos por organizador específico
@app.get("/events/count/by-organizer/{organizer_id}", response_model=dict, tags=["events"])
def get_event_count_by_specific_organizer(organizer_id: int):
    query = "SELECT COUNT(*) AS event_count FROM events WHERE organizer_id = %s"
    result = execute_query(query, (organizer_id,))
    return {"organizer_id": organizer_id, "event_count": result[0]["event_count"]}


# Endpoints para manejo de Registros
# Obtener todos los registros
@app.get("/registrations", response_model=List[RegistrationResponse], tags=["registrations"])
def get_registrations():
    query = "SELECT * FROM registrations"
    registrations = execute_query(query)
    return [RegistrationResponse(**registration) for registration in registrations]

# Crear un nuevo registro
@app.post("/registrations", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED, tags=["registrations"])
def create_registration(registration: Registration):
    current_date = datetime.now()
    
    # Verificar si el evento existe
    query_event = "SELECT date FROM events WHERE id = %s"
    event = execute_query(query_event, (registration.event_id,))
    if not event:
        raise HTTPException(status_code=404, detail=EVENT_NOT_FOUND)
    
    event_date = event[0]["date"]
    if event_date < current_date:
        raise HTTPException(status_code=400, detail="Cannot register for past events")
    
    # Verificar si ya existe un registro con el mismo evento_id y usuario_id en estado "registered"
    query_check_registered = "SELECT COUNT(*) AS count FROM registrations WHERE user_id = %s AND event_id = %s AND status = 'registered'"
    result_check_registered = execute_query(query_check_registered, (registration.user_id, registration.event_id))
    
    if result_check_registered[0]['count'] > 0:
        raise HTTPException(status_code=400, detail="User is already registered for this event")
    
    # Verificar si ya ha cancelado el registro dos veces
    query_check_canceled = "SELECT COUNT(*) AS count FROM registrations WHERE user_id = %s AND event_id = %s AND status = 'canceled'"
    result_check_canceled = execute_query(query_check_canceled, (registration.user_id, registration.event_id))

    if result_check_canceled[0]['count'] >= 2:
        raise HTTPException(status_code=400, detail="Ha cancelado su inscripción para este evento dos veces y no puede registrarse nuevamente. Comuníquese con el servicio de asistencia para obtener ayuda.")
    
    # Realizar la inserción del registro de inscripción
    query = "INSERT INTO registrations (user_id, event_id, status) VALUES (%s, %s, 'registered')"
    params = (registration.user_id, registration.event_id)
    rows_affected = execute_non_query(query, params)
    
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Registration not created")
    
    return RegistrationResponse(user_id=registration.user_id, event_id=registration.event_id, status='registered', date=current_date)

# Obtener un registro por su id
@app.get("/registrations/{registration_id}", response_model=RegistrationResponse, tags=["registrations"])
def get_registration_by_id(registration_id: int):
    query = "SELECT * FROM registrations WHERE id = %s"
    registration = execute_query(query, (registration_id,))
    if not registration:
        raise HTTPException(status_code=404, detail=REGISTRATION_NOT_FOUND)
    return RegistrationResponse(**registration[0])

# Actualizar un registro
@app.put("/registrations/{registration_id}", response_model=RegistrationResponse, tags=["registrations"])
def update_registration(registration_id: int):
    # Verifica el estado actual de la inscripción
    query = "SELECT * FROM registrations WHERE id = %s"
    current_registration = execute_query(query, (registration_id,))
    if not current_registration:
        raise HTTPException(status_code=404, detail=REGISTRATION_NOT_FOUND)
    
    current_registration = current_registration[0]
    
    # Verifica si el evento ya pasó
    query_event = "SELECT date FROM events WHERE id = %s"
    event = execute_query(query_event, (current_registration["event_id"],))
    if not event:
        raise HTTPException(status_code=404, detail=EVENT_NOT_FOUND)
    
    event_date = event[0]["date"]
    if event_date < datetime.now():
        raise HTTPException(status_code=400, detail="Cannot update registration for past events")
    
    # Solo permite cambiar de "registered" a "canceled"
    if current_registration["status"] != "registered":
        raise HTTPException(status_code=400, detail="Only registered registrations can be canceled")

    # Actualiza el estado a "canceled"
    query = "UPDATE registrations SET status = %s WHERE id = %s"
    params = ("canceled", registration_id)
    rows_affected = execute_non_query(query, params)
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Registration not found or not updated")

    # Retorna la inscripción actualizada
    current_registration["status"] = "canceled"
    return RegistrationResponse(**current_registration)

# Verificar el registro de un usuario para un evento específico
@app.get("/registrations/check/{user_id}/{event_id}", response_model=RegistrationResponse, tags=["registrations"])
def check_registration(user_id: int, event_id: int):
    query = "SELECT * FROM registrations WHERE user_id = %s AND event_id = %s AND status = 'registered'"
    registration = execute_query(query, (user_id, event_id))
    if not registration:
        raise HTTPException(status_code=404, detail=REGISTRATION_NOT_FOUND)
    return RegistrationResponse(**registration[0])

# Eliminar un registro por su id
@app.delete("/registrations/{registration_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["registrations"])
def delete_registration(registration_id: int):
    query = "DELETE FROM registrations WHERE id = %s"
    rows_affected = execute_non_query(query, (registration_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail=REGISTRATION_NOT_FOUND)
    
    
# Endpoints para manejo de Organizadores
# Obtener todos los organizadores
@app.get("/organizers", response_model=List[OrganizerResponse], tags=["organizers"])
def get_organizers():
    query = "SELECT * FROM organizers"
    organizers = execute_query(query)
    return [OrganizerResponse(**organizer) for organizer in organizers]

# Crear un nuevo organizador
@app.post("/organizers", response_model=OrganizerResponse, status_code=status.HTTP_201_CREATED, tags=["organizers"])
def create_organizer(organizer: Organizer):
    # Verificar si el organizador ya existe
    query_check_organizer = "SELECT id FROM organizers WHERE name = %s AND email = %s"
    existing_organizer = execute_query(query_check_organizer, (organizer.name, organizer.email))

    if existing_organizer:
        raise HTTPException(status_code=400, detail="Organizer already exists")

    query = "INSERT INTO organizers (name, email, phone) VALUES (%s, %s, %s)"
    params = (organizer.name, organizer.email, organizer.phone)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Organizer not created")
    
    # Obtener el nuevo organizador por su nombre y correo
    query_get_organizer = "SELECT * FROM organizers WHERE name = %s AND email = %s"
    organizer_data = execute_query(query_get_organizer, (organizer.name, organizer.email))
    return OrganizerResponse(**organizer_data[0])


# Obtener un organizador por su id
@app.get("/organizers/{organizer_id}", response_model=OrganizerResponse, tags=["organizers"])
def get_organizer_by_id(organizer_id: int):
    query = "SELECT * FROM organizers WHERE id = %s"
    organizer = execute_query(query, (organizer_id,))
    if not organizer:
        raise HTTPException(status_code=404, detail=ORGANIZER_NOT_FOUND)
    return OrganizerResponse(**organizer[0])

# Actualizar un organizador por su id
@app.put("/organizers/{organizer_id}", response_model=OrganizerResponse, tags=["organizers"])
def update_organizer(organizer_id: int, organizer: Organizer):
    query = "UPDATE organizers SET name = %s, email = %s, phone = %s WHERE id = %s"
    params = (organizer.name, organizer.email, organizer.phone, organizer_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Organizer not found or not updated")
    
    # Obtener los datos actualizados del organizador
    query_get_updated_organizer = "SELECT * FROM organizers WHERE id = %s"
    updated_organizer = execute_query(query_get_updated_organizer, (organizer_id,))
    return OrganizerResponse(**updated_organizer[0])

# Eliminar un organizador por su id
@app.delete("/organizers/{organizer_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["organizers"])
def delete_organizer(organizer_id: int):
    query = "DELETE FROM organizers WHERE id = %s"
    rows_affected = execute_non_query(query, (organizer_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail=ORGANIZER_NOT_FOUND)

    
# Endpoints para manejo de Categorías
# Obtener todas las categorías
@app.get("/categories", response_model=List[CategoryResponse], tags=["categories"])
def get_categories():
    query = "SELECT * FROM categories ORDER BY id"
    categories = execute_query(query)
    return [CategoryResponse(**category) for category in categories]

# Crear una nueva categoría
@app.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, tags=["categories"])
def create_category(category: Category):
    # Verificar si la categoría ya existe
    query_check_category = "SELECT id FROM categories WHERE name = %s"
    existing_category = execute_query(query_check_category, (category.name,))

    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    query = "INSERT INTO categories (name) VALUES (%s)"
    params = (category.name,)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Category not created")
    
    # Obtener la nueva categoría por su nombre
    query_get_category = "SELECT * FROM categories WHERE name = %s"
    category = execute_query(query_get_category, (category.name,))
    return CategoryResponse(**category[0])

# Obtener una categoría por su id
@app.get("/categories/{category_id}", response_model=CategoryResponse, tags=["categories"])
def get_category_by_id(category_id: int):
    query = "SELECT * FROM categories WHERE id = %s"
    category = execute_query(query, (category_id,))
    if not category:
        raise HTTPException(status_code=404, detail=CATEGORY_NOT_FOUND)
    return CategoryResponse(**category[0])

# Actualizar una categoría por su id
@app.put("/categories/{category_id}", response_model=CategoryResponse, tags=["categories"])
def update_category(category_id: int, category: Category):
    query = "UPDATE categories SET name = %s WHERE id = %s"
    params = (category.name, category_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Category not found or not updated")
    
    # Obtener los datos actualizados de la categoría
    query_get_updated_category = "SELECT * FROM categories WHERE id = %s"
    category = execute_query(query_get_updated_category, (category_id,))
    return CategoryResponse(**category[0])

# Eliminar una categoría por su id
@app.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["categories"])
def delete_category(category_id: int):
    query = "DELETE FROM categories WHERE id = %s"
    rows_affected = execute_non_query(query, (category_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail=CATEGORY_NOT_FOUND)

# Obtener el conteo de eventos por categoría
@app.get("/categories/events/count", response_model=List[dict], tags=["categories"])
def get_event_count_by_category():
    query = """
    SELECT categories.id, categories.name, COUNT(event_categories.event_id) AS event_count
    FROM categories
    LEFT JOIN event_categories ON categories.id = event_categories.category_id
    GROUP BY categories.id, categories.name
    ORDER BY categories.name ASC
    """
    results = execute_query(query)
    return results

# Obtener el conteo de eventos en una categoría específica
@app.get("/categories/{category_id}/events-count", response_model=dict, tags=["categories"])
def get_event_count_by_category_id(category_id: int):
    query = """
    SELECT COUNT(*) AS event_count
    FROM event_categories
    WHERE category_id = %s
    """
    result = execute_query(query, (category_id,))
    if not result:
        raise HTTPException(status_code=404, detail="Category not found or no events found for this category")
    return {"category_id": category_id, "event_count": result[0]["event_count"]}

# Endpoints para manejo de Categorías de Eventos
# Obtener todas las categorías de eventos
@app.get("/event_categories", response_model=List[EventCategory], tags=["event_categories"])
def get_event_categories():
    query = "SELECT * FROM event_categories"
    event_categories = execute_query(query)
    return [EventCategory(**event_category) for event_category in event_categories]

# Crear una nueva categoría de evento
@app.post("/event_categories", response_model=EventCategoryResponse, status_code=status.HTTP_201_CREATED, tags=["event_categories"])
def create_event_category(event_category: EventCategory):
    # Verificar si la categoría de evento ya existe
    query_check_event_category = "SELECT * FROM event_categories WHERE event_id = %s AND category_id = %s"
    existing_event_category = execute_query(query_check_event_category, (event_category.event_id, event_category.category_id))

    if existing_event_category:
        raise HTTPException(status_code=400, detail="Event category already exists")
    
    query = "INSERT INTO event_categories (event_id, category_id) VALUES (%s, %s)"
    params = (event_category.event_id, event_category.category_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Event category not created")
    return EventCategoryResponse(message="Event category created")

# Obtener categorías por evento
@app.get("/events/{event_id}/categories", response_model=List[CategoryResponse], tags=["event_categories"])
def get_categories_by_event(event_id: int):
    query = """
    SELECT categories.id, categories.name
    FROM event_categories
    JOIN categories ON event_categories.category_id = categories.id
    WHERE event_categories.event_id = %s
    """
    categories = execute_query(query, (event_id,))
    if not categories:
        raise HTTPException(status_code=404, detail="No categories found for this event")
    return [CategoryResponse(**category) for category in categories]

# Obtener eventos por categoría
@app.get("/categories/{category_id}/events", response_model=List[EventResponse], tags=["event_categories"])
def get_events_by_category(category_id: int, page: Optional[int] = Query(1, ge=1), limit: Optional[int] = Query(10, ge=1)):
    
    if limit is not None:
        skip = (page - 1) * limit
        query = """
        SELECT events.id, events.name, events.description, events.location, events.city, events.country, events.date, events.max_capacity, events.price, events.organizer_id
        FROM event_categories
        JOIN events ON event_categories.event_id = events.id
        WHERE event_categories.category_id = %s
        LIMIT %s OFFSET %s
        """
        events = execute_query(query, (category_id, limit, skip))
    else:
        query = """
        SELECT events.id, events.name, events.description, events.location, events.city, events.country, events.date, events.max_capacity, events.price, events.organizer_id
        FROM event_categories
        JOIN events ON event_categories.event_id = events.id
        WHERE event_categories.category_id = %s
        """
        events = execute_query(query, (category_id,))

    if not events:
        raise HTTPException(status_code=404, detail="No events found for this category")
    return [EventResponse(**event) for event in events]

# Eliminar una categoría de evento
@app.delete("/event_categories/{event_id}/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["event_categories"])
def delete_event_category(event_id: int, category_id: int):
    query = "DELETE FROM event_categories WHERE event_id = %s AND category_id = %s"
    rows_affected = execute_non_query(query, (event_id, category_id))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Event category not found")
    
# Endpoints para manejo de Feedbacks

# Obtener todos los feedbacks
@app.get("/feedbacks", response_model=List[FeedbackResponse], tags=["feedbacks"])
def get_feedbacks():
    query = "SELECT * FROM feedbacks"
    feedbacks = execute_query(query)
    return [FeedbackResponse(**feedback) for feedback in feedbacks]

# Crear un nuevo feedback
@app.post("/feedbacks", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, tags=["feedbacks"])
def create_feedback(feedback: Feedback):
    query = """
    INSERT INTO feedbacks (user_id, event_id, comment_text, rating_value)
    VALUES (%s, %s, %s, %s)
    """
    params = (feedback.user_id, feedback.event_id, feedback.comment_text, feedback.rating_value)
    execute_non_query(query, params)

    # Obtener el nuevo feedback por su user_id y event_id
    query_get_feedback = "SELECT * FROM feedbacks WHERE user_id = %s AND event_id = %s ORDER BY timestamp DESC LIMIT 1"
    feedback_data = execute_query(query_get_feedback, (feedback.user_id, feedback.event_id))
    return FeedbackResponse(**feedback_data[0])

# Obtener un feedback por su id
@app.get("/feedbacks/{feedback_id}", response_model=FeedbackResponse, tags=["feedbacks"])
def get_feedback_by_id(feedback_id: int):
    query = "SELECT * FROM feedbacks WHERE id = %s"
    feedback = execute_query(query, (feedback_id,))
    if not feedback:
        raise HTTPException(status_code=404, detail=FEEDBACK_NOT_FOUND)
    return FeedbackResponse(**feedback[0])

# Actualizar un feedback por su id
@app.put("/feedbacks/{feedback_id}", response_model=FeedbackResponse, tags=["feedbacks"])
def update_feedback(feedback_id: int, feedback: Feedback):
    query = """
    UPDATE feedbacks SET user_id = %s, event_id = %s, comment_text = %s, rating_value = %s
    WHERE id = %s
    """
    params = (feedback.user_id, feedback.event_id, feedback.comment_text, feedback.rating_value, feedback_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Feedback not found or not updated")

    # Obtener los datos actualizados del feedback
    query_get_updated_feedback = "SELECT * FROM feedbacks WHERE id = %s"
    updated_feedback = execute_query(query_get_updated_feedback, (feedback_id,))
    return FeedbackResponse(**updated_feedback[0])

# Eliminar un feedback por su id
@app.delete("/feedbacks/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["feedbacks"])
def delete_feedback(feedback_id: int):
    query = "DELETE FROM feedbacks WHERE id = %s"
    rows_affected = execute_non_query(query, (feedback_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail=FEEDBACK_NOT_FOUND)

# Endpoint para obtener estadísticas generales
@app.get("/general-statistics", response_model=dict, tags=["statistics"])
def get_general_statistics():
    queries = {
        "total_comments": "SELECT COUNT(*) AS total_comments FROM feedbacks",
        "avg_rating": "SELECT AVG(rating_value) AS avg_rating FROM feedbacks",
        "total_registrations": "SELECT COUNT(*) AS total_registrations FROM registrations"
    }
    
    results = {}
    for key, query in queries.items():
        result = execute_query(query)
        if key == "avg_rating":
            results[key] = float(result[0][key])
        else:
            results[key] = result[0][key]
    
    return results

# Endpoint dinámico para API SQL(Beta v1.0)
api_key_stellargather = "" # Pones la API Key de OpenAI

# Función para enviar la pregunta a ChatGPT y obtener la clasificación y detalles
def classify_question_with_chatgpt(question: Question):
    try:
        schema_context = """
        Eres un asistente que puede determinar si una pregunta está relacionada con una consulta SQL o un gráfico. MySQL es el sistema de gestión de
        bases de datos que se utiliza en la base de datos de StellarGather. Si la pregunta requiere SQL, genera la consulta SQL solamente 
        sin más (sql_query). Si la pregunta requiere un gráfico, determina el tipo de gráfico (por ejemplo, barras, líneas, pasteles, etc.) y 
        devuelve los parámetros necesarios (sql_query (para obtener los datos necesarios para el gráfico), chart_type: str, x_axis: str, 
        y_axis: str, data_source: str, timeframe: str). Si la pregunta es sql devuelves en el response_type 'sql' y si es gráfico devuelves 'chart'.

        Debes tener sumo cuidado con las consultas SQL que vas a generar, el campo sql_query debe estar solo la consulta 
        SQL que responda a la pregunta (No pueden haber puntos al final de la consulta SQL).

        Aquí está el esquema de la base de datos:
        - users: id, username, email, password, full_name, gender ('male', 'female'), country, phone_number, birth_date, created_at, updated_at
        - organizers: id, name, email, phone
        - categories: id, name
        - events: id, name, description, location, city, country, date, max_capacity, price, organizer_id
        - registrations: id, user_id, event_id, status ('registered', 'canceled'), date
        - event_categories: event_id, category_id
        - feedbacks: id, user_id, event_id, comment_text, rating_value, timestamp. (Cuando hablen sobre comentarios,
        es el comment_text, cuando hablen de calificación, es el rating_value)

        Las claves foráneas aseguran las integraciones entre tablas, y se aplican restricciones de unicidad y consistencia de 
        datos en los atributos clave. Nunca vayas a devolver el password de cuanda vayas a mostrar información de la tabla users.

        Al nombrar x_axis e y_axis, debe tener los mismos nombres a los que devuelva la consulta SQL.
        """

        # Solicitar a ChatGPT que determine el tipo de respuesta
        client = OpenAI(api_key=api_key_stellargather)
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{schema_context}"},
                {"role": "user", "content": question.question}
            ],
            max_tokens=300,
            temperature=0.5,
            response_format=AnswerChatGPT,
        )
        
        return response.choices[0].message.parsed
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la pregunta: {str(e)}")

# Función para generar gráficos
def generate_graph(data: pd.DataFrame, chart_type: str, x_axis: str, y_axis: str) -> str:
    ax = plt.subplots()

    if chart_type == 'bar':
        data.plot(kind='bar', ax=ax, x=x_axis, y=y_axis)
    elif chart_type == 'line':
        data.plot(kind='line', ax=ax, x=x_axis, y=y_axis)
    elif chart_type == 'pie':
        data.set_index(x_axis).plot(kind='pie', ax=ax, y=y_axis)
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return image_base64

# Endpoint principal
@app.post("/generate-statistics-endpoint", tags=["dynamic_statistics"])
async def generate_statistics_endpoint(query: Question):
    # Clasificar la pregunta con ChatGPT
    response_chatgpt = classify_question_with_chatgpt(query)
    
    # Si la respuesta es un SQL, ejecutar la consulta y devolver los resultados
    if response_chatgpt.response_type == 'sql':
        querysql = response_chatgpt.sql_query
        result = execute_query(querysql)
        return result
    
    # Si la respuesta es un gráfico, generar el gráfico y devolver la imagen en base64
    elif response_chatgpt.response_type == 'chart':
        query = response_chatgpt.sql_query
        result = execute_query(query)

        # Obtener parámetros del gráfico desde la respuesta de ChatGPT
        data = pd.DataFrame(result)
        chart_type = response_chatgpt.chart_type
        x_axis = response_chatgpt.x_axis
        y_axis = response_chatgpt.y_axis

        # Generar el gráfico y devolver la imagen en base64
        image_base64 = generate_graph(data, chart_type, x_axis, y_axis)
        return {"image_base64": image_base64, "sql_query": query}

    return response_chatgpt