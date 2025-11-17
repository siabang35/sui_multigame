'use client';

import { useRef, useEffect } from 'react';
import { MultiplayerGameController } from '@/lib/game-controller';

export function useGameController() {
  const controllerRef = useRef<MultiplayerGameController>(new MultiplayerGameController());

  useEffect(() => {
    // Controller is already initialized in useRef
    return () => {
      // Cleanup if needed
    };
  }, []);

  return controllerRef.current;
}
