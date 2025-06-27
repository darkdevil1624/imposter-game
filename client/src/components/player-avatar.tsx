interface PlayerAvatarProps {
  username: string;
  size?: number;
  isHost?: boolean;
  isOnline?: boolean;
  className?: string;
}

export function PlayerAvatar({ 
  username, 
  size = 40, 
  isHost = false, 
  isOnline = true,
  className = "" 
}: PlayerAvatarProps) {
  const initial = username.charAt(0).toUpperCase();
  
  const getGradient = () => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600", 
      "from-red-500 to-pink-600",
      "from-yellow-500 to-orange-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-rose-600",
    ];
    
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white font-semibold shadow-lg`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
      
      {/* Online indicator */}
      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      
      {/* Host crown */}
      {isHost && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <i className="fas fa-crown text-white text-xs" />
        </div>
      )}
    </div>
  );
}
