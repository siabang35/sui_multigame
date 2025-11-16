# Rory Legend - Blockchain Multiplayer 3D Battle Arena

An epic multiplayer 3D game built on the Sui blockchain testnet, featuring real-time combat, leaderboards, and WebSocket synchronization.

## Features

- **3D Battle Arena**: React Three Fiber powered 3D game engine with stunning visuals
- **Blockchain Integration**: Sui Move smart contracts for game logic and state management
- **Real-time Multiplayer**: WebSocket-based synchronization for seamless multiplayer gameplay
- **Wallet Integration**: Sui wallet connection for blockchain transactions
- **Advanced Physics**: Collision detection, gravity, impulse-based movement
- **Chat System**: In-game communication with AI-powered game guide
- **AI Assistant**: Groq LLM provides real-time game strategies and tips
- **Leaderboards**: Global rankings with real-time updates
- **NFT Inventory**: Support for NFT-based equipment and cosmetics

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **3D Engine**: React Three Fiber, Three.js
- **Blockchain**: Sui Move, @mysten/sui SDK
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4 with custom neon theme
- **Real-time**: WebSocket for multiplayer sync
- **AI**: Groq LLM for game guidance
- **Physics**: Custom physics engine with collision detection

## Prerequisites

- Node.js 20+ 
- npm or yarn
- Sui Wallet extension (for blockchain interaction)
- Groq API Key (for AI features) - [Get it here](https://console.groq.com)

## Installation

### 1. Clone and Install

\`\`\`bash
git clone https://github.com/siabang35/sui_multigame
cd sui_multigame
npm install
\`\`\`

### 2. Setup Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Update the following variables:
- \`NEXT_PUBLIC_SUI_NETWORK\`: Set to "testnet"
- \`NEXT_PUBLIC_WS_URL\`: Your WebSocket server URL
- \`NEXT_PUBLIC_GAME_PACKAGE_ID\`: Your deployed Sui package ID
- \`GROQ_API_KEY\`: Your Groq API key for AI features

### 3. Deploy Smart Contracts (Optional)

If deploying your own contracts:

\`\`\`bash
cd move
sui move publish --network testnet
\`\`\`

Note the Package ID and update it in \`.env.local\`.

## Running the Game

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

The game will be available at \`http://localhost:3000\`

### Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Game Controls

- **W/A/S/D**: Move
- **Space**: Jump
- **Left Mouse Button**: Attack
- **E**: Special Ability (Heal)
- **Tab**: View Leaderboard
- **T**: Toggle Chat/AI Guide
- **Click AI Guide Tab**: Ask AI for strategies and tips

## AI Game Guide

The in-game AI assistant powered by Groq provides:

### Available Topics
- **Strategies**: Combat tactics and positioning tips
- **Controls**: Keyboard shortcuts and control reference
- **Combat**: How to maximize damage and survive longer
- **Abilities**: Special moves and cooldown management
- **Ranking**: Tips to climb the leaderboard
- **Game Mechanics**: Understanding health, armor, and damage

### How to Use

1. Open the Chat panel (bottom-left corner)
2. Click the **AI Guide** tab
3. Type your question (e.g., "How do I win fights?")
4. The AI will respond with helpful tips and strategies
5. Conversation history is maintained for context-aware responses

### Example Questions

- "What's the best strategy for PvP?"
- "How do I use abilities effectively?"
- "How can I improve my ranking?"
- "What are the combat mechanics?"
- "Give me tips for survival"

## Architecture

### Frontend Structure

\`\`\`
app/
├── page.tsx                 # Main game page
├── layout.tsx              # Root layout with fonts & global styles
├── globals.css             # Design tokens & utilities
└── api/
    └── groq-ai/
        └── chat/route.ts   # Groq AI chat API

components/
├── game/                    # 3D game components
│   ├── game-scene.tsx      # Main 3D scene
│   ├── player-model.tsx    # Player 3D models
│   ├── game-environment.tsx # Arena and obstacles
│   ├── game-hud.tsx        # In-game UI overlay
│   ├── game-controller.tsx  # Game loop provider
│   └── chat-system.tsx     # Chat + AI Guide (UPDATED)
├── dashboard/              # Dashboard UI
│   ├── main-dashboard.tsx  # Main lobby interface
│   └── player-profile.tsx  # Player stats
├── blockchain/             # Blockchain integration
│   ├── wallet-connect.tsx  # Wallet connection UI
│   ├── game-browser.tsx    # Game list and joining
│   └── transaction-monitor.tsx
└── game-sync/              # Real-time multiplayer
    ├── game-sync-provider.tsx
    └── connection-status-bar.tsx

lib/
├── game-state.ts           # Zustand store for game state
├── game-input-manager.ts   # Input handling
├── game-physics.ts         # Physics engine
├── game-controller.ts      # Game logic controller
├── sui-client.ts           # Sui blockchain client
├── sui-game-service.ts     # Smart contract interactions
├── websocket-manager.ts    # WebSocket management
├── multiplayer-sync.ts     # Real-time sync logic
└── optimization-utils.ts   # Performance optimizations

hooks/
├── use-groq-ai.ts          # Groq AI hook (NEW)
├── use-blockchain-game-data.ts
└── use-sui-wallet.ts

move/
├── sources/
│   └── game.move           # Sui Move smart contracts
└── Move.toml
\`\`\`

### Blockchain Smart Contracts

The game uses Sui Move contracts to handle:
- Game creation and management
- Player state (position, health, score, kills/deaths)
- Combat mechanics (attack, damage, kills)
- Leaderboard updates
- Respawn logic

All game state transitions are atomic and immutable on the blockchain.

### AI Chat System

The chat system now includes two tabs:

**Chat Tab**: Player-to-player communication with system messages
**AI Guide Tab**: Real-time AI assistance powered by Groq

The AI guide provides:
- Context-aware responses based on conversation history
- Game-specific knowledge about mechanics, strategies, and tips
- Conversational tone to enhance player engagement
- Helpful guidance for new and experienced players

## Deployment to Vercel

### 1. Connect Repository

\`\`\`bash
vercel link
\`\`\`

### 2. Set Environment Variables

In Vercel dashboard, add:
- \`NEXT_PUBLIC_SUI_NETWORK=testnet\`
- \`NEXT_PUBLIC_WS_URL=your_ws_url\`
- \`NEXT_PUBLIC_GAME_PACKAGE_ID=your_package_id\`
- \`GROQ_API_KEY=your_groq_api_key\`

### 3. Deploy

\`\`\`bash
vercel deploy
\`\`\`

Or use Git integration for automatic deployments.

## Getting Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or login
3. Create a new API key
4. Copy the key and add it to your \`.env.local\` file as \`GROQ_API_KEY\`

The Groq API is free for development with generous rate limits.

## WebSocket Server Setup

The game requires a WebSocket server for real-time multiplayer sync. Example server implementation:

\`\`\`typescript
// Example: Express + Socket.IO server
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const io = new Server(app, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-move', (data) => {
    io.emit('player-move', data);
  });

  socket.on('player-attack', (data) => {
    io.emit('player-attack', data);
  });

  socket.on('disconnect', () => {
    io.emit('player-leave', { playerId: socket.id });
  });
});

app.listen(8080, () => console.log('Server running on port 8080'));
\`\`\`

## Performance Optimizations

- **Code Splitting**: Dynamic imports for components
- **Image Optimization**: WebP and AVIF formats
- **Object Pooling**: Reuse physics objects
- **Message Batching**: Batch WebSocket messages
- **Lazy Loading**: Components load on demand
- **Memoization**: React component optimization

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- All wallet interactions are client-side
- Smart contracts are audited on Sui testnet
- WebSocket connections use WSS (encrypted)
- Input validation on all game actions
- Rate limiting on blockchain transactions
- Groq API key stored server-side only

## Performance Monitoring

Enable performance monitoring with:

\`\`\`typescript
import { performanceMonitor } from '@/lib/performance-monitor';

performanceMonitor?.trackWebVitals();
performanceMonitor?.logMetrics();
\`\`\`

## Troubleshooting

### AI Guide Not Responding
- Verify \`GROQ_API_KEY\` is set in environment variables
- Check Groq API status at console.groq.com
- Review browser console for API errors
- Ensure API key has appropriate permissions

### Wallet Connection Issues
- Ensure Sui Wallet extension is installed and connected to testnet
- Check browser console for error messages
- Refresh page and try again

### WebSocket Connection Issues
- Verify \`NEXT_PUBLIC_WS_URL\` environment variable is set
- Check WebSocket server is running
- Look for CORS errors in browser console

### 3D Scene Not Rendering
- Check WebGL support in browser
- Verify Three.js is loaded correctly
- Check browser console for GPU-related errors

### Performance Issues
- Reduce graphics quality in settings
- Lower max player count
- Check network latency (PING)
- Monitor FPS in connection status bar

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review error messages in browser console
- Ask the AI Guide in-game for help

## Roadmap

- [ ] NFT marketplace integration
- [ ] Custom character cosmetics
- [ ] Ranked matchmaking system
- [ ] Team-based game modes
- [ ] Mobile app support
- [ ] Advanced analytics dashboard
- [ ] Replay system
- [ ] Modding support
- [ ] Multi-language AI Guide support
- [ ] Tournament system

## Credits

Built with love for the Sui blockchain community. Powered by Groq AI for next-gen gaming guidance.
