# Rory Legend - Blockchain Multiplayer 3D Battle Arena

An **epic multiplayer 3D game** built on the **Sui blockchain testnet**, featuring real-time combat, leaderboards, and WebSocket synchronization.

---

## Features

- **3D Battle Arena**: React Three Fiber powered 3D game engine with stunning visuals.
- **Blockchain Integration**: Sui Move smart contracts for game logic and state management.
- **Real-time Multiplayer**: WebSocket-based synchronization for seamless gameplay.
- **Wallet Integration**: Connect Sui wallet for blockchain transactions.
- **Advanced Physics**: Collision detection, gravity, and impulse-based movement.
- **Chat System**: In-game communication with AI-powered game guide.
- **AI Assistant**: Groq LLM provides real-time game strategies and tips.
- **Leaderboards**: Global rankings with real-time updates.
- **NFT Inventory**: Support for NFT-based equipment and cosmetics.

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **3D Engine**: React Three Fiber, Three.js
- **Blockchain**: Sui Move, `@mysten/sui` SDK
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4 with custom neon theme
- **Real-time Sync**: WebSocket
- **AI**: Groq LLM
- **Physics**: Custom physics engine with collision detection

---

## Prerequisites

- Node.js 20+
- npm or yarn
- Sui Wallet extension (for blockchain interaction)
- Groq API Key (for AI features) — [Get it here](https://console.groq.com)

---

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/siabang35/sui_multigame
cd sui_multigame
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.local.example .env.local
```

Update `.env.local` variables:

- `NEXT_PUBLIC_SUI_NETWORK`: "testnet"
- `NEXT_PUBLIC_WS_URL`: Your WebSocket server URL
- `NEXT_PUBLIC_GAME_PACKAGE_ID`: Your deployed Sui package ID
- `GROQ_API_KEY`: Your Groq API key

### 3. Deploy Smart Contracts (Optional)

```bash
cd move
sui move publish --network testnet
```

Note the **Package ID** and update it in `.env.local`.

---

## Running the Game

### Development Mode

```bash
npm run dev
```

Access the game at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## Game Controls

| Action                | Key/Button |
|-----------------------|------------|
| Move                  | W/A/S/D    |
| Jump                  | Space      |
| Attack                | Left Mouse |
| Special Ability (Heal)| E          |
| View Leaderboard      | Tab        |
| Toggle Chat/AI Guide  | T          |
| Ask AI for Strategy   | AI Guide Tab → Type question |

---

## AI Game Guide

### Available Topics

- **Strategies**: Combat tactics and positioning tips
- **Controls**: Keyboard shortcuts and control reference
- **Combat**: Maximize damage and survival
- **Abilities**: Special moves and cooldowns
- **Ranking**: Tips to climb the leaderboard
- **Game Mechanics**: Health, armor, damage

### How to Use

1. Open the **Chat panel** (bottom-left)
2. Click **AI Guide** tab
3. Type your question (e.g., "How do I win fights?")
4. AI responds with context-aware strategies
5. Conversation history is maintained

### Example Questions

- "What's the best strategy for PvP?"
- "How do I use abilities effectively?"
- "How can I improve my ranking?"
- "What are the combat mechanics?"
- "Give me tips for survival"

---

## Architecture

### Frontend Structure

```
app/
├── page.tsx                 # Main game page
├── layout.tsx               # Root layout
├── globals.css              # Design tokens & utilities
└── api/groq-ai/chat/route.ts

components/
├── game/
│   ├── game-scene.tsx
│   ├── player-model.tsx
│   ├── game-environment.tsx
│   ├── game-hud.tsx
│   ├── game-controller.tsx
│   └── chat-system.tsx
├── dashboard/
│   ├── main-dashboard.tsx
│   └── player-profile.tsx
├── blockchain/
│   ├── wallet-connect.tsx
│   ├── game-browser.tsx
│   └── transaction-monitor.tsx
└── game-sync/
    ├── game-sync-provider.tsx
    └── connection-status-bar.tsx

lib/
├── game-state.ts
├── game-input-manager.ts
├── game-physics.ts
├── game-controller.ts
├── sui-client.ts
├── sui-game-service.ts
├── websocket-manager.ts
├── multiplayer-sync.ts
└── optimization-utils.ts

hooks/
├── use-groq-ai.ts
├── use-blockchain-game-data.ts
└── use-sui-wallet.ts

move/
├── sources/game.move
└── Move.toml
```

### Blockchain Smart Contracts

- Game creation & management
- Player state: position, health, score, kills/deaths
- Combat mechanics: attack, damage, kills
- Leaderboard updates
- Respawn logic

All state transitions are atomic and immutable on the blockchain.

### AI Chat System

- **Chat Tab**: Player-to-player messages
- **AI Guide Tab**: Real-time AI assistance powered by Groq
- Context-aware responses and game-specific guidance

---

## Deployment to Vercel

```bash
vercel link
```

Set environment variables in Vercel dashboard:

- `NEXT_PUBLIC_SUI_NETWORK=testnet`
- `NEXT_PUBLIC_WS_URL=your_ws_url`
- `NEXT_PUBLIC_GAME_PACKAGE_ID=your_package_id`
- `GROQ_API_KEY=your_groq_api_key`

Deploy:

```bash
vercel deploy
```

---

## WebSocket Server Setup

```typescript
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const io = new Server(app, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-move', (data) => io.emit('player-move', data));
  socket.on('player-attack', (data) => io.emit('player-attack', data));
  socket.on('disconnect', () => io.emit('player-leave', { playerId: socket.id }));
});

app.listen(8080, () => console.log('Server running on port 8080'));
```

---

## Performance Optimizations

- Code Splitting & Dynamic Imports
- Image Optimization (WebP, AVIF)
- Object Pooling
- WebSocket Message Batching
- Lazy Loading Components
- Memoization of React Components

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Security Considerations

- Client-side wallet interactions
- Audited Sui smart contracts
- WSS (encrypted WebSocket)
- Input validation on all actions
- Rate limiting for blockchain transactions
- Server-side Groq API key storage

---

## Troubleshooting

### AI Guide Not Responding
- Verify `GROQ_API_KEY`
- Check Groq API status
- Inspect browser console for errors

### Wallet Connection Issues
- Ensure Sui Wallet installed and connected to testnet
- Refresh page
- Check console for errors

### WebSocket Issues
- Verify `NEXT_PUBLIC_WS_URL`
- Ensure WebSocket server is running
- Check CORS errors

### 3D Scene Not Rendering
- Verify WebGL support
- Ensure Three.js loaded
- Check GPU console errors

### Performance Issues
- Reduce graphics quality
- Lower max player count
- Check network latency (PING)
- Monitor FPS via status bar

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

---

## License

MIT

---

## Support

- Open an issue on GitHub
- Check documentation
- Review browser console errors
- Ask AI Guide in-game

---

## Roadmap

- [ ] NFT marketplace integration
- [ ] Custom character cosmetics
- [ ] Ranked matchmaking
- [ ] Team-based modes
- [ ] Mobile support
- [ ] Analytics dashboard
- [ ] Replay system
- [ ] Modding support
- [ ] Multi-language AI Guide
- [ ] Tournament system

---

## Credits

Built with love for the Sui blockchain community. Powered by **Groq AI** for next-gen gaming guidance.
