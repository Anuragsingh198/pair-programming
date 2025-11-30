# Real-Time Pair Programming Application - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Flow & Usage](#project-flow--usage)
3. [File Structure](#file-structure)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [Uploads Directory](#uploads-directory)

---

## Project Overview

This is a **Real-Time Collaborative Code Editor** that allows multiple users to code together in real-time.

- **Backend**: FastAPI REST API with WebSocket support
- **Frontend**: React + TypeScript with Monaco Editor

### Deployed Url

[Check the  deployed site here ](https://pair-programming-beta-blond.vercel.app/)

### Demo Video

[Watch Demo Video](https://drive.google.com/file/d/1zFe-kYJxBC-v1qSYVhAjxvj3GL3ATHaG/view?usp=drive_link)

*Click the link above to view the full application demo*

### Dashboard View

![Dashboard](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/dashboard.png)

*The initial dashboard where users can create or join rooms*

### Key Features

- Real-time code synchronization
- Room-based collaboration
- Autocomplete suggestions (rule-based)
- User presence tracking
- Monaco Editor integration

### Tech Stack

**Backend:** Python 3.13+, FastAPI, WebSockets, PostgreSQL, SQLAlchemy  
**Frontend:** React 18, TypeScript, Redux Toolkit, Monaco Editor, Vite

---

## Project Flow & Usage

### Step-by-Step User Flow

1. **Application Start**
   - User opens `http://localhost:3000`
   - Sees the Room Setup page with two options: Create Room or Join Room

2. **Creating a Room**
   ```
   User Input → Room Name + Nickname
   ↓
   POST /rooms API Call
   ↓
   Backend creates room in database
   ↓
   Returns room_id
   ↓
   User redirected to /room/{room_id}
   ↓
   WebSocket connection established
   ↓
   Code editor loads with sync
   ```

   ![Room Creation](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/roomCreation.png)
   
   *Room creation interface showing room name input and nickname field*

3. **Joining a Room**
   ```
   User Input → Room ID + Nickname
   ↓
   Navigate to /room/{room_id}
   ↓
   WebSocket connection established
   ↓
   Server validates room exists
   ↓
   User receives current code state
   ↓
   User list synchronized
   ```

   ![Second User Joining](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/SecondUserJoining.png)
   
   *Second user joining an existing room and receiving synchronized code*

4. **Real-Time Collaboration**
   ```
   User types code
   ↓
   Code change detected (onChange)
   ↓
   WebSocket sends 'edit' event
   ↓
   Server broadcasts to all users in room
   ↓
   Other users receive code update
   ↓
   Monaco Editor updates automatically
   ```

   ![Code Editor View](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/CodeEditorView.png)
   
   *Single user code editor view with Monaco Editor*
   
   ![Two Users Collaborating](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/CodeEditorWithTwoUser.png)
   
   *Real-time collaboration with two users editing simultaneously - both users see each other's changes instantly*

5. **Autocomplete Flow**
   ```
   User types code
   ↓
   600ms debounce timer starts
   ↓
   Extract last word before cursor
   ↓
   POST /autocomplete with query
   ↓
   Backend filters keywords
   ↓
   Suggestions displayed near cursor
   ↓
   User clicks suggestion
   ↓
   Code inserted at cursor position
   ```

   ![Autocomplete Suggestions](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/sugesstion.png)
   
   *Autocomplete suggestions appearing near the cursor position with keyword filtering*

---

## File Structure

```
tredence/
├── backend/
│   ├── config/database.py          # DB configuration
│   ├── controllers/                # HTTP/WebSocket handlers
│   │   ├── roomcontroller.py       # Room CRUD
│   │   ├── socketController.py    # WebSocket handling
│   │   └── autoSuggestionsController.py
│   ├── core/stateStore.py          # In-memory room state
│   ├── models/roomModel.py        # Database models
│   ├── routes/                     # API endpoints
│   ├── schema/                     # Pydantic schemas
│   ├── services/                   # Business logic
│   └── main.py                     # FastAPI entry point
└── frontend/
    ├── src/
    │   ├── components/             # React components
    │   ├── services/               # API & WebSocket
    │   ├── store/                  # Redux store & slices
    │   └── App.tsx                 # Main app
    └── package.json
```

---

## Backend Documentation

### Controllers Logic

#### 1. Room Controller (`roomcontroller.py`)

**Purpose**: Handles room operations (create, list)

**`create_room_controller`**:
- Calls service layer `create_room()`
- Handles JSON/list format for users field
- Returns `RoomSchemaResponse` with room_id, name, users
- **Why**: Service layer separation, flexible data handling, proper error responses

**`get_all_rooms_controller`**:
- Fetches all rooms via service
- Transforms to API response format
- Calculates user count per room
- **Why**: Clean separation, useful metadata for UI

#### 2. Socket Controller (`socketController.py`)

**Purpose**: Manages WebSocket connections and real-time sync

**`handle_connection` Flow**:
```python
1. await websocket.accept()              # Accept connection
2. Validate room exists in DB            # Security check
3. Receive nickname (first message)      # User identification
4. Add to active_connections              # Track users
5. Initialize room_state[room_id] = ""   # Prevent KeyError
6. Broadcast "join" event                # Notify others
7. Send "code_sync" to new user          # Current code state
8. Send "users_sync" to new user         # User list
9. Enter message loop                    # Handle edits
   - On "edit": Update state & broadcast
10. On disconnect: Cleanup & notify      # Resource management
```

**Why each step**:
- **Accept**: Required WebSocket handshake
- **Validate**: Prevents invalid room access
- **Nickname**: Simple user identification
- **State init**: Prevents errors on first edit
- **Broadcast join**: Real-time presence awareness
- **Code sync**: Ensures consistency for new users
- **Edit handling**: Real-time collaboration
- **Cleanup**: Proper resource management

#### 3. Autocomplete Controller

**Purpose**: Handles autocomplete requests
- Delegates to service layer
- Returns filtered suggestions
- **Why**: Separation of concerns, simple error handling

### WebSocket Implementation

#### Complete Connection Flow

**Client-Side (Frontend)**:
```typescript
connect(roomId, nickname) {
  const ws = new WebSocket(`${wsBaseUrl}/ws/${roomId}`);
  
  ws.onopen = () => {
    store.dispatch(setConnected(true));
    ws.send(nickname);  // First message = nickname
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch(data.event) {
      case 'join': dispatch(addUser(data.user)); break;
      case 'leave': dispatch(removeUser(data.user)); break;
      case 'users_sync': dispatch(setUsers(data.users)); break;
      case 'code_sync': dispatch(setCode(data.code)); break;
      case 'edit': 
        if (data.user !== nickname) dispatch(setCode(data.code));
        break;
    }
  };
}
```

**Server-Side (Backend)**:
```python
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        await websocket.close(code=1008, reason="Room not found")
        return
    
    nickname = await websocket.receive_text()
    WebSocketService.add_connection(room_id, websocket, nickname)
    
    # Sync new user
    await WebSocketService.broadcast(room_id, WSMessage(event="join", user=nickname))
    await websocket.send_text(WSMessage(event="code_sync", code=room_state[room_id]).model_dump_json())
    await websocket.send_text(WSMessage(event="users_sync", users=get_room_users(room_id)).model_dump_json())
    
    # Message loop
    while True:
        msg = await websocket.receive_text()
        data = json.loads(msg)
        if data["event"] == "edit":
            room_state[room_id] = data["code"]
            await WebSocketService.broadcast(room_id, WSMessage(event="edit", user=nickname, code=data["code"]))
```

**WebSocket Service**:
```python
class WebSocketService:
    @staticmethod
    async def broadcast(room_id: str, message: WSMessage):
        """Broadcast to all users in room, cleanup dead connections"""
        for conn in active_connections.get(room_id, []):
            if conn["socket"].client_state == WebSocketState.CONNECTED:
                await conn["socket"].send_text(message.model_dump_json())
    
    @staticmethod
    def add_connection(room_id: str, socket, nickname: str):
        """Add connection and update database"""
        active_connections.setdefault(room_id, []).append({"socket": socket, "nickname": nickname})
        # Update room.users in database
```

**Why WebSocket**:
- **Low Latency**: Full-duplex, instant updates
- **Persistent**: No polling overhead
- **Bidirectional**: Server can push without request
- **Efficient**: Minimal overhead after handshake

**Message Types**: `join`, `leave`, `code_sync`, `users_sync`, `edit`, `error`

---

## Frontend Documentation

### UI Screenshots

**Code Editor Interface:**
![Code Editor](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/CodeEditorView.png)

**Multi-User Collaboration:**
![Two Users](https://raw.githubusercontent.com/Anuragsingh198/pair-programming/main/backend/documents/CodeEditorWithTwoUser.png)

### Redux Setup

**Store Configuration**:
```typescript
export const store = configureStore({
  reducer: {
    room: roomReducer,      // Room state (users, connection, room info)
    editor: editorReducer,   // Editor state (code, language, suggestions)
  },
});
```

**Why Redux Toolkit**: Centralized state, time-travel debugging, middleware support, TypeScript safety

**Room Slice State**:
```typescript
interface RoomState {
  roomId: string | null;
  roomName: string;
  nickname: string;
  users: string[];
  isConnected: boolean;
  error: string | null;
}
```

**Actions**: `setRoomId`, `setRoomName`, `setNickname`, `addUser`, `removeUser`, `setUsers`, `setConnected`, `setError`, `resetRoom`

**Editor Slice State**:
```typescript
interface EditorState {
  code: string;
  language: string;
  suggestions: string[];
  isLoadingSuggestions: boolean;
}
```

**Actions**: `setCode`, `setLanguage`, `setSuggestions`, `setLoadingSuggestions`, `clearSuggestions`

**Why this structure**: Separation of concerns, immutable updates (Immer), type safety

### WebSocket Integration (Frontend)

**WebSocket Service Class**:
```typescript
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  
  connect(roomId: string, nickname: string) {
    // Prevent duplicate connections
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(`${wsBaseUrl}/ws/${roomId}`);
    
    this.ws.onopen = () => {
      store.dispatch(setConnected(true));
      this.ws?.send(nickname);
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle events: join, leave, code_sync, users_sync, edit
    };
    
    this.ws.onclose = () => {
      store.dispatch(setConnected(false));
      this.attemptReconnect();  // Auto-reconnect up to 5 times
    };
  }
  
  sendCodeUpdate(code: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event: 'edit', code }));
    }
  }
}
```

**Usage in Components**:
```typescript
useEffect(() => {
  if (roomId && nickname) {
    wsService.connect(roomId, nickname);
  }
  return () => wsService.disconnect();  
}, [roomId, nickname]);

const handleCodeChange = (value: string) => {
  dispatch(setCode(value));
  if (isConnected) wsService.sendCodeUpdate(value);
};
```

**Why this implementation**:
- **Singleton**: Single WebSocket instance (prevents duplicates)
- **Reconnection**: Auto-reconnect on disconnect (resilience)
- **State Integration**: Updates Redux on events (reactive UI)
- **Lifecycle Management**: Connect/disconnect on mount/unmount

---
## Summary

**Project Overview**: Real-time collaborative code editor  
**Complete Flow**: Step-by-step user journey  
**File Structure**: Directory tree with explanations  
**Controller Logic**: Each controller explained  
**WebSocket Flow**: Complete connection flow with code  
**Frontend Redux**: State management setup  
**WebSocket Integration**: Frontend WebSocket implementation  
