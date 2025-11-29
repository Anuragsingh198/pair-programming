import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RoomState {
  roomId: string | null;
  roomName: string;
  nickname: string;
  users: string[];
  isConnected: boolean;
  error: string | null;
}

const initialState: RoomState = {
  roomId: null,
  roomName: '',
  nickname: '',
  users: [],
  isConnected: false,
  error: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    setRoomName: (state, action: PayloadAction<string>) => {
      state.roomName = action.payload;
    },
    setNickname: (state, action: PayloadAction<string>) => {
      state.nickname = action.payload;
    },
    addUser: (state, action: PayloadAction<string>) => {
      if (!state.users.includes(action.payload)) {
        state.users.push(action.payload);
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user !== action.payload);
    },
    setUsers: (state, action: PayloadAction<string[]>) => {
      state.users = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetRoom: (state) => {
      state.roomId = null;
      state.roomName = '';
      state.users = [];
      state.isConnected = false;
      state.error = null;
    },
  },
});

export const {
  setRoomId,
  setRoomName,
  setNickname,
  addUser,
  removeUser,
  setUsers,
  setConnected,
  setError,
  resetRoom,
} = roomSlice.actions;

export default roomSlice.reducer;

