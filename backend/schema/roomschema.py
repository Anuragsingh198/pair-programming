from pydantic import BaseModel
from typing import List

class RoomSchemaRequest(BaseModel):
    room_name: str

class RoomSchemaResponse(BaseModel):
    room_id: str
    room_name: str
    users: List[str]

class RoomListItem(BaseModel):
    room_id: str
    room_name: str
    user_count: int

class RoomsListResponse(BaseModel):
    rooms: List[RoomListItem]