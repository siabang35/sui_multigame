'use client';

import React, { useEffect } from 'react';
import { MainDashboard } from '@/components/dashboard/main-dashboard';
import { ConnectionStatusBar } from '@/components/game/connection-status-bar';
import { ChatSystem } from '@/components/game/chat-system';
import { logStartupInfo } from '@/lib/startup-logger';
import { RealtimeSyncMonitor } from '@/components/blockchain/realtime-sync-monitor';
import { useGameStore } from '@/lib/game-state';

export default function Home() {
  useEffect(() => {
    logStartupInfo();
    
    const gameStore = useGameStore.getState();
    gameStore.updateBlockchainSync('connected');
    
    console.log('MULTIPLY game initialized with blockchain integration');
  }, []);

  return (
    <main className="w-screen h-screen bg-background text-foreground overflow-hidden">
      <MainDashboard />
      <ConnectionStatusBar />
      <ChatSystem />
      <RealtimeSyncMonitor />
    </main>
  );
}
