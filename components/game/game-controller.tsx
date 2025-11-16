'use client';

import { useEffect, useRef } from 'react';
import { MultiplayerGameController } from '@/lib/game-controller';

export function GameControllerProvider({ children }: { children: React.ReactNode }) {
  const controllerRef = useRef<MultiplayerGameController | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Hindari double init di React Strict Mode (Dev Mode)
    let isMounted = true;

    // Initialize controller
    controllerRef.current = new MultiplayerGameController();

    let lastTime = Date.now();

    const gameLoop = () => {
      if (!isMounted) return;

      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      if (controllerRef.current) {
        controllerRef.current.update(Math.min(deltaTime, 0.016)); // 60 FPS cap
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isMounted = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Optional: cleanup controller
      controllerRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
