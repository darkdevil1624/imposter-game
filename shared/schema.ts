import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Game room schema
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull(),
  settings: text("settings").notNull(), // JSON string
  currentRound: integer("current_round").default(1),
  gameState: text("game_state").default("waiting"), // waiting, question, voting, results, finished
  question: text("question"),
  imposter: text("imposter"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Players in rooms
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  username: text("username").notNull(),
  score: integer("score").default(0),
  isHost: boolean("is_host").default(false),
  isConnected: boolean("is_connected").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Game answers
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  round: integer("round").notNull(),
  player: text("player").notNull(),
  answer: text("answer").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Game votes
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  round: integer("round").notNull(),
  voter: text("voter").notNull(),
  votedFor: text("voted_for").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  isSystem: boolean("is_system").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Insert schemas
export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  submittedAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  submittedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

// Types
export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Game types
export interface GameSettings {
  answerTime: number;
  voteTime: number;
  totalRounds: number;
}

export interface GameState {
  phase: "waiting" | "question" | "voting" | "results" | "finished";
  currentRound: number;
  question?: string;
  imposter?: string;
  timeLeft?: number;
  answers: Answer[];
  votes: Vote[];
}

export interface WebSocketMessage {
  type: 
    | "joinRoom"
    | "startGame" 
    | "sendAnswer"
    | "sendVote"
    | "sendMessage"
    | "roomUpdate"
    | "gameStateUpdate"
    | "answersUpdate"
    | "votesUpdate"
    | "messageUpdate"
    | "playerUpdate"
    | "error";
  data?: any;
}
