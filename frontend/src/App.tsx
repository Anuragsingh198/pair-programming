import { Routes, Route, Navigate } from 'react-router-dom';
import RoomSetup from './components/RoomSetup';
import CodeEditor from './components/CodeEditor';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<RoomSetup />} />
        <Route path="/room/:roomId" element={<CodeEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

