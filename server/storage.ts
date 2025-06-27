import { 
  rooms, 
  players, 
  answers, 
  votes, 
  messages,
  type Room, 
  type Player, 
  type Answer, 
  type Vote, 
  type Message,
  type InsertRoom,
  type InsertPlayer,
  type InsertAnswer,
  type InsertVote,
  type InsertMessage
} from "@shared/schema";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  updateRoom(code: string, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(code: string): Promise<boolean>;

  // Player operations
  addPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByRoom(roomCode: string): Promise<Player[]>;
  getPlayer(roomCode: string, username: string): Promise<Player | undefined>;
  updatePlayer(roomCode: string, username: string, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayer(roomCode: string, username: string): Promise<boolean>;

  // Answer operations
  addAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByRound(roomCode: string, round: number): Promise<Answer[]>;
  clearAnswers(roomCode: string, round: number): Promise<boolean>;

  // Vote operations
  addVote(vote: InsertVote): Promise<Vote>;
  getVotesByRound(roomCode: string, round: number): Promise<Vote[]>;
  clearVotes(roomCode: string, round: number): Promise<boolean>;

  // Message operations
  addMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoom(roomCode: string): Promise<Message[]>;
  clearMessages(roomCode: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room> = new Map();
  private players: Map<string, Player[]> = new Map();
  private answers: Map<string, Answer[]> = new Map();
  private votes: Map<string, Vote[]> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private currentId = 1;

  private getId(): number {
    return this.currentId++;
  }

  // Room operations
  async createRoom(roomData: InsertRoom): Promise<Room> {
    const room: Room = {
      id: this.getId(),
      code: roomData.code,
      hostId: roomData.hostId,
      settings: roomData.settings,
      currentRound: roomData.currentRound ?? 1,
      gameState: roomData.gameState ?? "waiting",
      question: roomData.question ?? null,
      imposter: roomData.imposter ?? null,
      createdAt: new Date(),
    };
    this.rooms.set(room.code, room);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return this.rooms.get(code);
  }

  async updateRoom(code: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(code);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(code, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(code: string): Promise<boolean> {
    const deleted = this.rooms.delete(code);
    if (deleted) {
      this.players.delete(code);
      this.answers.delete(code);
      this.votes.delete(code);
      this.messages.delete(code);
    }
    return deleted;
  }

  // Player operations
  async addPlayer(playerData: InsertPlayer): Promise<Player> {
    const player: Player = {
      id: this.getId(),
      roomCode: playerData.roomCode,
      username: playerData.username,
      score: playerData.score ?? 0,
      isHost: playerData.isHost ?? false,
      isConnected: playerData.isConnected ?? true,
      joinedAt: new Date(),
    };
    
    const roomPlayers = this.players.get(playerData.roomCode) || [];
    roomPlayers.push(player);
    this.players.set(playerData.roomCode, roomPlayers);
    
    return player;
  }

  async getPlayersByRoom(roomCode: string): Promise<Player[]> {
    return this.players.get(roomCode) || [];
  }

  async getPlayer(roomCode: string, username: string): Promise<Player | undefined> {
    const roomPlayers = this.players.get(roomCode) || [];
    return roomPlayers.find(p => p.username === username);
  }

  async updatePlayer(roomCode: string, username: string, updates: Partial<Player>): Promise<Player | undefined> {
    const roomPlayers = this.players.get(roomCode) || [];
    const playerIndex = roomPlayers.findIndex(p => p.username === username);
    
    if (playerIndex === -1) return undefined;
    
    roomPlayers[playerIndex] = { ...roomPlayers[playerIndex], ...updates };
    this.players.set(roomCode, roomPlayers);
    
    return roomPlayers[playerIndex];
  }

  async removePlayer(roomCode: string, username: string): Promise<boolean> {
    const roomPlayers = this.players.get(roomCode) || [];
    const initialLength = roomPlayers.length;
    const filteredPlayers = roomPlayers.filter(p => p.username !== username);
    
    this.players.set(roomCode, filteredPlayers);
    return filteredPlayers.length < initialLength;
  }

  // Answer operations
  async addAnswer(answerData: InsertAnswer): Promise<Answer> {
    const answer: Answer = {
      ...answerData,
      id: this.getId(),
      submittedAt: new Date(),
    };
    
    const roomAnswers = this.answers.get(answerData.roomCode) || [];
    roomAnswers.push(answer);
    this.answers.set(answerData.roomCode, roomAnswers);
    
    return answer;
  }

  async getAnswersByRound(roomCode: string, round: number): Promise<Answer[]> {
    const roomAnswers = this.answers.get(roomCode) || [];
    return roomAnswers.filter(a => a.round === round);
  }

  async clearAnswers(roomCode: string, round: number): Promise<boolean> {
    const roomAnswers = this.answers.get(roomCode) || [];
    const filteredAnswers = roomAnswers.filter(a => a.round !== round);
    this.answers.set(roomCode, filteredAnswers);
    return true;
  }

  // Vote operations
  async addVote(voteData: InsertVote): Promise<Vote> {
    const vote: Vote = {
      ...voteData,
      id: this.getId(),
      submittedAt: new Date(),
    };
    
    const roomVotes = this.votes.get(voteData.roomCode) || [];
    roomVotes.push(vote);
    this.votes.set(voteData.roomCode, roomVotes);
    
    return vote;
  }

  async getVotesByRound(roomCode: string, round: number): Promise<Vote[]> {
    const roomVotes = this.votes.get(roomCode) || [];
    return roomVotes.filter(v => v.round === round);
  }

  async clearVotes(roomCode: string, round: number): Promise<boolean> {
    const roomVotes = this.votes.get(roomCode) || [];
    const filteredVotes = roomVotes.filter(v => v.round !== round);
    this.votes.set(roomCode, filteredVotes);
    return true;
  }

  // Message operations
  async addMessage(messageData: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.getId(),
      roomCode: messageData.roomCode,
      author: messageData.author,
      content: messageData.content,
      isSystem: messageData.isSystem ?? false,
      sentAt: new Date(),
    };
    
    const roomMessages = this.messages.get(messageData.roomCode) || [];
    roomMessages.push(message);
    this.messages.set(messageData.roomCode, roomMessages);
    
    return message;
  }

  async getMessagesByRoom(roomCode: string): Promise<Message[]> {
    return this.messages.get(roomCode) || [];
  }

  async clearMessages(roomCode: string): Promise<boolean> {
    this.messages.set(roomCode, []);
    return true;
  }
}

export const storage = new MemStorage();
