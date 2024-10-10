from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List
from database import execute_query, execute_non_query
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware

DIRECTION = "http://localhost"
QUERY_LAST_INSERT_ID = "SELECT LAST_INSERT_ID() as id"

app = FastAPI(
    title="StellarGather SQL Service API",
    description="API para gestionar usuarios, eventos y registros de usuarios en la plataforma StellarGather. Esta API es responsable de gestionar datos de usuarios, información de eventos y detalles de registro mediante una base de datos SQL (MySQL).",
    version="1.0.0",
    contact={"email": "support@stellargather.com"},
    license_info={
        "name": "Apache 2.0",
        "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
    },
)

origins = [
    DIRECTION,
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
    id: int | None = None
    username: str
    email: str
    password: str
    full_name: str | None = None

class Event(BaseModel):
    id: int | None = None
    name: str
    description: str | None = None
    location: str | None = None
    date: str  # El formato debe coincidir con 'YYYY-MM-DD HH:MM:SS'

class Registration(BaseModel):
    id: int | None = None
    user_id: int
    event_id: int
    status: str

class UserLogin(BaseModel):
    email: str
    password: str

# Endpoints para manejo de Usuarios
@app.get("/users", response_model=List[User], tags=["users"])
def get_users():
    query = "SELECT * FROM users"
    users = execute_query(query)
    return users

@app.post("/users", response_model=User, status_code=status.HTTP_201_CREATED, tags=["users"])
def create_user(user: User):
    hashed_password = pwd_context.hash(user.password)
    query = "INSERT INTO users (username, email, password, full_name) VALUES (%s, %s, %s, %s)"
    params = (user.username, user.email, hashed_password, user.full_name)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="User not created")
    user.id = execute_query(QUERY_LAST_INSERT_ID)[0]['id']
    user.password = "********"
    return user

@app.get("/users/{user_id}", response_model=User, tags=["users"])
def get_user_by_id(user_id: int):
    query = "SELECT * FROM users WHERE id = %s"
    user = execute_query(query, (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user[0]

@app.put("/users/{user_id}", response_model=User, tags=["users"])
def update_user(user_id: int, user: User):
    query = "UPDATE users SET username = %s, email = %s, full_name = %s WHERE id = %s"
    params = (user.username, user.email, user.full_name, user_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="User not found or not updated")
    return user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["users"])
def delete_user(user_id: int):
    query = "DELETE FROM users WHERE id = %s"
    rows_affected = execute_non_query(query, (user_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="User not found")

@app.post("/users/login", tags=["users"])
def login(user: UserLogin):
    # Consulta para verificar si el usuario existe y obtener la contraseña almacenada
    query = "SELECT id, full_name ,password FROM users WHERE email = %s"
    params = (user.email,)
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


# Endpoints para manejo de Eventos
@app.get("/events", response_model=List[Event], tags=["events"])
def get_events():
    query = "SELECT * FROM events"
    events = execute_query(query)
    return events

@app.post("/events", response_model=Event, status_code=status.HTTP_201_CREATED, tags=["events"])
def create_event(event: Event):
    query = "INSERT INTO events (name, description, location, date) VALUES (%s, %s, %s, %s)"
    params = (event.name, event.description, event.location, event.date)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Event not created")
    event.id = execute_query("SELECT LAST_INSERT_ID() as id")[0]['id']
    return event

@app.get("/events/{event_id}", response_model=Event, tags=["events"])
def get_event_by_id(event_id: int):
    query = "SELECT * FROM events WHERE id = %s"
    event = execute_query(query, (event_id,))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event[0]

@app.put("/events/{event_id}", response_model=Event, tags=["events"])
def update_event(event_id: int, event: Event):
    query = "UPDATE events SET name = %s, description = %s, location = %s, date = %s WHERE id = %s"
    params = (event.name, event.description, event.location, event.date, event_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Event not found or not updated")
    return event

@app.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["events"])
def delete_event(event_id: int):
    query = "DELETE FROM events WHERE id = %s"
    rows_affected = execute_non_query(query, (event_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Event not found")

# Endpoints para manejo de Registros
@app.get("/registrations", response_model=List[Registration], tags=["registrations"])
def get_registrations():
    query = "SELECT * FROM registrations"
    registrations = execute_query(query)
    return registrations

@app.post("/registrations", response_model=Registration, status_code=status.HTTP_201_CREATED, tags=["registrations"])
def create_registration(registration: Registration):
    query = "INSERT INTO registrations (user_id, event_id, status) VALUES (%s, %s, %s)"
    params = (registration.user_id, registration.event_id, registration.status)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=400, detail="Registration not created")
    registration.id = execute_query(QUERY_LAST_INSERT_ID)[0]['id']
    return registration

@app.get("/registrations/{registration_id}", response_model=Registration, tags=["registrations"])
def get_registration_by_id(registration_id: int):
    query = "SELECT * FROM registrations WHERE id = %s"
    registration = execute_query(query, (registration_id,))
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    return registration[0]

@app.put("/registrations/{registration_id}", response_model=Registration, tags=["registrations"])
def update_registration(registration_id: int, registration: Registration):
    query = "UPDATE registrations SET user_id = %s, event_id = %s, status = %s WHERE id = %s"
    params = (registration.user_id, registration.event_id, registration.status, registration_id)
    rows_affected = execute_non_query(query, params)
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Registration not found or not updated")
    return registration

@app.delete("/registrations/{registration_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["registrations"])
def delete_registration(registration_id: int):
    query = "DELETE FROM registrations WHERE id = %s"
    rows_affected = execute_non_query(query, (registration_id,))
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
