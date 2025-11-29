from  sqlalchemy import  Column, Integer, String, JSON
from config.database import Base
import uuid
from datetime import datetime
import json         
class Room(Base):
    __tablename__ = "rooms"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    room_name = Column(String, nullable=False)
    users = Column(JSON, nullable=False, default=lambda: [])