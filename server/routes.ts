import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { WebSocketMessage, GameSettings } from "@shared/schema";

const QUESTIONS = [
  "What is your favorite food?",
  "What is your favorite sport?", 
  "Where do you want to travel next?",
  "What is your favorite movie genre?",
  "What is your favorite season?",
  "What is your dream job?",
  "What is your favorite hobby?",
  "What is your favorite color?",
];

const IMPOSTER_QUESTIONS: Record<string, string> = {
  "What is your favorite food?": "What food do you dislike the most?",
  "What is your favorite sport?": "What sport do you find boring?",
  "Where do you want to travel next?": "Where would you never want to visit?",
  "What is your favorite movie genre?": "What movie genre do you hate?",
  "What is your favorite season?": "What season do you dislike?",
  "What is your dream job?": "What job would you never want to do?",
  "What is your favorite hobby?": "What hobby seems pointless to you?",
  "What is your favorite color?": "What color do you find ugly?",
};

interface ClientInfo {
  roomCode?: string;
  username?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<WebSocket, ClientInfo>();

  function generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function broadcastToRoom(roomCode: string, message: WebSocketMessage, excludeClient?: WebSocket) {
    clients.forEach((clientInfo, client) => {
      if (client !== excludeClient && 
          clientInfo.roomCode === roomCode && 
          client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  function sendToClient(client: WebSocket, message: WebSocketMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  async function updateRoomState(roomCode: string) {
    const room = await storage.getRoomByCode(roomCode);
    const players = await storage.getPlayersByRoom(roomCode);
    const messages = await storage.getMessagesByRoom(roomCode);
    
    if (!room) return;

    const roomUpdate: WebSocketMessage = {
      type: "roomUpdate",
      data: {
        room,
        players,
        messages,
      }
    };

    broadcastToRoom(roomCode, roomUpdate);
  }

  async function startGameRound(roomCode: string) {
    const room = await storage.getRoomByCode(roomCode);
    const players = await storage.getPlayersByRoom(roomCode);
    
    if (!room || players.length < 3) return;

    // Clear previous round data
    await storage.clearAnswers(roomCode, room.currentRound || 1);
    await storage.clearVotes(roomCode, room.currentRound || 1);

    // Select random question and imposter
    const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const imposter = players[Math.floor(Math.random() * players.length)].username;

    // Update room state
    await storage.updateRoom(roomCode, {
      gameState: "question",
      question,
      imposter,
    });

    // Send game state update
    const gameStateUpdate: WebSocketMessage = {
      type: "gameStateUpdate",
      data: {
        phase: "question",
        currentRound: room.currentRound,
        question,
        imposter,
        timeLeft: JSON.parse(room.settings).answerTime,
      }
    };

    broadcastToRoom(roomCode, gameStateUpdate);

    // Send individual questions to players
    players.forEach(player => {
      const clientEntry = Array.from(clients.entries()).find(
        ([_, info]) => info.roomCode === roomCode && info.username === player.username
      );
      
      if (clientEntry) {
        const [client] = clientEntry;
        const playerQuestion = player.username === imposter 
          ? (IMPOSTER_QUESTIONS[question] || question)
          : question;

        sendToClient(client, {
          type: "gameStateUpdate",
          data: {
            phase: "question",
            currentRound: room.currentRound,
            question: playerQuestion,
            timeLeft: JSON.parse(room.settings).answerTime,
          }
        });
      }
    });

    // Auto-advance after timer expires
    const settings: GameSettings = JSON.parse(room.settings);
    setTimeout(async () => {
      const currentRoom = await storage.getRoomByCode(roomCode);
      if (currentRoom && currentRoom.gameState === "question") {
        await startVotingPhase(roomCode);
      }
    }, settings.answerTime * 1000);
  }

  async function startVotingPhase(roomCode: string) {
    const room = await storage.getRoomByCode(roomCode);
    if (!room) return;
    
    const answers = await storage.getAnswersByRound(roomCode, room.currentRound || 1);

    await storage.updateRoom(roomCode, { gameState: "voting" });

    const gameStateUpdate: WebSocketMessage = {
      type: "gameStateUpdate", 
      data: {
        phase: "voting",
        currentRound: room.currentRound,
        answers: answers.map(a => ({ answer: a.answer })), // Anonymous answers
        timeLeft: JSON.parse(room.settings).voteTime,
      }
    };

    broadcastToRoom(roomCode, gameStateUpdate);

    // Auto-advance after timer expires
    const settings: GameSettings = JSON.parse(room.settings);
    setTimeout(async () => {
      const currentRoom = await storage.getRoomByCode(roomCode);
      if (currentRoom && currentRoom.gameState === "voting") {
        await showResults(roomCode);
      }
    }, settings.voteTime * 1000);
  }

  async function showResults(roomCode: string) {
    const room = await storage.getRoomByCode(roomCode);
    if (!room) return;
    
    const players = await storage.getPlayersByRoom(roomCode);
    const round = room.currentRound || 1;
    const votes = await storage.getVotesByRound(roomCode, round);
    const answers = await storage.getAnswersByRound(roomCode, round);

    await storage.updateRoom(roomCode, { gameState: "results" });

    // Calculate voting results
    const voteCounts: Record<string, number> = {};
    votes.forEach(vote => {
      voteCounts[vote.votedFor] = (voteCounts[vote.votedFor] || 0) + 1;
    });

    // Award points
    const imposterVotes = voteCounts[room.imposter!] || 0;
    const totalVotes = votes.length;
    
    // Players who voted for imposter get points
    for (const vote of votes) {
      if (vote.votedFor === room.imposter) {
        const player = await storage.getPlayer(roomCode, vote.voter);
        if (player) {
          await storage.updatePlayer(roomCode, vote.voter, {
            score: (player.score || 0) + 10
          });
        }
      }
    }

    const updatedPlayers = await storage.getPlayersByRoom(roomCode);

    const resultsUpdate: WebSocketMessage = {
      type: "gameStateUpdate",
      data: {
        phase: "results",
        currentRound: room.currentRound,
        imposter: room.imposter,
        question: room.question,
        imposterQuestion: room.question ? IMPOSTER_QUESTIONS[room.question] : "",
        voteCounts,
        players: updatedPlayers,
        answers: answers.map(a => ({ player: a.player, answer: a.answer })),
      }
    };

    broadcastToRoom(roomCode, resultsUpdate);

    // Check if game is finished
    const settings: GameSettings = JSON.parse(room.settings);
    const roomRound = room.currentRound || 1;
    if (roomRound >= settings.totalRounds) {
      setTimeout(async () => {
        await storage.updateRoom(roomCode, { gameState: "finished" });
        const finalPlayers = await storage.getPlayersByRoom(roomCode);
        
        broadcastToRoom(roomCode, {
          type: "gameStateUpdate",
          data: {
            phase: "finished",
            players: finalPlayers.sort((a, b) => (b.score || 0) - (a.score || 0)),
          }
        });
      }, 5000);
    } else {
      // Next round after delay
      setTimeout(async () => {
        await storage.updateRoom(roomCode, { 
          currentRound: roomRound + 1,
          gameState: "waiting"
        });
        await startGameRound(roomCode);
      }, 10000);
    }
  }

  wss.on('connection', (ws: WebSocket) => {
    clients.set(ws, {});

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        const clientInfo = clients.get(ws);

        switch (message.type) {
          case "joinRoom": {
            const { roomCode, username, isHost } = message.data;
            
            // Create room if hosting
            if (isHost) {
              const newRoomCode = generateRoomCode();
              const defaultSettings: GameSettings = {
                answerTime: 60,
                voteTime: 60,
                totalRounds: 5,
              };

              await storage.createRoom({
                code: newRoomCode,
                hostId: username,
                settings: JSON.stringify(defaultSettings),
                currentRound: 1,
                gameState: "waiting",
                question: null,
                imposter: null,
              });

              await storage.addPlayer({
                roomCode: newRoomCode,
                username,
                score: 0,
                isHost: true,
                isConnected: true,
              });

              clients.set(ws, { roomCode: newRoomCode, username });
              
              sendToClient(ws, {
                type: "roomUpdate",
                data: { roomCode: newRoomCode }
              });

              await updateRoomState(newRoomCode);
            } else {
              // Join existing room
              const room = await storage.getRoomByCode(roomCode);
              if (!room) {
                sendToClient(ws, {
                  type: "error",
                  data: { message: "Room not found" }
                });
                return;
              }

              const existingPlayer = await storage.getPlayer(roomCode, username);
              if (existingPlayer) {
                sendToClient(ws, {
                  type: "error", 
                  data: { message: "Username already taken" }
                });
                return;
              }

              await storage.addPlayer({
                roomCode,
                username,
                score: 0,
                isHost: false,
                isConnected: true,
              });

              clients.set(ws, { roomCode, username });
              await updateRoomState(roomCode);
            }
            break;
          }

          case "startGame": {
            if (!clientInfo?.roomCode || !clientInfo?.username) return;
            
            const room = await storage.getRoomByCode(clientInfo.roomCode);
            const players = await storage.getPlayersByRoom(clientInfo.roomCode);
            
            if (!room || room.hostId !== clientInfo.username || players.length < 3) {
              sendToClient(ws, {
                type: "error",
                data: { message: "Cannot start game" }
              });
              return;
            }

            await startGameRound(clientInfo.roomCode);
            break;
          }

          case "sendAnswer": {
            if (!clientInfo?.roomCode || !clientInfo?.username) return;
            
            const { answer } = message.data;
            const room = await storage.getRoomByCode(clientInfo.roomCode);
            
            if (!room || room.gameState !== "question") return;

            const answerRound = room.currentRound || 1;
            await storage.addAnswer({
              roomCode: clientInfo.roomCode,
              round: answerRound,
              player: clientInfo.username,
              answer,
            });

            // Check if all players answered
            const players = await storage.getPlayersByRoom(clientInfo.roomCode);
            const answers = await storage.getAnswersByRound(clientInfo.roomCode, answerRound);
            
            if (answers.length === players.length) {
              await startVotingPhase(clientInfo.roomCode);
            }
            break;
          }

          case "sendVote": {
            if (!clientInfo?.roomCode || !clientInfo?.username) return;
            
            const { votedFor } = message.data;
            const room = await storage.getRoomByCode(clientInfo.roomCode);
            
            if (!room || room.gameState !== "voting") return;

            const voteRound = room.currentRound || 1;
            await storage.addVote({
              roomCode: clientInfo.roomCode,
              round: voteRound,
              voter: clientInfo.username,
              votedFor,
            });

            // Check if all players voted
            const players = await storage.getPlayersByRoom(clientInfo.roomCode);
            const votes = await storage.getVotesByRound(clientInfo.roomCode, voteRound);
            
            if (votes.length === players.length) {
              await showResults(clientInfo.roomCode);
            }
            break;
          }

          case "sendMessage": {
            if (!clientInfo?.roomCode || !clientInfo?.username) return;
            
            const { content } = message.data;
            
            await storage.addMessage({
              roomCode: clientInfo.roomCode,
              author: clientInfo.username,
              content,
              isSystem: false,
            });

            await updateRoomState(clientInfo.roomCode);
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        sendToClient(ws, {
          type: "error",
          data: { message: "Invalid message format" }
        });
      }
    });

    ws.on('close', async () => {
      const clientInfo = clients.get(ws);
      if (clientInfo?.roomCode && clientInfo?.username) {
        await storage.updatePlayer(clientInfo.roomCode, clientInfo.username, {
          isConnected: false
        });
        await updateRoomState(clientInfo.roomCode);
      }
      clients.delete(ws);
    });
  });

  return httpServer;
}
