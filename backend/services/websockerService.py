import json
from starlette.websockets import WebSocketState
from schema.webSocketSchema import WSMessage
from core.stateStore import room_state
from models.roomModel import Room
from config.database import SessionLocal
active_connections: dict[str, list] = {}

class WebSocketService:

    @staticmethod
    async def broadcast(room_id: str, message: WSMessage):
        if room_id not in active_connections:
            return

        alive_connections = []
        for conn in active_connections[room_id]:
            socket = conn["socket"]
            try:
                if socket.client_state == WebSocketState.CONNECTED:
                    await socket.send_text(message.model_dump_json())
                    alive_connections.append(conn)
            except Exception:
                continue
        
        if alive_connections:
            active_connections[room_id] = alive_connections
        else:
            active_connections.pop(room_id, None)

    @staticmethod
    def add_connection(room_id: str, socket, nickname: str):
        active_connections.setdefault(room_id, []).append({"socket": socket, "nickname": nickname})
        db = SessionLocal()
        try:
            room = db.query(Room).filter(Room.id == room_id).first()
            if room:
                users = room.users if isinstance(room.users, list) else (json.loads(room.users) if isinstance(room.users, str) else [])
                if nickname not in users:
                    users.append(nickname)
                room.users = users
                db.commit()
                db.refresh(room)
        except Exception as e:
            db.rollback()
            print(f"Error updating room users in database: {e}")
        finally:
            db.close()

    @staticmethod
    def remove_connection(room_id: str, conn):
        if conn in active_connections.get(room_id, []):
            active_connections[room_id].remove(conn)
        if not active_connections.get(room_id):
            active_connections.pop(room_id, None)

    @staticmethod
    def get_room_users(room_id: str) -> list[str]:
        """Get list of all user nicknames currently in the room"""
        if room_id not in active_connections:
            return []
        return [conn["nickname"] for conn in active_connections[room_id]]
