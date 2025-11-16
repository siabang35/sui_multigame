import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface PlayerState {
  id: string;
  address: string;
  username: string;
  x: number;
  y: number;
  z: number;
  health: number;
  score: number;
  kills: number;
  deaths: number;
  isAlive: boolean;
  blockchainDigest?: string;
  syncStatus: 'synced' | 'syncing' | 'out-of-sync';
}

export interface GameState {
  gameId: string | null;
  gameName: string;
  isActive: boolean;
  playerCount: number;
  maxPlayers: number;
  currentPlayer: PlayerState | null;
  otherPlayers: PlayerState[];
  leaderboard: Array<{ address: string; score: number }>;
  blockchainSyncStatus: 'connected' | 'disconnected' | 'syncing';
  lastBlockchainSync: number;
  pendingTransactions: Array<{ digest: string; type: string; timestamp: number }>;
}

export const useGameStore = create<
  {
    game: GameState;
    updatePlayerPosition: (x: number, y: number, z: number) => void;
    updatePlayerHealth: (health: number) => void;
    addOtherPlayer: (player: PlayerState) => void;
    removeOtherPlayer: (id: string) => void;
    setGameState: (state: Partial<GameState>) => void;
    updateLeaderboard: (leaderboard: Array<{ address: string; score: number }>) => void;
    syncPlayerFromBlockchain: (player: PlayerState) => void;
    updateBlockchainSync: (status: GameState['blockchainSyncStatus']) => void;
    addPendingTransaction: (digest: string, type: string) => void;
    removePendingTransaction: (digest: string) => void;
    updatePlayerSyncStatus: (playerId: string, status: 'synced' | 'syncing' | 'out-of-sync') => void;
  },
  [["zustand/subscribeWithSelector", never]]
>(
  subscribeWithSelector((set) => ({
    game: {
      gameId: null,
      gameName: '',
      isActive: false,
      playerCount: 0,
      maxPlayers: 0,
      currentPlayer: null,
      otherPlayers: [],
      leaderboard: [],
      blockchainSyncStatus: 'disconnected',
      lastBlockchainSync: 0,
      pendingTransactions: [],
    },
    updatePlayerPosition: (x, y, z) =>
      set((state) => ({
        game: {
          ...state.game,
          currentPlayer: state.game.currentPlayer
            ? { ...state.game.currentPlayer, x, y, z }
            : null,
        },
      })),
    updatePlayerHealth: (health) =>
      set((state) => ({
        game: {
          ...state.game,
          currentPlayer: state.game.currentPlayer
            ? { ...state.game.currentPlayer, health }
            : null,
        },
      })),
    addOtherPlayer: (player) =>
      set((state) => ({
        game: {
          ...state.game,
          otherPlayers: [...state.game.otherPlayers, player],
        },
      })),
    removeOtherPlayer: (id) =>
      set((state) => ({
        game: {
          ...state.game,
          otherPlayers: state.game.otherPlayers.filter((p) => p.id !== id),
        },
      })),
    setGameState: (newState) =>
      set((state) => ({
        game: { ...state.game, ...newState },
      })),
    updateLeaderboard: (leaderboard) =>
      set((state) => ({
        game: {
          ...state.game,
          leaderboard,
        },
      })),
    syncPlayerFromBlockchain: (player) =>
      set((state) => ({
        game: {
          ...state.game,
          otherPlayers: state.game.otherPlayers.map((p) =>
            p.id === player.id ? { ...player, syncStatus: 'synced' } : p
          ),
        },
      })),
    updateBlockchainSync: (status) =>
      set((state) => ({
        game: {
          ...state.game,
          blockchainSyncStatus: status,
          lastBlockchainSync: status === 'connected' ? Date.now() : state.game.lastBlockchainSync,
        },
      })),
    addPendingTransaction: (digest, type) =>
      set((state) => ({
        game: {
          ...state.game,
          pendingTransactions: [
            ...state.game.pendingTransactions,
            { digest, type, timestamp: Date.now() },
          ],
        },
      })),
    removePendingTransaction: (digest) =>
      set((state) => ({
        game: {
          ...state.game,
          pendingTransactions: state.game.pendingTransactions.filter((tx) => tx.digest !== digest),
        },
      })),
    updatePlayerSyncStatus: (playerId, status) =>
      set((state) => {
        const updated = state.game.currentPlayer?.id === playerId
          ? { ...state.game.currentPlayer, syncStatus: status }
          : state.game.currentPlayer;
        
        return {
          game: {
            ...state.game,
            currentPlayer: updated,
          },
        };
      }),
  }))
);
