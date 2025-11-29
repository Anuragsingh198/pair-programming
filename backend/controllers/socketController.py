import json
from fastapi import WebSocket, WebSocketDisconnect
from services.websockerService import WebSocketService, active_connections
from schema.webSocketSchema import WSMessage
from config.database import SessionLocal
from models.roomModel import Room
from core.stateStore import room_state

class WebSocketController:

    @staticmethod
    async def handle_connection(websocket: WebSocket, room_id: str):
        await websocket.accept()

        db = SessionLocal()
        room = db.query(Room).filter(Room.id == room_id).first()
        db.close()

        if not room:
            await websocket.send_text(
                WSMessage(event="error", error="Room not found").model_dump_json()
            )
            await websocket.close()
            return

        nickname = await websocket.receive_text()
        conn = {"socket": websocket, "nickname": nickname}
        WebSocketService.add_connection(room_id, websocket, nickname)

        room_state.setdefault(room_id, "")
        current_users = WebSocketService.get_room_users(room_id)

        # Notify others someone joined
        await WebSocketService.broadcast(
            room_id, WSMessage(event="join", user=nickname)
        )

        # Send existing code to new user
        await websocket.send_text(
            WSMessage(event="code_sync", code=room_state[room_id]).model_dump_json()
        )
        await websocket.send_text(
            WSMessage(event="users_sync", users=current_users).model_dump_json()
        )

        try:
            while True:
                msg = await websocket.receive_text()
                data = json.loads(msg)

                if data["event"] == "edit":
                    room_state[room_id] = data["code"]

                    await WebSocketService.broadcast(
                        room_id,
                        WSMessage(event="edit", user=nickname, code=data["code"]),
                    )

        except WebSocketDisconnect:
            WebSocketService.remove_connection(room_id, conn)
            await WebSocketService.broadcast(
                room_id, WSMessage(event="leave", user=nickname)
            )
