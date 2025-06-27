import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isHost = localStorage.getItem("isHost") === "true";
  const username = localStorage.getItem("username") || "Player";

  useEffect(() => {
    if (isHost) {
      const newCode = generateRoomCode();
      setRoomCode(newCode);
    }
  }, [isHost]);

  const handleProceed = () => {
    const trimmedRoomCode = roomCode.trim().toUpperCase();
    if (!trimmedRoomCode) {
      setError("Please enter a room code");
      return;
    }

    const playersKey = `room_${trimmedRoomCode}_players`;
    const existingPlayers = JSON.parse(localStorage.getItem(playersKey) || "[]");

    if (existingPlayers.includes(username)) {
      setError("Username already exists in this room. Please choose a different name.");
      return;
    }

    existingPlayers.push(username);
    localStorage.setItem(playersKey, JSON.stringify(existingPlayers));
    localStorage.setItem("roomCode", trimmedRoomCode);

    // If host, set as host in localStorage
    if (isHost) {
      localStorage.setItem(`room_${trimmedRoomCode}_host`, username);
    }

    navigate(`/game/${trimmedRoomCode}`);
  };

  return (
    <div className="container">
      <h2>{isHost ? "Host a Room" : "Join a Room"}</h2>
      {isHost ? (
        <>
          <p>Your room code is:</p>
          <h3 style={{ letterSpacing: "4px" }}>{roomCode}</h3>
          <small>Share this code with your friends to join</small>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError("");
            }}
            maxLength={6}
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
      <button onClick={handleProceed}>{isHost ? "Start Game" : "Join"}</button>
    </div>
  );
}
