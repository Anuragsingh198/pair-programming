from fastapi import APIRouter
from controllers.roomcontroller import create_room_controller, get_all_rooms_controller
from schema.roomschema import RoomSchemaRequest, RoomSchemaResponse, RoomsListResponse

router = APIRouter(prefix="/rooms", tags=["Rooms"])

router.post("/", response_model=RoomSchemaResponse)(create_room_controller)
router.get("/", response_model=RoomsListResponse)(get_all_rooms_controller)
