from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import engine, Base
import uvicorn
import os
from dotenv import load_dotenv
from routes import autocompleteRouter, roomsRouter, websockersRouter
from models.roomModel import Room

load_dotenv()

app = FastAPI()

# Configure CORS from environment variables
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
cors_origins_list = [origin.strip() for origin in CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.on_event("startup")
def startup_event():
    try:
        # Create all database tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created/verified successfully")
        with engine.connect() as conn:
            print("Connected to the database")
    except Exception as e:
        print(f"Error connecting to the database: {e}")

# Include routers
app.include_router(roomsRouter.router)
app.include_router(websockersRouter.router)
app.include_router(autocompleteRouter.router)

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    uvicorn.run(app, host=host, port=port, reload=reload)
