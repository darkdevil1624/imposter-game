import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function generateRandomUsername() {
  const adjectives = ["Blue", "Red", "Green", "Yellow", "Purple"];
  const animals = ["Fox", "Tiger", "Bear", "Lion", "Wolf"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective}${animal}${number}`;
}

export default function UsernameInput() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    const trimmedUsername = username.trim();
    const finalUsername = trimmedUsername === "" ? generateRandomUsername() : trimmedUsername;

    localStorage.setItem("username", finalUsername);
    navigate("/join");
  };

  return (
    <div className="container">
      <h2>Enter Your Username</h2>
      <input
        type="text"
        placeholder="Your name"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          setError("");
        }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleContinue}>Continue</button>
    </div>
  );
}
