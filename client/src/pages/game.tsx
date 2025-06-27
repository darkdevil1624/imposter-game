import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { socketService } from '@/lib/socket';
import { CircularTimer } from '@/components/circular-timer';
import { PlayerAvatar } from '@/components/player-avatar';
import { Chat } from '@/components/chat';
import type { Player, Message, GameSettings } from '@shared/schema';

export default function Game() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [, setLocation] = useLocation();
  const username = localStorage.getItem('username') || '';
  
  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'question' | 'voting' | 'results' | 'finished'>('lobby');
  const [currentRound, setCurrentRound] = useState(1);
  const [question, setQuestion] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<any[]>([]);
  const [imposter, setImposter] = useState('');
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  
  // User interactions
  const [answer, setAnswer] = useState('');
  const [selectedVote, setSelectedVote] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    answerTime: 60,
    voteTime: 60,
    totalRounds: 5,
  });

  const isHost = players.find(p => p.username === username)?.isHost || false;

  useEffect(() => {
    if (!roomCode || !username) {
      setLocation('/');
      return;
    }

    socketService.connect().then(() => {
      socketService.send({
        type: 'joinRoom',
        data: { roomCode, username, isHost: false }
      });
    });

    socketService.on('roomUpdate', (data) => {
      if (data.players) setPlayers(data.players);
      if (data.messages) setMessages(data.messages);
      if (data.room) {
        const roomSettings = JSON.parse(data.room.settings);
        setSettings(roomSettings);
        setCurrentRound(data.room.currentRound);
      }
    });

    socketService.on('gameStateUpdate', (data) => {
      setGamePhase(data.phase);
      if (data.question) setQuestion(data.question);
      if (data.timeLeft) setTimeLeft(data.timeLeft);
      if (data.answers) setAnswers(data.answers);
      if (data.imposter) setImposter(data.imposter);
      if (data.voteCounts) setVoteCounts(data.voteCounts);
      if (data.currentRound) setCurrentRound(data.currentRound);
      if (data.players) setPlayers(data.players);
      setHasSubmitted(false);
    });

    socketService.on('error', (data) => {
      console.error(data.message);
    });

    return () => {
      socketService.disconnect();
    };
  }, [roomCode, username, setLocation]);

  // Timer countdown
  useEffect(() => {
    if ((gamePhase === 'question' || gamePhase === 'voting') && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, timeLeft]);

  const handleStartGame = () => {
    if (players.length < 3) {
      alert('At least 3 players required');
      return;
    }
    socketService.send({ type: 'startGame' });
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim() || hasSubmitted) return;
    
    socketService.send({
      type: 'sendAnswer',
      data: { answer: answer.trim() }
    });
    
    setHasSubmitted(true);
    setAnswer('');
  };

  const handleSubmitVote = () => {
    if (!selectedVote || hasSubmitted) return;
    
    socketService.send({
      type: 'sendVote',
      data: { votedFor: selectedVote }
    });
    
    setHasSubmitted(true);
    setSelectedVote('');
  };

  const handleSendMessage = (content: string) => {
    socketService.send({
      type: 'sendMessage',
      data: { content }
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode!);
  };

  // Render lobby
  if (gamePhase === 'lobby') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="glass-card rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Game Lobby</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span>Room: <span className="font-mono font-bold">{roomCode}</span></span>
                  <span>•</span>
                  <span>{players.length} players joined</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={copyRoomCode} className="glass-card p-3 rounded-xl hover:bg-white/20 transition-colors duration-200">
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Players List */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <i className="fas fa-users mr-3"></i>
                  Players
                </h3>
                
                <div className="space-y-3">
                  {players.map((player) => (
                    <div key={player.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <PlayerAvatar 
                          username={player.username} 
                          isHost={player.isHost}
                          isOnline={player.isConnected}
                        />
                        <div>
                          <div className="font-semibold">{player.username}</div>
                          <div className="text-xs text-gray-400">
                            {player.isConnected ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isHost && (
                          <span className="glass-card px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            <i className="fas fa-crown mr-1"></i>Host
                          </span>
                        )}
                        <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {players.length < 3 && (
                  <div className="mt-6 p-4 rounded-2xl border-2 border-dashed border-white/30 text-center text-gray-400">
                    <i className="fas fa-user-plus text-2xl mb-2"></i>
                    <p>Waiting for more players...</p>
                    <p className="text-sm">Minimum 3 players required</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div>
              <Chat 
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>

          {/* Start Game Button */}
          {isHost && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleStartGame}
                disabled={players.length < 3}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-play mr-2"></i>
                Start Game
              </button>
              <p className="text-gray-300 text-sm mt-2">Minimum 3 players required to start</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render question phase
  if (gamePhase === 'question') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Game Header */}
          <div className="glass-card rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center space-x-4 mb-2">
                  <h2 className="text-2xl font-bold">Round {currentRound}</h2>
                  <span className="glass-card px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
                    Question Phase
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  Answer the question below
                </div>
              </div>
              
              <CircularTimer timeLeft={timeLeft} totalTime={settings.answerTime} />
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center text-white shadow-xl mb-6">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <i className="fas fa-question text-2xl text-white"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">{question}</h3>
              <p className="text-gray-300">Think carefully and submit your answer</p>
            </div>

            {/* Answer Input */}
            <div className="max-w-md mx-auto space-y-6">
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="glass-input w-full py-4 px-6 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 resize-none h-24"
                  disabled={hasSubmitted}
                />
              </div>
              
              <button 
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || hasSubmitted}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                {hasSubmitted ? 'Answer Submitted' : 'Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render voting phase
  if (gamePhase === 'voting') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Game Header */}
          <div className="glass-card rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center space-x-4 mb-2">
                  <h2 className="text-2xl font-bold">Round {currentRound}</h2>
                  <span className="glass-card px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400">
                    Voting Phase
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  Who do you think is the imposter?
                </div>
              </div>
              
              <CircularTimer timeLeft={timeLeft} totalTime={settings.voteTime} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Answers Display */}
            <div className="glass-card rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-list mr-3"></i>
                Anonymous Answers
              </h3>
              <p className="text-sm text-gray-300 mb-6">Question: <span className="font-semibold">{question}</span></p>
              
              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <div key={index} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-xs">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-200">{answer.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voting Interface */}
            <div className="glass-card rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-vote-yea mr-3"></i>
                Cast Your Vote
              </h3>
              <p className="text-sm text-gray-300 mb-6">Select the player you think is the imposter</p>
              
              <div className="space-y-3 mb-6">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedVote(player.username)}
                    disabled={hasSubmitted}
                    className={`w-full glass-card rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/20 transition-all duration-200 border-2 ${
                      selectedVote === player.username 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-transparent hover:border-white/30'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <PlayerAvatar username={player.username} />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{player.username}</div>
                      <div className={`text-xs ${
                        selectedVote === player.username ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {selectedVote === player.username ? 'Selected' : 'Click to vote'}
                      </div>
                    </div>
                    {selectedVote === player.username && (
                      <div>
                        <i className="fas fa-check-circle text-green-500 text-xl"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={handleSubmitVote}
                disabled={!selectedVote || hasSubmitted}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-gavel mr-2"></i>
                {hasSubmitted ? 'Vote Submitted' : 'Submit Vote'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render results phase
  if (gamePhase === 'results') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="glass-card rounded-3xl p-8 mb-6 text-center text-white shadow-xl">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg animate-pulse-slow">
                <i className="fas fa-trophy text-3xl text-white"></i>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Round {currentRound} Results</h2>
              <p className="text-xl text-gray-200">The imposter was revealed!</p>
            </div>
            
            {/* Imposter Reveal */}
            <div className="glass-card rounded-2xl p-6 mb-6 bg-red-500/20 border border-red-500/30">
              <div className="flex items-center justify-center space-x-4">
                <PlayerAvatar username={imposter} size={64} />
                <div className="text-left">
                  <div className="text-2xl font-bold">{imposter}</div>
                  <div className="text-red-400 font-semibold">
                    <i className="fas fa-mask mr-2"></i>
                    Was the Imposter!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Updated Leaderboard */}
          <div className="glass-card rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-2xl font-semibold mb-6 text-center">Current Standings</h3>
            
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className={`glass-card rounded-2xl p-6 flex items-center space-x-4 ${
                  index === 0 ? 'border border-yellow-500/30' : ''
                }`}>
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                      'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <PlayerAvatar username={player.username} size={64} />
                  <div className="flex-1">
                    <div className="text-xl font-bold">{player.username}</div>
                    <div className="text-gray-400">
                      {player.username === imposter ? 'The Imposter' : 'Detective'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {player.score}
                    </div>
                    <div className="text-sm text-gray-400">points</div>
                  </div>
                  {index === 0 && (
                    <div className="text-yellow-400">
                      <i className="fas fa-crown text-2xl"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render final leaderboard
  if (gamePhase === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Leaderboard Header */}
          <div className="glass-card rounded-3xl p-8 mb-6 text-center text-white shadow-xl">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse-slow">
              <i className="fas fa-crown text-4xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Final Results</h1>
            <p className="text-xl text-gray-200">Game completed after {settings.totalRounds} rounds</p>
          </div>

          {/* Winner Spotlight */}
          {winner && (
            <div className="glass-card rounded-3xl p-8 mb-6 text-center text-white shadow-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <div className="mb-6">
                <PlayerAvatar username={winner.username} size={80} className="mx-auto mb-4 animate-float" />
                <h2 className="text-3xl font-bold mb-2">{winner.username}</h2>
                <div className="text-yellow-400 font-semibold text-lg">
                  <i className="fas fa-trophy mr-2"></i>
                  Champion!
                </div>
              </div>
              <div className="text-2xl font-bold">{winner.score} points</div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="glass-card rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-2xl font-semibold mb-6 text-center">Final Standings</h3>
            
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className={`glass-card rounded-2xl p-6 flex items-center space-x-4 ${
                  index === 0 ? 'border border-yellow-500/30' : ''
                }`}>
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                      'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <PlayerAvatar username={player.username} size={64} />
                  <div className="flex-1">
                    <div className="text-xl font-bold">{player.username}</div>
                    <div className="text-gray-400">
                      {index === 0 ? 'Master Detective' : 
                       index === 1 ? 'Good Detective' : 
                       index === 2 ? 'Detective' : 'Player'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {player.score}
                    </div>
                    <div className="text-sm text-gray-400">points</div>
                  </div>
                  {index === 0 && (
                    <div className="text-yellow-400">
                      <i className="fas fa-crown text-2xl"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center space-x-4">
            <button 
              onClick={() => setLocation('/')}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-home mr-2"></i>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}
