'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-state';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ConnectionStatusBar() {
  const gameState = useGameStore((state) => state.game);
  const [fps, setFps] = useState(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [timeSinceLastSync, setTimeSinceLastSync] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = Date.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = Date.now();
      const delta = currentTime - lastTime;

      if (delta >= 1000) {
        setFps(frameCount);
        setFpsHistory((prev) => [...prev.slice(-59), frameCount]);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    const fpsInterval = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(fpsInterval);
  }, []);

  // Update time since last sync every second
  useEffect(() => {
    const updateTime = () => {
      setTimeSinceLastSync(Date.now() - gameState.lastBlockchainSync);
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [gameState.lastBlockchainSync]);

  const avgFps = fpsHistory.length > 0
    ? Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
    : 60;

  const blockchainConnected = gameState.blockchainSyncStatus === 'connected';
  const isSyncing = gameState.blockchainSyncStatus === 'syncing';

  return (
    <div className="fixed top-16 right-0 md:top-20 md:right-0 z-10">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="stat-box p-1.5 md:p-2 hover:scale-105 transition-transform duration-200 pointer-events-auto"
        aria-label={isExpanded ? 'Hide connection status' : 'Show connection status'}
      >
        {isExpanded ? (
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-primary" />
        ) : (
          <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 text-primary" />
        )}
      </button>

      {/* Status Panel */}
      {isExpanded && (
        <div className="absolute top-0 right-8 md:right-10 space-y-0.5 md:space-y-1 pointer-events-auto text-[9px] md:text-xs font-mono max-w-[100px] md:max-w-[120px]">
          {/* Blockchain Status */}
          <div className={`stat-box flex items-center gap-0.5 md:gap-1 px-1.5 py-0.5 md:px-2 md:py-1 ${
            blockchainConnected ? 'border-green-500/50' :
            isSyncing ? 'border-yellow-500/50' :
            'border-red-500/50'
          }`}>
            <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${
              blockchainConnected ? 'bg-green-500 glow-cyan' :
              isSyncing ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-muted-foreground text-[8px] md:text-[10px]">BC:</span>
            <span className={
              blockchainConnected ? 'text-green-500 font-bold' :
              isSyncing ? 'text-yellow-500 font-bold' :
              'text-red-500 font-bold'
            }>
              {gameState.blockchainSyncStatus.toUpperCase()}
            </span>
          </div>

          {/* Network Latency */}
          <div className="stat-box px-1.5 py-0.5 md:px-2 md:py-1">
            <span className="text-muted-foreground text-[8px] md:text-[10px]">SYNC:</span>
            <span className={`ml-0.5 md:ml-1 font-bold text-[8px] md:text-[10px] ${
              timeSinceLastSync > 30000 ? 'text-red-500' :
              timeSinceLastSync > 10000 ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {timeSinceLastSync < 1000 ? 'now' : `${Math.round(timeSinceLastSync / 1000)}s`}
            </span>
          </div>

          {/* FPS */}
          <div className="stat-box px-1.5 py-0.5 md:px-2 md:py-1">
            <span className="text-muted-foreground text-[8px] md:text-[10px]">FPS:</span>
            <span className={`ml-0.5 md:ml-1 font-bold text-[8px] md:text-[10px] ${
              fps < 30 ? 'text-red-500' :
              fps < 50 ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {fps}
            </span>
          </div>

          {/* Players Count */}
          <div className="stat-box px-1.5 py-0.5 md:px-2 md:py-1">
            <span className="text-muted-foreground text-[8px] md:text-[10px]">PLAYERS:</span>
            <span className="ml-0.5 md:ml-1 font-bold text-accent text-[8px] md:text-[10px]">{gameState.playerCount}</span>
          </div>

          {/* Pending Transactions */}
          {gameState.pendingTransactions.length > 0 && (
            <div className="stat-box bg-yellow-500/10 border-yellow-500/30 px-1.5 py-0.5 md:px-2 md:py-1">
              <span className="text-muted-foreground text-[8px] md:text-[10px]">TX:</span>
              <span className="ml-0.5 md:ml-1 font-bold text-yellow-500 text-[8px] md:text-[10px]">
                {gameState.pendingTransactions.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
