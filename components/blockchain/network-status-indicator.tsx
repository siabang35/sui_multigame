'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-state';

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';

export function NetworkStatusIndicator() {
  const blockchainStatus = useGameStore((state) => state.game.blockchainSyncStatus);
  const pendingTxCount = useGameStore((state) => state.game.pendingTransactions.length);
  const [timeoutStatus, setTimeoutStatus] = useState<'stable' | 'slow' | 'unstable'>('stable');

  useEffect(() => {
    // Simulate network quality indicator
    const updateInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        setTimeoutStatus('slow');
      } else if (Math.random() < 0.05) {
        setTimeoutStatus('unstable');
      } else {
        setTimeoutStatus('stable');
      }
    }, 5000);

    return () => clearInterval(updateInterval);
  }, []);

  const getStatusColor = () => {
    switch (blockchainStatus) {
      case 'connected':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'syncing':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'disconnected':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getStatusColor()} font-mono text-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold uppercase">{blockchainStatus}</span>
        <span className={`w-2 h-2 rounded-full ${
          blockchainStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          blockchainStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
          'bg-red-500'
        }`}></span>
      </div>

      <div className="text-xs space-y-1 opacity-80">
        <div>Network: {SUI_NETWORK.toUpperCase()}</div>
        <div>RPC: {SUI_RPC_URL}</div>
        {timeoutStatus !== 'stable' && (
          <div>Status: {timeoutStatus.toUpperCase()}</div>
        )}
        {pendingTxCount > 0 && (
          <div>Pending: {pendingTxCount} transaction{pendingTxCount !== 1 ? 's' : ''}</div>
        )}
      </div>
    </div>
  );
}
