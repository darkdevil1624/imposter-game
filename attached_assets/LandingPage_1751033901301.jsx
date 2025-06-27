// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleHost = () => {
    localStorage.setItem("isHost", "true");
    navigate("/username");
  };

  const handleJoin = () => {
    localStorage.setItem("isHost", "false");
    navigate("/username");
  };

  return (
    <div className="container">
      <h2>Welcome to Imposter Game</h2>
      <p>Please select an option:</p>
      <button onClick={handleHost}>Host a Room</button>
      <button onClick={handleJoin} style={{ marginTop: "10px" }}>
        Join a Room
      </button>
    </div>
  );
}
