'use client';

import React from 'react';
import { GameSyncProvider } from '@/components/game/game-sync-provider';
import { GameControllerProvider } from '@/components/game/game-controller';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GameControllerProvider>
      <GameSyncProvider>
        {children}
      </GameSyncProvider>
    </GameControllerProvider>
  );
}
