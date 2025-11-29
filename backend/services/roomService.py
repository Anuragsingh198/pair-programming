from models.roomModel import Room
from config.database import SessionLocal
from schema.roomschema import RoomSchemaRequest
import uuid
import json
from fastapi import HTTPException
from sqlalchemy.exc import OperationalError
from typing import List

def create_room(data: RoomSchemaRequest):
    db = SessionLocal()
    try:
        room = Room(id=str(uuid.uuid4()), room_name=data.room_name)
        db.add(room)
        db.commit()
        db.refresh(room)
        return room
    except OperationalError as e:
        db.rollback()
        db.close()
        db = SessionLocal()
        try:
            room = Room(id=str(uuid.uuid4()), room_name=data.room_name)
            db.add(room)
            db.commit()
            db.refresh(room)
            return room
        finally:
            db.close()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()

def get_all_rooms() -> List[Room]:
    db = SessionLocal()
    try:
        rooms = db.query(Room).all()
        return rooms
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()
