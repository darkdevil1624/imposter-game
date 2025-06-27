// ✅ Enhanced Game.jsx with new floating tile UI design
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Game.css"; // Import the new CSS file

const QUESTIONS = [
  "What is your favorite food?",
  "What is your favorite sport?",
  "Where do you want to travel next?",
  "What is your favorite movie genre?",
  "What is your favorite season?",
];

const FUN_NAMES = [
  "BlueFox",
  "RedTiger",
  "GreenWolf",
  "YellowEagle",
  "SilverShark",
  "GoldenBear",
  "PurpleHawk",
  "CrimsonLion",
];

function getImposterQuestion(q) {
  switch (q) {
    case "What is your favorite food?":
      return "What is your least favorite food?";
    case "What is your favorite sport?":
      return "What sport do you dislike?";
    case "Where do you want to travel next?":
      return "Where would you never want to travel?";
    case "What is your favorite movie genre?":
      return "What movie genre do you hate?";
    case "What is your favorite season?":
      return "What season do you dislike?";
    default:
      return q;
  }
}

function generateFallbackName(existingPlayers) {
  for (let i = 0; i < FUN_NAMES.length; i++) {
    const name = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    if (!existingPlayers.includes(name)) return name;
  }
  let idx = 1;
  while (existingPlayers.includes(`Player${idx}`)) idx++;
  return `Player${idx}`;
}

// Circular Timer Component
function CircularTimer({ timeLeft, totalTime, size = 60 }) {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="circular-timer" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={timeLeft <= 10 ? "#f44336" : "#4caf50"}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="timer-text">
        {timeLeft}
      </div>
    </div>
  );
}

export default function Game() {
  const { roomCode } = useParams();

  const [players, setPlayers] = useState(() => {
    return JSON.parse(localStorage.getItem(`room_${roomCode}_players`) || "[]");
  });
  const [host, setHost] = useState(() => localStorage.getItem(`room_${roomCode}_host`));
  const [gameStarted, setGameStarted] = useState(() => localStorage.getItem(`room_${roomCode}_started`) === "true");
  const [currentRound, setCurrentRound] = useState(() => parseInt(localStorage.getItem(`room_${roomCode}_currentRound`) || "1"));
  const [question, setQuestion] = useState(() => localStorage.getItem(`room_${roomCode}_question`) || "");
  const [imposter, setImposter] = useState(() => localStorage.getItem(`room_${roomCode}_imposter`) || null);
  const [timer, setTimer] = useState(() => parseInt(localStorage.getItem(`room_${roomCode}_timer`) || "60"));
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem(`room_${roomCode}_answers`) || "[]"));
  const [phase, setPhase] = useState(() => localStorage.getItem(`room_${roomCode}_phase`) || "waiting");
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(`room_${roomCode}_messages`) || "[]"));
  const [votes, setVotes] = useState(() => JSON.parse(localStorage.getItem(`room_${roomCode}_votes`) || "[]"));
  const [scores, setScores] = useState(() => JSON.parse(localStorage.getItem(`room_${roomCode}_scores`) || "{}"));

  const [usernameInput, setUsernameInput] = useState(() => localStorage.getItem("username") || "");
  const [nameError, setNameError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [selectedVote, setSelectedVote] = useState("");

  const [settings, setSettings] = useState(() => {
    return JSON.parse(localStorage.getItem(`room_${roomCode}_settings`) || JSON.stringify({
      answerTime: 60,
      voteTime: 60,
      totalRounds: 5,
    }));
  });

  const [showLeaderboard, setShowLeaderboard] = useState(() => localStorage.getItem(`room_${roomCode}_showLeaderboard`) === "true");
  const [gameCompleted, setGameCompleted] = useState(() => localStorage.getItem(`room_${roomCode}_gameCompleted`) === "true");
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  const timeOptions = [15, 30, 60, 120];
  const roundOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize players list when component mounts
  useEffect(() => {
    if (usernameInput && !players.includes(usernameInput)) {
      const updatedPlayers = [...players, usernameInput];
      setPlayers(updatedPlayers);
      localStorage.setItem(`room_${roomCode}_players`, JSON.stringify(updatedPlayers));
      
      if (!host) {
        setHost(usernameInput);
        localStorage.setItem(`room_${roomCode}_host`, usernameInput);
      }
    }
  }, [usernameInput, roomCode]);

  useEffect(() => {
    window.onbeforeunload = () => "Are you sure you want to leave?";
    return () => (window.onbeforeunload = null);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      if ((phase === "question" || phase === "voting") && timer > 0) {
        const newTimer = timer - 1;
        setTimer(newTimer);
        localStorage.setItem(`room_${roomCode}_timer`, String(newTimer));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timer, roomCode]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (phase === "question" && timer === 0 && !answerSubmitted) {
      handleSubmitAnswer(true, "any");
    }
    if (phase === "voting" && timer === 0 && !voteSubmitted) {
      handleVoteSubmit(true);
    }
  }, [timer, phase]);

  function addMessage(text, isSystemMessage = true) {
    setMessages((prev) => {
      const updated = [...prev, { text, isSystem: isSystemMessage, timestamp: Date.now() }];
      localStorage.setItem(`room_${roomCode}_messages`, JSON.stringify(updated));
      return updated;
    });
  }

  function addChatMessage(text) {
    addMessage(`${usernameInput}: ${text}`, false);
  }

  // Storage sync across tabs
  useEffect(() => {
    function handleStorageEvent(e) {
      if (!e.key) return;
      if (e.key === `room_${roomCode}_players`) setPlayers(JSON.parse(e.newValue || "[]"));
      if (e.key === `room_${roomCode}_host`) setHost(e.newValue);
      if (e.key === `room_${roomCode}_started`) setGameStarted(e.newValue === "true");
      if (e.key === `room_${roomCode}_messages`) setMessages(JSON.parse(e.newValue || "[]"));
      if (e.key === `room_${roomCode}_answers`) setAnswers(JSON.parse(e.newValue || "[]"));
      if (e.key === `room_${roomCode}_question`) setQuestion(e.newValue);
      if (e.key === `room_${roomCode}_phase`) setPhase(e.newValue);
      if (e.key === `room_${roomCode}_imposter`) setImposter(e.newValue);
      if (e.key === `room_${roomCode}_votes`) setVotes(JSON.parse(e.newValue || "[]"));
      if (e.key === `room_${roomCode}_currentRound`) setCurrentRound(parseInt(e.newValue || "1"));
      if (e.key === `room_${roomCode}_settings`) setSettings(JSON.parse(e.newValue));
      if (e.key === `room_${roomCode}_scores`) setScores(JSON.parse(e.newValue));
      if (e.key === `room_${roomCode}_timer`) setTimer(parseInt(e.newValue || "60"));
      if (e.key === `room_${roomCode}_showLeaderboard`) setShowLeaderboard(e.newValue === "true");
      if (e.key === `room_${roomCode}_gameCompleted`) setGameCompleted(e.newValue === "true");
    }
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [roomCode]);

  function changeSetting(type, direction) {
    if (host !== usernameInput) return;
    
    let newSettings = { ...settings };
    
    if (type === 'answerTime') {
      const currentIndex = timeOptions.indexOf(settings.answerTime);
      let newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = timeOptions.length - 1;
      if (newIndex >= timeOptions.length) newIndex = 0;
      newSettings.answerTime = timeOptions[newIndex];
    } else if (type === 'voteTime') {
      const currentIndex = timeOptions.indexOf(settings.voteTime);
      let newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = timeOptions.length - 1;
      if (newIndex >= timeOptions.length) newIndex = 0;
      newSettings.voteTime = timeOptions[newIndex];
    } else if (type === 'totalRounds') {
      const currentIndex = roundOptions.indexOf(settings.totalRounds);
      let newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = roundOptions.length - 1;
      if (newIndex >= roundOptions.length) newIndex = 0;
      newSettings.totalRounds = roundOptions[newIndex];
    }
    
    setSettings(newSettings);
  }

  const handleSettingsSave = () => {
    localStorage.setItem(`room_${roomCode}_settings`, JSON.stringify(settings));
    alert("Settings saved!");
  };

  function handleSubmitAnswer(auto = false, autoAnswer = "any") {
    const current = JSON.parse(localStorage.getItem(`room_${roomCode}_answers`) || "[]");
    if (current.find((a) => a.player === usernameInput)) return;
    const updated = [...current, { player: usernameInput, answer: auto ? autoAnswer : answer }];
    localStorage.setItem(`room_${roomCode}_answers`, JSON.stringify(updated));
    setAnswers(updated);
    setAnswer("");
    addMessage(`${usernameInput} submitted their answer.`);
  }

  function handleVoteSubmit(auto = false) {
    const current = JSON.parse(localStorage.getItem(`room_${roomCode}_votes`) || "[]");
    if (current.find((v) => v.voter === usernameInput)) return;
    const updated = [...current, { voter: usernameInput, voted: auto ? "(No Vote)" : selectedVote }];
    localStorage.setItem(`room_${roomCode}_votes`, JSON.stringify(updated));
    setVotes(updated);
    setSelectedVote("");
    addMessage(`${usernameInput} has voted.`);
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    if (chatInput.trim()) {
      addChatMessage(chatInput.trim());
      setChatInput("");
    }
  }

  function startGame() {
    if (players.length < 3) return alert("At least 3 players required.");
    localStorage.setItem(`room_${roomCode}_started`, "true");
    localStorage.setItem(`room_${roomCode}_currentRound`, "1");
    localStorage.setItem(`room_${roomCode}_gameCompleted`, "false");
    localStorage.setItem(`room_${roomCode}_showLeaderboard`, "false");
    setGameStarted(true);
    setCurrentRound(1);
    setGameCompleted(false);
    setShowLeaderboard(false);
    
    const initialScores = {};
    players.forEach(player => {
      initialScores[player] = 0;
    });
    localStorage.setItem(`room_${roomCode}_scores`, JSON.stringify(initialScores));
    setScores(initialScores);
    
    startRound();
  }

  function startRound() {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const imp = players[Math.floor(Math.random() * players.length)];
    
    localStorage.setItem(`room_${roomCode}_question`, q);
    localStorage.setItem(`room_${roomCode}_imposter`, imp);
    localStorage.setItem(`room_${roomCode}_phase`, "question");
    localStorage.setItem(`room_${roomCode}_timer`, String(settings.answerTime));
    localStorage.removeItem(`room_${roomCode}_answers`);
    localStorage.removeItem(`room_${roomCode}_votes`);
    
    setQuestion(q);
    setImposter(imp);
    setAnswers([]);
    setVotes([]);
    setPhase("question");
    setTimer(settings.answerTime);
    
    addMessage(`Round ${currentRound} started!`);
  }

  useEffect(() => {
    if (phase === "question" && answers.length === players.length) {
      setPhase("voting");
      setTimer(settings.voteTime);
      localStorage.setItem(`room_${roomCode}_phase`, "voting");
      localStorage.setItem(`room_${roomCode}_timer`, String(settings.voteTime));
    }
    if (phase === "voting" && votes.length === players.length) {
      setPhase("reveal");
      localStorage.setItem(`room_${roomCode}_phase`, "reveal");
      updateScores();
    }
  }, [answers, votes, phase, players.length, settings]);

  function updateScores() {
    const voteMap = {};
    votes.forEach(({ voted }) => {
      if (voted && voted !== "(No Vote)") {
        if (!voteMap[voted]) voteMap[voted] = 0;
        voteMap[voted]++;
      }
    });
    
    let mostVoted = "";
    let maxVotes = 0;
    Object.entries(voteMap).forEach(([player, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVoted = player;
      }
    });
    
    if (mostVoted !== imposter && imposter) {
      const updated = { ...scores };
      updated[imposter] = (updated[imposter] || 0) + 1;
      localStorage.setItem(`room_${roomCode}_scores`, JSON.stringify(updated));
      setScores(updated);
      addMessage(`${imposter} (imposter) successfully bluffed and earned a point!`);
    } else if (mostVoted === imposter) {
      addMessage(`${imposter} (imposter) was caught! No points awarded.`);
    } else {
      addMessage("No clear majority vote. No points awarded.");
    }
  }

  function nextRound() {
    if (currentRound >= settings.totalRounds) {
      setShowLeaderboard(true);
      setGameCompleted(true);
      localStorage.setItem(`room_${roomCode}_showLeaderboard`, "true");
      localStorage.setItem(`room_${roomCode}_gameCompleted`, "true");
      localStorage.setItem(`room_${roomCode}_phase`, "completed");
    } else {
      const nextRoundNum = currentRound + 1;
      setCurrentRound(nextRoundNum);
      localStorage.setItem(`room_${roomCode}_currentRound`, String(nextRoundNum));
      startRound();
    }
  }

  function playAgain() {
    localStorage.removeItem(`room_${roomCode}_started`);
    localStorage.removeItem(`room_${roomCode}_question`);
    localStorage.removeItem(`room_${roomCode}_imposter`);
    localStorage.removeItem(`room_${roomCode}_answers`);
    localStorage.removeItem(`room_${roomCode}_votes`);
    localStorage.removeItem(`room_${roomCode}_scores`);
    localStorage.removeItem(`room_${roomCode}_messages`);
    localStorage.removeItem(`room_${roomCode}_showLeaderboard`);
    localStorage.removeItem(`room_${roomCode}_gameCompleted`);
    localStorage.setItem(`room_${roomCode}_phase`, "waiting");
    localStorage.setItem(`room_${roomCode}_currentRound`, "1");
    
    setGameStarted(false);
    setCurrentRound(1);
    setPhase("waiting");
    setAnswers([]);
    setVotes([]);
    setScores({});
    setMessages([]);
    setShowLeaderboard(false);
    setGameCompleted(false);
    setQuestion("");
    setImposter(null);
  }

  function handleNameSubmit() {
    let name = usernameInput.trim();
    const currentPlayers = JSON.parse(localStorage.getItem(`room_${roomCode}_players`) || "[]");
    if (!name) name = generateFallbackName(currentPlayers);
    if (currentPlayers.includes(name)) return setNameError("Username taken.");
    setNameError("");
    localStorage.setItem("username", name);
    setUsernameInput(name);
  }

  const answerSubmitted = answers.find((a) => a.player === usernameInput);
  const voteSubmitted = votes.find((v) => v.voter === usernameInput);
  const voteCount = players.reduce((acc, p) => {
    acc[p] = votes.filter((v) => v.voted === p).length;
    return acc;
  }, {});
  const votedFor = voteSubmitted?.voted;

  const displayedQuestion =
    phase === "question" && imposter === usernameInput
      ? getImposterQuestion(question)
      : question;

  const shouldShowChat = gameStarted && phase !== "question";

  if (!usernameInput) {
    return (
      <div className="game-container">
        <div className="game-header">
          <img src="img/name.png" alt="Game Title" className="header-image" />
        </div>
        
        <div className="join-container">
          <div className="floating-tile join-tile">
            <h2>Join Room {roomCode}</h2>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter username or leave blank for random"
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="username-input"
            />
            <button onClick={handleNameSubmit} className="join-button">
              Join Room
            </button>
            {nameError && <p className="error-message">{nameError}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <img src="img/name.png" alt="Game Title" className="header-image" />
      </div>

      {/* Leaderboard Overlay */}
      {showLeaderboard && gameCompleted && (
        <div className="leaderboard-overlay">
          <div className="floating-tile leaderboard-tile">
            <h2>🏆 Final Results</h2>
            <div className="leaderboard-content">
              {Object.entries(scores)
                .sort(([,a], [,b]) => b - a)
                .map(([player, score], index) => (
                  <div key={player} className={`leaderboard-item ${index === 0 ? 'winner' : ''}`}>
                    <span className="rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="player-name">{player}</span>
                    <span className="score">{score} pts</span>
                  </div>
                ))}
            </div>
            {host === usernameInput && (
              <button onClick={playAgain} className="play-again-button">
                Play Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* User Info Box (Game Phases) */}
      {gameStarted && !showLeaderboard && (
        <div className="user-info-box">
          <div className="user-info-content">
            <h4>{usernameInput}</h4>
            <p>Room: {roomCode}</p>
            <p>Round: {currentRound}</p>
            <span className={`role-badge ${host === usernameInput ? 'host' : 'player'}`}>
              {host === usernameInput ? 'HOST' : 'PLAYER'}
            </span>
            <button 
              onClick={() => setShowLeaderboardPopup(!showLeaderboardPopup)}
              className="leaderboard-button"
            >
              🏆 Scores
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Popup */}
      {showLeaderboardPopup && (
        <div className="leaderboard-popup">
          <div className="popup-header">
            <h4>Current Scores</h4>
            <button 
              onClick={() => setShowLeaderboardPopup(false)}
              className="close-button"
            >
              ✕
            </button>
          </div>
          <div className="popup-content">
            {Object.entries(scores).length > 0 ? (
              Object.entries(scores)
                .sort(([,a], [,b]) => b - a)
                .map(([player, score], index) => (
                  <div key={player} className="popup-score-item">
                    <span>{index + 1}. {player}</span>
                    <span><strong>{score}</strong></span>
                  </div>
                ))
            ) : (
              <p className="no-scores">No scores yet</p>
            )}
          </div>
        </div>
      )}

      {/* Waiting Room Layout */}
      {!gameStarted && !gameCompleted && (
        <div className="waiting-room">
          <div className="waiting-grid">
            {/* Main Player Info Tile */}
            <div className="floating-tile main-info-tile">
              <div className="player-header">
                <h2>{usernameInput}</h2>
                <span className={`role-badge ${host === usernameInput ? 'host' : 'player'}`}>
                  {host === usernameInput ? 'HOST' : 'PLAYER'}
                </span>
              </div>
              <p className="room-code">Room: {roomCode}</p>
              
              <h3>Waiting for players...</h3>
              <div className="player-list">
                {players.map(p => (
                  <div key={p} className="player-item">
                    <span className="player-avatar">👤</span>
                    <span className="player-name">{p}</span>
                    {p === host && <span className="host-indicator">👑</span>}
                  </div>
                ))}
              </div>
              
              {host === usernameInput && (
                <button onClick={startGame} className="start-game-button">
                  Start Game ({players.length} players)
                </button>
              )}
            </div>

            {/* Settings Tile */}
            <div className="floating-tile settings-tile">
              <h3>Game Settings</h3>
              
              <div className="setting-item">
                <label>Answer Time</label>
                <div className="setting-control">
                  <button 
                    onClick={() => changeSetting('answerTime', -1)}
                    disabled={host !== usernameInput}
                    className="arrow-button"
                  >
                    ◀
                  </button>
                  <span className="setting-value">{settings.answerTime}s</span>
                  <button 
                    onClick={() => changeSetting('answerTime', 1)}
                    disabled={host !== usernameInput}
                    className="arrow-button"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <label>Voting Time</label>
                <div className="setting-control">
                  <button 
                    onClick={() => changeSetting('voteTime', -1)}
                    disabled={host !== usernameInput}
                    className="arrow-button"
                  >
                    ◀
                  </button>
                  <span className="setting-value">{settings.voteTime}s</span>
                  <button 
                    onClick={() => changeSetting('voteTime', 1)}
                    disabled={host !== usernameInput}
                    className="arrow-button"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <label>Rounds</label>
                <div className="setting-control">
                  <button 
                    onClick={() => changeSetting('totalRounds', -1)}
                    disabled={host !== usernameInput}
                    className="arrow-button"
                  >
                    ◀
                  </button>
                  <span className="setting-value">{settings.totalRounds}</span>
                  <button 
                    onClick={() => changeSetting('totalRounds', 1)}
                    disabled={host !== usernameInput}
                    className="arrow-button"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {host === usernameInput && (
                <button onClick={handleSettingsSave} className="save-settings-button">
                  Save Settings
                </button>
              )}
              
              {host !== usernameInput && (
                <p className="readonly-note">Only host can modify settings</p>
              )}
            </div>

            {/* Chat Tile */}
            <div className="floating-tile chat-tile">
              <h4>Chat</h4>
              <div className="chat-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.isSystem ? 'system' : 'user'}`}>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="chat-form">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="chat-input"
                />
                <button type="submit" className="chat-send-button">Send</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Question Phase */}
      {gameStarted && phase === "question" && !showLeaderboard && (
        <div className="game-phase">
          <div className="floating-tile main-game-tile">
            <div className="tile-header">
              <h3>Round {currentRound} of {settings.totalRounds}</h3>
              <CircularTimer 
                timeLeft={timer} 
                totalTime={settings.answerTime} 
                size={80} 
              />
            </div>
            
            <div className="question-section">
              <h4>Question:</h4>
              <p className="question-text">{displayedQuestion}</p>
            </div>

            {!answerSubmitted ? (
              <div className="answer-section">
                <textarea 
                  rows={3} 
                  value={answer} 
                  onChange={(e) => setAnswer(e.target.value)} 
                  placeholder="Enter your answer here..."
                  className="answer-input"
                />
                <button 
                  onClick={() => handleSubmitAnswer()} 
                  disabled={!answer.trim()}
                  className="submit-answer-button"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <div className="answer-submitted">
                <p><strong>Your answer:</strong> {answerSubmitted.answer}</p>
                <p className="submitted-indicator">✓ Answer submitted!</p>
              </div>
            )}
            
            <div className="progress-indicator">
              <p>Answered: {answers.length}/{players.length} players</p>
            </div>
          </div>
        </div>
      )}

      {/* Voting Phase */}
      {gameStarted && phase === "voting" && !showLeaderboard && (
        <div className="voting-phase">
          <div className="voting-grid">
            {/* Answers Display */}
            <div className="floating-tile answers-tile">
              <div className="tile-header">
                <h4>Question: {question}</h4>
                <CircularTimer 
                  timeLeft={timer} 
                  totalTime={settings.voteTime} 
                  size={60} 
                />
              </div>
              
              <h4>All Answers:</h4>
              <div className="answers-list">
                {answers.map(({ player, answer }) => (
                  <div key={player} className="answer-item">
                    <strong>{player}:</strong> {answer}
                  </div>
                ))}
              </div>
            </div>

            <div className="voting-sidebar">
              {/* Voting Section */}
              <div className="floating-tile voting-tile">
                {!voteSubmitted ? (
                  <>
                    <h4>Vote for the Imposter:</h4>
                    <div className="vote-options">
                      {players.filter(p => p !== usernameInput).map(p => (
                        <label key={p} className="vote-option">
                          <input
                            type="radio"
                            name="vote"
                            value={p}
                            checked={selectedVote === p}
                            onChange={(e) => setSelectedVote(e.target.value)}
                          />
                          <span className="vote-label">{p}</span>
                        </label>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleVoteSubmit()} 
                      disabled={!selectedVote}
                      className="submit-vote-button"
                    >
                      Submit Vote
                    </button>
                  </>
                ) : (
                  <div className="vote-submitted">
                    <p><strong>You voted for:</strong> {votedFor}</p>
                    <p className="submitted-indicator">✓ Vote submitted!</p>
                    <p>Votes cast: {votes.length}/{players.length}</p>
                  </div>
                )}
              </div>

              {/* Chat */}
              <div className="floating-tile chat-tile">
                <h4>Chat</h4>
                <div className="chat-messages">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.isSystem ? 'system' : 'user'}`}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="chat-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                  />
                  <button type="submit" className="chat-send-button">Send</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Phase */}
      {gameStarted && phase === "reveal" && !showLeaderboard && (
        <div className="game-phase">
          <div className="floating-tile reveal-tile">
            <h3>Round {currentRound} Results</h3>
            
            <div className="reveal-content">
              <div className="imposter-reveal">
                <h4>The Imposter was: <span className="imposter-name">{imposter}</span></h4>
                <p><strong>Imposter's Question:</strong> {getImposterQuestion(question)}</p>
                <p><strong>Everyone else's Question:</strong> {question}</p>
              </div>

              <div className="vote-results">
                <h4>Vote Results:</h4>
                {Object.entries(voteCount).map(([player, count]) => (
                  <div key={player} className={`vote-result ${player === imposter ? 'imposter-votes' : ''}`}>
                    {player}: {count} vote{count !== 1 ? 's' : ''}
                  </div>
                ))}
              </div>

              <div className="current-scores">
                <h4>Current Scores:</h4>
                {Object.entries(scores).sort(([,a], [,b]) => b - a).map(([player, score]) => (
                  <div key={player} className="score-item">
                    {player}: {score} point{score !== 1 ? 's' : ''}
                  </div>
                ))}
              </div>

              {host === usernameInput && (
                <button onClick={nextRound} className="next-round-button">
                  {currentRound >= settings.totalRounds ? "Show Final Results" : "Next Round"}
                </button>
              )}
            </div>

            {/* Chat during reveal */}
            {shouldShowChat && (
              <div className="reveal-chat">
                <h4>Chat</h4>
                <div className="chat-messages">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.isSystem ? 'system' : 'user'}`}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="chat-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                  />
                  <button type="submit" className="chat-send-button">Send</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}