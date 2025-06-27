import { useParams } from "react-router-dom";

export default function GameRoom() {
  const { roomId } = useParams();
  const username = localStorage.getItem("username");

  return (
    <div style={{ padding: 20 }}>
      <h1>Game Room: {roomId}</h1>
      <p>Welcome, {username}!</p>
      <p>This is where the game will happen.</p>
    </div>
  );
}
