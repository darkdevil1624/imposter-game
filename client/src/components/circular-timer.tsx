interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
}

export function CircularTimer({ timeLeft, totalTime, size = 80 }: CircularTimerProps) {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference - (progress * circumference);
  
  const getColor = () => {
    if (timeLeft <= 10) return "#ef4444";
    if (timeLeft <= 30) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold font-mono text-white">{timeLeft}</span>
      </div>
    </div>
  );
}
