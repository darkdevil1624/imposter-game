import { useState } from 'react';
import { useLocation } from 'wouter';

export default function Username() {
  const [username, setUsername] = useState('');
  const [, setLocation] = useLocation();

  const generateRandomUsername = () => {
    const adjectives = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Silver', 'Golden'];
    const animals = ['Fox', 'Tiger', 'Bear', 'Lion', 'Wolf', 'Eagle', 'Shark'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${adjective}${animal}${number}`;
  };

  const handleContinue = () => {
    const finalUsername = username.trim() || generateRandomUsername();
    localStorage.setItem('username', finalUsername);
    setLocation('/room');
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleGenerateRandom = () => {
    setUsername(generateRandomUsername());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 md:p-12 max-w-md w-full text-center text-white shadow-2xl animate-scale-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Choose Your Identity</h2>
          <p className="text-gray-200">Enter your username to continue</p>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="glass-input w-full py-4 px-6 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
              maxLength={20}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <i className="fas fa-user text-gray-400"></i>
            </div>
          </div>
          
          <button 
            onClick={handleGenerateRandom}
            className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
          >
            <i className="fas fa-dice mr-2"></i>
            Generate random username
          </button>
          
          <button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Continue
          </button>
        </div>
        
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
