# replit.md

## Overview
This is a real-time multiplayer "Imposter Game" built with React frontend and Express.js backend. Players join game rooms where one player receives a different question than the others, and everyone must figure out who the imposter is through voting. The application uses WebSockets for real-time communication and PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight routing library)
- **State Management**: React hooks with local state and React Query for server state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Real-time Communication**: WebSocket client with automatic reconnection
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server using 'ws' library
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with fallback to database persistence
- **Development**: Hot reload with Vite middleware integration

### Key Components

#### Game Flow Management
- **Landing Page**: Choose to host or join a room
- **Username Selection**: Set player identity with random name generation
- **Room Management**: Create/join rooms with 6-character codes
- **Game Phases**: Lobby → Question → Voting → Results → Next Round
- **Real-time Updates**: All players see game state changes instantly

#### Data Models
- **Rooms**: Game sessions with settings and current state
- **Players**: Users in rooms with scores and connection status
- **Answers**: Player responses to questions for each round
- **Votes**: Player votes for who they think is the imposter
- **Messages**: Chat system for player communication

## Data Flow

1. **Room Creation**: Host creates room, generates unique code, sets game settings
2. **Player Joining**: Players join via room code, receive real-time updates
3. **Game Start**: System selects random question and designates one imposter
4. **Question Phase**: Regular players see normal question, imposter sees opposite question
5. **Answer Collection**: All players submit answers within time limit
6. **Voting Phase**: Players vote for who they think is the imposter
7. **Results**: System reveals imposter and calculates scores
8. **Next Round**: Process repeats until configured number of rounds complete

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, React DOM
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Date Handling**: date-fns
- **Carousel**: Embla Carousel React

### Backend Dependencies
- **Web Framework**: Express.js
- **WebSocket**: ws library
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Validation**: Zod with drizzle-zod
- **Session Storage**: connect-pg-simple
- **Development**: tsx for TypeScript execution

### Development Dependencies
- **Build Tools**: Vite, esbuild
- **TypeScript**: Full TypeScript setup with strict mode
- **Linting/Formatting**: Configured via TypeScript compiler
- **Development Server**: Vite dev server with HMR

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Port**: 5000 (configured in .replit)
- **Features**: Hot reload, error overlay, auto-restart
- **Database**: PostgreSQL 16 module in Replit

### Production Build
- **Frontend Build**: `vite build` outputs to `dist/public`
- **Backend Build**: `esbuild` bundles server to `dist/index.js`
- **Start Command**: `npm run start`
- **Deployment Target**: Replit Autoscale
- **External Port**: 80 (mapped from internal 5000)

### Database Configuration
- **ORM**: Drizzle with PostgreSQL dialect
- **Migrations**: Stored in `./migrations` directory
- **Schema**: Defined in `shared/schema.ts`
- **Connection**: Uses `DATABASE_URL` environment variable
- **Push Command**: `npm run db:push` for schema updates

## Changelog
Changelog:
- June 27, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.