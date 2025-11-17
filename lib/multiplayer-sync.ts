'use client';

import { WebSocketManager, GameMessage, MessageType } from './websocket-manager';
import { useGameStore, PlayerState } from './game-state';

export class MultiplayerSync {
  private wsManager: WebSocketManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime = 0;
  private syncInterval_MS = 100; // Sync every 100ms (10 times per second)

  constructor(wsUrl: string) {
    this.wsManager = new WebSocketManager(wsUrl);
    // Only setup listeners if we have a valid WebSocket URL
    if (wsUrl && !wsUrl.includes('dummy-url')) {
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    // Player movement sync - now from blockchain events
    this.wsManager.on('player-move', (message: GameMessage) => {
      const { x, y, z, playerId } = message.data;

      const otherPlayers = useGameStore.getState().game.otherPlayers;
      const existingPlayer = otherPlayers.find((p) => p.id === playerId);

      if (existingPlayer) {
        // Update existing player position
        useGameStore.getState().addOtherPlayer({
          ...existingPlayer,
          x,
          y,
          z,
          syncStatus: 'synced',
        });
      }
    });

    // Player attack sync - now from blockchain events
    this.wsManager.on('player-attack', (message: GameMessage) => {
      const { attackerId, targetId, damage } = message.data;

      const otherPlayers = useGameStore.getState().game.otherPlayers;
      const target = otherPlayers.find((p) => p.id === targetId);

      if (target && target.isAlive) {
        const newHealth = Math.max(0, target.health - damage);
        const isAlive = newHealth > 0;

        useGameStore.getState().addOtherPlayer({
          ...target,
          health: newHealth,
          isAlive,
          syncStatus: 'synced',
        });
      }
    });

    // Player respawn sync - now from blockchain events
    this.wsManager.on('player-respawn', (message: GameMessage) => {
      const { playerId } = message.data;

      const otherPlayers = useGameStore.getState().game.otherPlayers;
      const player = otherPlayers.find((p) => p.id === playerId);

      if (player) {
        useGameStore.getState().addOtherPlayer({
          ...player,
          health: 100,
          isAlive: true,
          x: 50,
          y: 0,
          z: 50,
          syncStatus: 'synced',
        });
      }
    });

    // Leaderboard update - now from blockchain events
    this.wsManager.on('leaderboard-update', (message: GameMessage) => {
      const { leaderboard } = message.data;
      useGameStore.getState().updateLeaderboard(leaderboard);
    });

    // Player join - now from blockchain events
    this.wsManager.on('player-join', (message: GameMessage) => {
      const newPlayer = message.data as PlayerState;
      useGameStore.getState().addOtherPlayer({
        ...newPlayer,
        syncStatus: 'synced',
      });
    });

    // Player leave - now from blockchain events
    this.wsManager.on('player-leave', (message: GameMessage) => {
      const { playerId } = message.data;
      useGameStore.getState().removeOtherPlayer(playerId);
    });
  }

  async connect(playerId: string, gameId: string): Promise<void> {
    await this.wsManager.connect(playerId, gameId);
    this.startSync(playerId, gameId);
  }

  private startSync(playerId: string, gameId: string): void {
    this.syncInterval = setInterval(() => {
      const gameState = useGameStore.getState();
      const player = gameState.game.currentPlayer;

      if (player && this.shouldSync()) {
        // Sync player position
        this.wsManager.send({
          type: 'player-move',
          playerId,
          gameId,
          timestamp: Date.now(),
          data: {
            playerId: player.id,
            x: player.x,
            y: player.y,
            z: player.z,
          },
        });

        this.lastSyncTime = Date.now();
      }
    }, this.syncInterval_MS);
  }

  private shouldSync(): boolean {
    return Date.now() - this.lastSyncTime >= this.syncInterval_MS;
  }

  sendPlayerAttack(attackerId: string, targetId: string, gameId: string, damage: number): void {
    this.wsManager.send({
      type: 'player-attack',
      playerId: attackerId,
      gameId,
      timestamp: Date.now(),
      data: {
        attackerId,
        targetId,
        damage,
      },
    });
  }

  sendPlayerRespawn(playerId: string, gameId: string): void {
    this.wsManager.send({
      type: 'player-respawn',
      playerId,
      gameId,
      timestamp: Date.now(),
      data: { playerId },
    });
  }

  sendChatMessage(playerId: string, gameId: string, message: string): void {
    this.wsManager.send({
      type: 'chat-message',
      playerId,
      gameId,
      timestamp: Date.now(),
      data: { message },
    });
  }

  disconnect(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.wsManager.disconnect();
  }

  isConnected(): boolean {
    return this.wsManager.isConnectedStatus();
  }
}

export const multiplayerSync = typeof window !== 'undefined'
  ? new MultiplayerSync('ws://dummy-url-that-wont-connect')
  : null;
