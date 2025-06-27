import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { socketService } from '@/lib/socket';

export default function Room() {
  const [roomCode, setRoomCode] = useState('');
  const [isHost] = useState(localStorage.getItem('isHost') === 'true');
  const [username] = useState(localStorage.getItem('username') || '');
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    socketService.connect().catch(console.error);

    socketService.on('roomUpdate', (data) => {
      if (data.roomCode) {
        setLocation(`/game/${data.roomCode}`);
      }
    });

    socketService.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      socketService.off('roomUpdate', () => {});
      socketService.off('error', () => {});
    };
  }, [setLocation]);

  const handleCreateRoom = () => {
    if (!username) {
      setError('Username is required');
      return;
    }

    socketService.send({
      type: 'joinRoom',
      data: { username, isHost: true }
    });
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!username) {
      setError('Username is required');
      return;
    }

    socketService.send({
      type: 'joinRoom',
      data: { roomCode: roomCode.trim().toUpperCase(), username, isHost: false }
    });
  };

  const handleBack = () => {
    setLocation('/username');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 md:p-12 max-w-md w-full text-center text-white shadow-2xl animate-scale-in">
        {isHost ? (
          <div>
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <i className="fas fa-crown text-2xl text-white"></i>
              </div>
              <h2 className="text-3xl font-bold mb-4">Ready to Host!</h2>
              <p className="text-gray-200">Click below to create your room</p>
            </div>
            
            <button 
              onClick={handleCreateRoom}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-play mr-2"></i>
              Create Room
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <i className="fas fa-users text-2xl text-white"></i>
              </div>
              <h2 className="text-3xl font-bold mb-4">Join a Room</h2>
              <p className="text-gray-200">Enter the 6-digit room code</p>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ABC123"
                  className="glass-input w-full py-4 px-6 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 text-center text-2xl font-mono tracking-widest uppercase"
                  maxLength={6}
                />
              </div>
              
              <button 
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Join Room
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}
        
        <button 
          onClick={handleBack}
          className="mt-6 text-gray-300 hover:text-white transition-colors duration-200"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
      </div>
    </div>
  );
}
