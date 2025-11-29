import { store } from '../store/store';
import {
  setConnected,
  setError,
  addUser,
  removeUser,
  setUsers,
} from '../store/slices/roomSlice';
import {
  setCode,
} from '../store/slices/editorSlice';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private nickname: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(roomId: string, nickname: string) {
    const isSameSession =
      this.ws &&
      this.roomId === roomId &&
      this.nickname === nickname &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING);

    if (isSameSession) {
      console.log('WebSocket already connected, skipping new connection');
      return;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.roomId !== roomId) {
      store.dispatch(setUsers([]));
    }

    this.roomId = roomId;
    this.nickname = nickname;
    let wsBaseUrl = import.meta.env.VITE_WS_BASE_URL;
    
    if (!wsBaseUrl) {
      // Fallback: construct from current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBaseUrl = `${protocol}//${window.location.hostname}:8000`;
    }
    
    const wsUrl = `${wsBaseUrl}/ws/${roomId}`;
    
    console.log(`Attempting to connect to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        store.dispatch(setConnected(true));
        if (this.ws && this.nickname) {
          this.ws.send(this.nickname);
          // Don't add self here - wait for users_sync from server
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.event) {
            case 'join':
              store.dispatch(addUser(data.user));
              break;
            case 'leave':
              store.dispatch(removeUser(data.user));
              break;
            case 'users_sync':
              if (data.users && Array.isArray(data.users)) {
                store.dispatch(setUsers(data.users));
              }
              break;
            case 'code_sync':
              store.dispatch(setCode(data.code || ''));
              break;
            case 'edit':
              if (data.user !== this.nickname) {
                store.dispatch(setCode(data.code || ''));
              }
              break;
            case 'error':
              store.dispatch(setError(data.error || 'Unknown error'));
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL:', wsUrl);
        console.error('WebSocket readyState:', this.ws?.readyState);
        store.dispatch(setError(`WebSocket connection error: ${error.type || 'Unknown error'}`));
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        store.dispatch(setConnected(false));
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      store.dispatch(setError('Failed to connect to WebSocket'));
    }
  }

  sendCodeUpdate(code: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: 'edit',
          code,
        })
      );
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
    this.nickname = null;
    store.dispatch(setConnected(false));
    store.dispatch(setUsers([]));
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId && this.nickname) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
        this.connect(this.roomId!, this.nickname!);
      }, this.reconnectDelay);
    }
  }
}

export const wsService = new WebSocketService();