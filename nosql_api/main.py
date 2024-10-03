import os
from fastapi import FastAPI, HTTPException, status
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
        "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
    },
)

origins = [
    "http://localhost",
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

# Modelos de datos
class Comment(BaseModel):
    commentId: Optional[str] = None
    userId: str
    eventId: str
    commentText: str
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class Rating(BaseModel):
    ratingId: Optional[str] = None
    userId: str
    eventId: str
    ratingValue: int = Field(..., ge=1, le=5)

class Notification(BaseModel):
    notificationId: Optional[str] = None
    userId: str
    message: str
    read: bool = False
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class Interaction(BaseModel):
    interactionId: Optional[str] = None
    userId: str
    eventId: str
    interactionType: str
    metadata: dict = {}
    duration: float
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class Error(BaseModel):
    errorId: Optional[str] = None
    errorMessage: str
    errorCode: int
    service: str
    stackTrace: Optional[str] = None
    severity: str
    userImpact: bool
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

@app.get("/test_connection", tags=["test"])
def test_connection():
    try:
        db.list_collection_names()
        return {"message": "Conexión exitosa a MongoDB"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {e}")


# Endpoints para Comentarios
@app.post("/comments", response_model=Comment, status_code=status.HTTP_201_CREATED, tags=["comments"])
def create_comment(comment: Comment):
    result = db.comments.insert_one(comment.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Comentario no creado")
    comment.commentId = str(result.inserted_id)
    return comment

@app.get("/comments", response_model=List[Comment], tags=["comments"])
def get_comments_by_event(event_id: str):
    comments = list(db.comments.find({"eventId": event_id}))
    if not comments:
        raise HTTPException(status_code=404, detail="Comentarios no encontrados para el evento")
    return [Comment(**comment) for comment in comments]

# Endpoints para Calificaciones
@app.post("/ratings", status_code=status.HTTP_201_CREATED, tags=["comments"])
def rate_event(rating: Rating):
    result = db.ratings.insert_one(rating.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Calificación no registrada")
    return {"message": "Calificación registrada exitosamente"}

# Endpoints para Notificaciones
@app.post("/notifications", response_model=Notification, status_code=status.HTTP_201_CREATED, tags=["notifications"])
def create_notification(notification: Notification):
    result = db.notifications.insert_one(notification.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Notificación no creada")
    notification.notificationId = str(result.inserted_id)
    return notification

@app.get("/notifications", response_model=List[Notification], tags=["notifications"])
def get_notifications(user_id: str):
    notifications = list(db.notifications.find({"userId": user_id}))
    if not notifications:
        raise HTTPException(status_code=404, detail="No se encontraron notificaciones para el usuario")
    return [Notification(**notification) for notification in notifications]

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
