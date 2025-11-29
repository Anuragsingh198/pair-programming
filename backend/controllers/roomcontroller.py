import json
from fastapi import HTTPException
from schema.roomschema import RoomSchemaRequest, RoomSchemaResponse, RoomsListResponse, RoomListItem
from services.roomService import create_room, get_all_rooms

async def create_room_controller(request: RoomSchemaRequest) -> RoomSchemaResponse:
    try:
        room = create_room(request)
        users = room.users if isinstance(room.users, list) else (json.loads(room.users) if isinstance(room.users, str) else [])
        return RoomSchemaResponse(
            room_id=room.id,
            room_name=room.room_name,
            users=users
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_all_rooms_controller() -> RoomsListResponse:
    try:
        rooms = get_all_rooms()
        room_list = []
        for room in rooms:
            users = room.users if isinstance(room.users, list) else (json.loads(room.users) if isinstance(room.users, str) else [])
            room_list.append(RoomListItem(
                room_id=room.id,
                room_name=room.room_name,
                user_count=len(users) if isinstance(users, list) else 0
            ))
        return RoomsListResponse(rooms=room_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
