'use client';

import { useRef, useEffect } from 'react';
import { MultiplayerGameController } from '@/lib/game-controller';

export function useGameController() {
  const controllerRef = useRef<MultiplayerGameController | null>(null);

  useEffect(() => {
    controllerRef.current = new MultiplayerGameController();

    return () => {
      // Cleanup
    };
  }, []);

  return controllerRef.current;
}
