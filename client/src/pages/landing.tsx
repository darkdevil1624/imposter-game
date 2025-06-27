import { useLocation } from 'wouter';

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleHost = () => {
    localStorage.setItem('isHost', 'true');
    setLocation('/username');
  };

  const handleJoin = () => {
    localStorage.setItem('isHost', 'false');
    setLocation('/username');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 md:p-12 max-w-md w-full text-center text-white shadow-2xl animate-slide-up">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-xl animate-float">
            <i className="fas fa-mask text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Imposter Game
          </h1>
          <p className="text-gray-200 text-lg">Find the imposter among your friends!</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={handleHost}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <i className="fas fa-crown mr-2"></i>
            Host a Room
          </button>
          <button 
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <i className="fas fa-users mr-2"></i>
            Join a Room
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock"></i>
              <span>Quick rounds</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-comments"></i>
              <span>Real-time chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-trophy"></i>
              <span>Leaderboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
