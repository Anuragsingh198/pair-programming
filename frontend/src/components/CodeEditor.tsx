import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCode, setSuggestions, setLoadingSuggestions } from '../store/slices/editorSlice';
import { setRoomId } from '../store/slices/roomSlice';
import { wsService } from '../services/websocket';
import { autocompleteService } from '../services/api';
import './CodeEditor.css';

const CodeEditor = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const { code, language, suggestions } = useAppSelector((state) => state.editor);
  const { roomId, nickname, users, isConnected } = useAppSelector((state) => state.room);
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorPositionRef = useRef<number>(0);
  const [suggestionPosition, setSuggestionPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (urlRoomId && urlRoomId !== roomId) {
      dispatch(setRoomId(urlRoomId));
    }
  }, [urlRoomId, roomId, dispatch]);

  useEffect(() => {
    if (roomId && !nickname) {
      navigate('/');
    }
  }, [roomId, nickname, navigate]);

  useEffect(() => {
    if (roomId && nickname) {
      wsService.connect(roomId, nickname);
    }
  }, [roomId, nickname]);

  useEffect(() => {
    return () => {
      wsService.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition(() => {
      if (suggestions.length > 0) {
        const position = editor.getPosition();
        if (position) {
          const editorContainer = editor.getContainerDomNode();
          const editorRect = editorContainer.getBoundingClientRect();
          const positionCoords = editor.getScrolledVisiblePosition(position);
          
          if (positionCoords) {
            const top = editorRect.top + positionCoords.top + 20;
            const left = editorRect.left + positionCoords.left;
            setSuggestionPosition({ top, left });
          }
        }
      }
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    dispatch(setCode(newCode));

    if (roomId && isConnected) {
      wsService.sendCodeUpdate(newCode);
    }

    // Debounce autocomplete requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (editorRef.current) {
        const position = editorRef.current.getPosition();
        lastCursorPositionRef.current = position?.column || 0;
        const model = editorRef.current.getModel();
        const lineNumber = position?.lineNumber || 1;
        const lineText = model.getLineContent(lineNumber);
        const textBeforeCursor = lineText.substring(0, (position?.column || 1) - 1);
        

        const words = textBeforeCursor.trim().split(/\s+/);
        const lastWord = words[words.length - 1] || '';
        
        if (lastWord.length > 0) {
          const editor = editorRef.current;
          const editorContainer = editor.getContainerDomNode();
          const editorRect = editorContainer.getBoundingClientRect();
          const positionCoords = editor.getScrolledVisiblePosition(position);
          
          if (positionCoords) {
            const top = editorRect.top + positionCoords.top + 20;
            const left = editorRect.left + positionCoords.left;
            setSuggestionPosition({ top, left });
          }
          
          dispatch(setLoadingSuggestions(true));
          try {
            const autocompleteSuggestions = await autocompleteService.getSuggestions(lastWord);
            dispatch(setSuggestions(autocompleteSuggestions));
          } catch (error) {
            console.error('Autocomplete error:', error);
            dispatch(setSuggestions([]));
          } finally {
            dispatch(setLoadingSuggestions(false));
          }
        } else {
          dispatch(setSuggestions([]));
          setSuggestionPosition(null);
        }
      }
    }, 600);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      const model = editorRef.current.getModel();
      const lineNumber = position?.lineNumber || 1;
      const lineText = model.getLineContent(lineNumber);
      const column = position?.column || 1;
      
      const textBeforeCursor = lineText.substring(0, column - 1);
      const wordMatch = textBeforeCursor.match(/\w+$/);
      const wordStart = wordMatch ? column - wordMatch[0].length - 1 : column - 1;
      
      const range = {
        startLineNumber: lineNumber,
        startColumn: wordStart + 1,
        endLineNumber: lineNumber,
        endColumn: column,
      };
      
      editorRef.current.executeEdits('autocomplete', [
        {
          range,
          text: suggestion,
        },
      ]);
      
      editorRef.current.setPosition({
        lineNumber,
        column: wordStart + suggestion.length + 1,
      });
      
      dispatch(setSuggestions([]));
      setSuggestionPosition(null);
    }
  };

  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="header-left">
          <h2>Code Editor</h2>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="header-right">
          <div className="users-list">
            <span className="users-label">Users ({users?.length || 0}):</span>
            <div className="users">
              {users?.map((user, index) => (
                <span key={index} className="user-badge">
                  {user}
                </span>
              ))}
            </div>
          </div>
          <div className="room-info">
            Room: <span className="room-id">{roomId}</span>
          </div>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="calc(100vh - 120px)"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
      </div>

      {suggestions?.length > 0 && suggestionPosition && (
        <div 
          className="autocomplete-suggestions"
          style={{
            top: `${suggestionPosition.top}px`,
            left: `${suggestionPosition.left}px`,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;

