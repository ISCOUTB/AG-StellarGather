import os
from fastapi import FastAPI, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from pymongo import MongoClient
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="StellarGather NoSQL Service API",
    description="API para gestionar interacciones, errores, comentarios, calificaciones y notificaciones en el servicio NoSQL de StellarGather.",
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

client = MongoClient(os.getenv("MONGODB_URL"))
db = client.stellargather_nosql

class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsletterSubscriber(BaseModel):
    email: str
    subscribed_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class Interaction(BaseModel):
    userId: str
    interactionType: str
    metadata: dict = {}
    duration: float
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class Error(BaseModel):
    errorMessage: str
    errorCode: int
    service: str
    information: str
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

@app.get("/", tags=["status"])
def read_root():
    return {"message": "API working correctly"}

# Endpoints para Mensajes de Contacto
@app.post("/contact", response_model=ContactMessage, status_code=status.HTTP_201_CREATED, tags=["contact"])
def create_contact_message(contact_message: ContactMessage):
    result = db.contact_messages.insert_one(contact_message.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Mensaje de contacto no creado")
    return contact_message

@app.get("/contact", response_model=List[ContactMessage], tags=["contact"])
def get_contact_messages(
    limit: int = Query(20, ge=1),
    offset: int = Query(0, ge=0)
):
    contact_messages = list(db.contact_messages.find().sort("timestamp", -1).skip(offset).limit(limit))
    
    if not contact_messages:
        raise HTTPException(status_code=404, detail="No se encontraron mensajes de contacto")
    
    return [ContactMessage(**message) for message in contact_messages]

@app.get("/contact/count", tags=["contact"])
def count_contact_messages():
    count = db.contact_messages.count_documents({})
    return {"count": count}

# Endpoints para Suscriptores del Boletín
@app.post("/newsletter", response_model=NewsletterSubscriber, status_code=status.HTTP_201_CREATED, tags=["newsletter"])
def subscribe_newsletter(subscriber: NewsletterSubscriber):
    existing_subscriber = db.newsletter_subscribers.find_one({"email": subscriber.email})
    if existing_subscriber:
        raise HTTPException(status_code=400, detail="El correo ya está suscrito")
    result = db.newsletter_subscribers.insert_one(subscriber.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Suscripción no creada")
    return subscriber

@app.get("/newsletter", response_model=List[NewsletterSubscriber], tags=["newsletter"])
def get_newsletter_subscribers(
    limit: int = Query(20, ge=1),
    offset: int = Query(0, ge=0)
):
    subscribers = list(db.newsletter_subscribers.find().sort("subscribed_at", -1).skip(offset).limit(limit))
    
    if not subscribers:
        raise HTTPException(status_code=404, detail="No se encontraron suscriptores")
    
    return [NewsletterSubscriber(**subscriber) for subscriber in subscribers]

@app.get("/newsletter/count", tags=["newsletter"])
def count_newsletter_subscribers():
    count = db.newsletter_subscribers.count_documents({})
    return {"count": count}

# Endpoints para Interacciones
@app.post("/interactions", status_code=status.HTTP_201_CREATED, tags=["interactions"])
def create_interaction(interaction: Interaction):
    result = db.interactions.insert_one(interaction.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Interacción no registrada")
    return {"message": "Interacción registrada exitosamente"}

@app.get("/interactions", response_model=List[Interaction], tags=["interactions"])
def get_user_interactions(user_id: str):
    interactions = list(db.interactions.find({"userId": user_id}))
    if not interactions:
        raise HTTPException(status_code=404, detail="No se encontraron interacciones para el usuario")
    return [Interaction(**interaction) for interaction in interactions]

# Endpoints para Errores
@app.post("/errors", status_code=status.HTTP_201_CREATED, tags=["errors"])
def log_error(error: Error):
    result = db.errors.insert_one(error.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Error no registrado")
    return {"message": "Error registrado exitosamente"}

@app.get("/errors", response_model=List[Error], tags=["errors"])
def get_errors():
    errors = list(db.errors.find())
    if not errors:
        raise HTTPException(status_code=404, detail="No se encontraron errores registrados")
    return [Error(**error) for error in errors]
