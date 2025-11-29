import { configureStore } from '@reduxjs/toolkit';
import roomReducer from './slices/roomSlice';
import editorReducer from './slices/editorSlice';

export const store = configureStore({
  reducer: {
    room: roomReducer,
    editor: editorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

