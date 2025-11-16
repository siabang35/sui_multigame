'use client';

import { create } from 'zustand';

export interface ConnectionState {
  isConnected: boolean;
  latency: number;
  players: number;
  fps: number;
  setConnected: (connected: boolean) => void;
  setLatency: (latency: number) => void;
  setPlayers: (count: number) => void;
  setFPS: (fps: number) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: false,
  latency: 0,
  players: 0,
  fps: 60,
  setConnected: (connected) => set({ isConnected: connected }),
  setLatency: (latency) => set({ latency }),
  setPlayers: (players) => set({ players }),
  setFPS: (fps) => set({ fps }),
}));
