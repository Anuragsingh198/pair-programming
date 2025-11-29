from fastapi import APIRouter, WebSocket
from controllers.socketController import WebSocketController

router = APIRouter()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await WebSocketController.handle_connection(websocket, room_id)
