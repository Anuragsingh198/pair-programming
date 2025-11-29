import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateRoomResponse {
  room_id: string;
  room_name: string;
  users: string[];
}

export interface RoomListItem {
  room_id: string;
  room_name: string;
  user_count: number;
}

export interface RoomsListResponse {
  rooms: RoomListItem[];
}

export interface AutocompleteResponse {
  suggestions: string[];
}

export const roomService = {
  createRoom: async (roomName: string): Promise<CreateRoomResponse> => {
    const response = await api.post<CreateRoomResponse>('/rooms', {
      room_name: roomName,
    });
    return response.data;
  },
  getAllRooms: async (): Promise<RoomsListResponse> => {
    const response = await api.get<RoomsListResponse>('/rooms');
    return response.data;
  },
};

export const autocompleteService = {
  getSuggestions: async (query: string): Promise<string[]> => {
    const response = await api.post<AutocompleteResponse>('/autocomplete', {
      query: query,
    });
    return response.data.suggestions;
  },
};

