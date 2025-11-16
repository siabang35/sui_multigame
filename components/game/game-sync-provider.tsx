'use client';

import React, { useEffect, useRef } from 'react';
import { multiplayerSync } from '@/lib/multiplayer-sync';
import { useGameStore } from '@/lib/game-state';

export function GameSyncProvider({ children }: { children: React.ReactNode }) {
  const initializeRef = useRef(false);

  useEffect(() => {
    if (initializeRef.current) return;
    initializeRef.current = true;

    const gameState = useGameStore.getState();
    if (gameState.game.gameId && gameState.game.currentPlayer && multiplayerSync) {
      multiplayerSync
        .connect(gameState.game.currentPlayer.id, gameState.game.gameId)
        .catch(console.error);

      return () => {
        multiplayerSync?.disconnect();
      };
    }
  }, []);

  return children;
}
