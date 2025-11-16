# MULTIPLY - Blockchain Integration Setup Guide

This guide will help you set up the complete real-time blockchain integration for the MULTIPLY game on Sui testnet.

## Prerequisites

Before starting, ensure you have:

- Node.js 20+ and npm installed
- Sui CLI installed (`brew install sui` on macOS)
- Sui Wallet extension installed in your browser
- A testnet account with some SUI tokens (get from faucet)

## Step 1: Deploy Smart Contracts

### 1.1 Navigate to Move directory

\`\`\`bash
cd move
\`\`\`

### 1.2 Build the contracts

\`\`\`bash
sui move build
\`\`\`

### 1.3 Publish to testnet

\`\`\`bash
sui client publish --network testnet --gas-budget 100000000
\`\`\`

This will output a Package ID. Save this - you'll need it in the environment setup.

Example output:
\`\`\`
----- Transaction Digest ----
5K7w7...

----- Published Objects ----
  ID: 0x1234567890abcdef... (Package ID)
\`\`\`

## Step 2: Environment Configuration

### 2.1 Update .env.local

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

### 2.2 Edit .env.local

\`\`\`env
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_SUI_GAME_PACKAGE_ID=0x1234567890abcdef  # Your package ID from step 1.3

# Game Configuration
NEXT_PUBLIC_MAX_PLAYERS=100
NEXT_PUBLIC_GAME_TICK_RATE=100
NEXT_PUBLIC_ARENA_SIZE=200

# Event Stream Configuration
NEXT_PUBLIC_EVENT_POLL_INTERVAL=2000
NEXT_PUBLIC_MAX_RETRY_ATTEMPTS=5

# WebSocket (for production multiplayer)
NEXT_PUBLIC_WS_URL=wss://api.multiply.game/ws

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
\`\`\`

## Step 3: Install Dependencies

\`\`\`bash
npm install
\`\`\`

## Step 4: Configure Sui Wallet

### 4.1 Install Sui Wallet Extension

- Chrome: [Sui Wallet - Chrome Web Store](https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobapgai)
- Firefox: [Sui Wallet - Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/sui-wallet/)

### 4.2 Switch to Testnet

1. Open Sui Wallet extension
2. Click the network selector (top right)
3. Select "Testnet"
4. Import or create an account

### 4.3 Get Testnet SUI

Visit the [Sui Testnet Faucet](https://faucet.testnet.sui.io/) and request test coins.

## Step 5: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

The game will be available at `http://localhost:3000`

## Step 6: Test Blockchain Integration

### 6.1 Connect Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet" button
3. Approve the connection in Sui Wallet
4. You should see your address and balance displayed

### 6.2 Check Blockchain Events

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs like `[v0] Fetched X events from blockchain`
4. This confirms event streaming is working

### 6.3 Create a Game

1. In lobby, fill in game name and max players
2. Click "Create Game"
3. Approve transaction in Sui Wallet
4. Check the transaction monitor for confirmation
5. Game should appear in "Browse Games" after confirmation

### 6.4 Join a Game

1. Click "Browse Games"
2. Select an active game
3. Enter username
4. Click "Join Game"
5. Approve transaction in Sui Wallet
6. Game should start once transaction is confirmed

## Step 7: Monitor Real-time Blockchain Sync

The game includes several real-time monitoring features:

### Real-time Sync Monitor (Bottom Right)
- Shows blockchain connection status
- Displays network signal quality
- Shows pending transactions
- Updates in real-time

### Connection Status Bar (Top Right)
- Blockchain sync status
- Time since last sync
- FPS counter
- Active player count
- Pending transactions count

### Transaction Monitor
- Access via TX MONITOR button
- Shows transaction history
- Displays transaction status (pending/success/failed)
- Timestamps for all transactions

## Step 8: Production Deployment to Vercel

### 8.1 Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit: MULTIPLY blockchain game"
git branch -M main
git remote add origin https://github.com/yourusername/multiply-game.git
git push -u origin main
\`\`\`

### 8.2 Deploy to Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### 8.3 Set Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables:

\`\`\`
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_SUI_GAME_PACKAGE_ID=0x1234567890abcdef
NEXT_PUBLIC_WS_URL=https://your-ws-server.com/ws
NEXT_PUBLIC_EVENT_POLL_INTERVAL=2000
NEXT_PUBLIC_MAX_RETRY_ATTEMPTS=5
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
\`\`\`

### 8.4 Deploy

\`\`\`bash
vercel deploy --prod
\`\`\`

## Step 9: WebSocket Server Setup (Optional)

For production multiplayer with low-latency sync, deploy a WebSocket server:

### 9.1 Example Node.js Server

\`\`\`typescript
// server.ts
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*' }
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-move', (data) => {
    socket.broadcast.emit('player-move', data);
  });

  socket.on('player-attack', (data) => {
    socket.broadcast.emit('player-attack', data);
  });

  socket.on('chat-message', (data) => {
    io.emit('chat-message', data);
  });

  socket.on('disconnect', () => {
    io.emit('player-left', { playerId: socket.id });
  });
});

httpServer.listen(8080, () => {
  console.log('WebSocket server running on port 8080');
});
\`\`\`

### 9.2 Deploy Server

Use services like:
- Railway.app
- Heroku
- DigitalOcean
- AWS EC2

Update `NEXT_PUBLIC_WS_URL` in environment variables after deployment.

## Troubleshooting

### Wallet Connection Issues

**Problem**: "Sui Wallet not installed"
- **Solution**: Install Sui Wallet extension and refresh page

**Problem**: Wrong network
- **Solution**: Ensure Sui Wallet is set to Testnet network

### Package ID Not Found

**Problem**: "Contract not found on blockchain"
- **Solution**: 
  1. Verify Package ID in `.env.local`
  2. Ensure contract was published to testnet (not devnet)
  3. Check testnet explorer: https://suiscan.xyz/testnet

### Events Not Streaming

**Problem**: No blockchain events received
- **Solution**:
  1. Check browser console for errors
  2. Verify `NEXT_PUBLIC_EVENT_POLL_INTERVAL` is set
  3. Check Sui RPC URL is correct
  4. Try manual refresh in game

### Transaction Failures

**Problem**: "Transaction failed"
- **Solution**:
  1. Check gas budget is sufficient
  2. Ensure wallet has enough SUI
  3. Check testnet faucet for more coins
  4. Verify contract parameters

## Performance Tips

### Frontend Optimization

1. **Reduce Event Poll Interval**
   - Lower `NEXT_PUBLIC_EVENT_POLL_INTERVAL` for faster updates
   - Trade-off: More API calls to Sui RPC

2. **Enable Graphics Optimization**
   - Set graphics quality to "Medium" for better FPS
   - Disable particle effects if needed

3. **Monitor Network Latency**
   - Watch the sync status indicator
   - Optimal latency: < 500ms

### Blockchain Optimization

1. **Batch Transactions**
   - Combine multiple moves into single transaction
   - Reduces transaction count and gas costs

2. **Use Object Pooling**
   - Reuse game objects instead of creating new ones
   - Reduces garbage collection pauses

## Advanced Configuration

### Custom RPC Endpoint

To use a custom Sui RPC endpoint:

\`\`\`env
NEXT_PUBLIC_SUI_RPC_URL=https://your-custom-rpc.com
\`\`\`

### Enable Debug Logging

For development, enable detailed logs:

\`\`\`env
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
\`\`\`

Watch browser console for `[v0]` prefixed logs.

## Security Best Practices

1. **Private Keys**: Never expose private keys in environment variables
2. **RPC Endpoints**: Use reliable, audited RPC providers
3. **Smart Contracts**: Ensure contracts are audited before production
4. **Rate Limiting**: Implement rate limiting on API routes
5. **Input Validation**: Validate all user inputs before blockchain interaction

## Support and Resources

- [Sui Documentation](https://docs.sui.io/)
- [Sui Move Docs](https://docs.sui.io/concepts/sui-move-concepts)
- [TypeScript SDK](https://sdk.sui.io/)
- [Sui Discord](https://discord.gg/sui)

## Next Steps

1. Deploy your WebSocket server for real-time multiplayer
2. Integrate NFT marketplace for equipment trading
3. Add leaderboard persistence to blockchain
4. Implement ranked matchmaking system
5. Set up analytics and monitoring
