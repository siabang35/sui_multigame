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
    if (gameState.game.gameId && gameState.game.currentPlayer?.id && multiplayerSync !== null) {
      console.log('[] GameSyncProvider: Connecting multiplayer sync for player:', gameState.game.currentPlayer.username);

      // Add a small delay to ensure game state is fully set
      setTimeout(() => {
        if (multiplayerSync) {
          multiplayerSync
            .connect(gameState.game.currentPlayer!.id, gameState.game.gameId!)
            .then(() => {
              console.log('[] GameSyncProvider: Multiplayer sync connected successfully');
            })
            .catch((error) => {
              console.error('[] GameSyncProvider: Failed to connect multiplayer sync:', error);
              // Don't treat this as a fatal error - game can still work without WebSocket
            });
        }
      }, 3000); // Increased delay to ensure game state is stable

      return () => {
        console.log('[] GameSyncProvider: Disconnecting multiplayer sync');
        if (multiplayerSync) {
          multiplayerSync.disconnect();
        }
      };
    }
  }, []);

  return children;
}
