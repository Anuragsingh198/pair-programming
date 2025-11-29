import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setRoomId, setRoomName, setNickname, addUser } from '../store/slices/roomSlice';
import { roomService, RoomListItem } from '../services/api';
import './RoomSetup.css';

interface roomResponse {
  room_id: string;
  room_name: string;
  users: string[];
}

const RoomSetup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [roomName, setRoomNameLocal] = useState('');
  const [createNickname, setCreateNickname] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeRooms, setActiveRooms] = useState<RoomListItem[]>([]);
  const [copiedRoomIds, setCopiedRoomIds] = useState<Set<string>>(new Set());

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !createNickname.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const roomData: roomResponse = await roomService.createRoom(roomName.trim());
      setCreatedRoomId(roomData.room_id);
      dispatch(setRoomId(roomData.room_id));
      dispatch(setRoomName(roomData.room_name));
      dispatch(setNickname(createNickname.trim()));
      dispatch(addUser(createNickname.trim()));
      fetchActiveRooms(); // Refresh rooms list after creating
      setTimeout(() => {
        navigate(`/room/${roomData.room_id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Create room error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create room. Please check if the backend server is running.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim() || !joinNickname.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    dispatch(setRoomId(joinRoomId.trim()));
    dispatch(setRoomName(''));
    dispatch(setNickname(joinNickname.trim()));
    // dispatch(addUser(joinNickname.trim()));
    navigate(`/room/${joinRoomId.trim()}`);
  };

  const copyRoomId = async () => {
    if (createdRoomId) {
      try {
        await navigator.clipboard.writeText(createdRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const goToRoom = () => {
    if (createdRoomId) {
      navigate(`/room/${createdRoomId}`);
    }
  };

  const fetchActiveRooms = async () => {
    try {
      const response = await roomService.getAllRooms();
      setActiveRooms(response.rooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const copyRoomIdToClipboard = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomIds(new Set([...copiedRoomIds, roomId]));
      setTimeout(() => {
        setCopiedRoomIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(roomId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRoomClick = (roomId: string) => {
    setJoinRoomId(roomId);
  };

  useEffect(() => {
    fetchActiveRooms();
    // Refresh rooms list every 5 seconds
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="room-setup">
      <div className="room-setup-container">
        <h1 className="title">Pair Programming</h1>
        <p className="subtitle">Real-time collaborative code editor</p>

        <div className="setup-forms">
          <form onSubmit={handleCreateRoom} className="setup-form">
            <h2>Create New Room</h2>
            <div className="form-group">
              <label htmlFor="roomName">Room Name</label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomNameLocal(e.target.value)}
                placeholder="Enter room name"
                disabled={isCreating}
              />
            </div>
            <div className="form-group">
              <label htmlFor="nickname-create">Your Nickname</label>
              <input
                id="nickname-create"
                type="text"
                value={createNickname}
                onChange={(e) => setCreateNickname(e.target.value)}
                placeholder="Enter your nickname"
                disabled={isCreating}
              />
            </div>
            <button type="submit" disabled={isCreating} className="btn btn-primary">
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleJoinRoom} className="setup-form">
            <h2>Join Existing Room</h2>
            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                id="roomId"
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter room ID"
              />
            </div>
            <div className="form-group">
              <label htmlFor="nickname-join">Your Nickname</label>
              <input
                id="nickname-join"
                type="text"
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder="Enter your nickname"
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Join Room
            </button>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {createdRoomId && (
          <div className="success-message">
            <div className="success-header">
              <h3>✅ Room Created Successfully!</h3>
            </div>
            <div className="room-id-display">
              <label>Room ID:</label>
              <div className="room-id-container">
                <code className="room-id-text">{createdRoomId}</code>
                <button onClick={copyRoomId} className="copy-btn">
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="room-id-hint">Share this Room ID with others to collaborate</p>
            </div>
            <div className="success-actions">
              <button onClick={goToRoom} className="btn btn-primary">
                Go to Room →
              </button>
              <p className="auto-navigate-hint">Redirecting automatically in 2 seconds...</p>
            </div>
          </div>
        )}
      </div>

      {activeRooms.length > 0 && (
        <div className="active-rooms-section">
          <h3 className="active-rooms-title">Active Rooms</h3>
          <div className="active-rooms-list">
            {activeRooms.map((room) => (
              <div key={room.room_id} className="active-room-card">
                <div className="room-card-content">
                  <div className="room-card-name">{room.room_name}</div>
                  <div className="room-card-id">{room.room_id}</div>
                  <div className="room-card-users">{room.user_count} user{room.user_count !== 1 ? 's' : ''}</div>
                </div>
                <div className="room-card-actions">
                  <button
                    className="room-copy-btn"
                    onClick={() => copyRoomIdToClipboard(room.room_id)}
                    title="Copy Room ID"
                  >
                    {copiedRoomIds.has(room.room_id) ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    className="room-join-btn"
                    onClick={() => handleRoomClick(room.room_id)}
                    title="Use this Room ID"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomSetup;

