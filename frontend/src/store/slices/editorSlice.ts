import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EditorState {
  code: string;
  language: string;
  suggestions: string[];
  isLoadingSuggestions: boolean;
}

const initialState: EditorState = {
  code: '',
  language: 'python',
  suggestions: [],
  isLoadingSuggestions: false,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setSuggestions: (state, action: PayloadAction<string[]>) => {
      state.suggestions = action.payload;
    },
    setLoadingSuggestions: (state, action: PayloadAction<boolean>) => {
      state.isLoadingSuggestions = action.payload;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
  },
});

export const {
  setCode,
  setLanguage,
  setSuggestions,
  setLoadingSuggestions,
  clearSuggestions,
} = editorSlice.actions;

export default editorSlice.reducer;

