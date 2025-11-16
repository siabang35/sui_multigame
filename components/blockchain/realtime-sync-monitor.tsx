'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-state';

export function RealtimeSyncMonitor() {
  const gameState = useGameStore((state) => state.game);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  useEffect(() => {
    // Update connection quality setiap 5 detik
    const interval = setInterval(() => {
      const timeSinceSync = Date.now() - gameState.lastBlockchainSync;
      
      if (timeSinceSync < 3000) {
        setConnectionQuality('excellent');
      } else if (timeSinceSync < 10000) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('poor');
      }
      
      setLastSyncTime(timeSinceSync);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.lastBlockchainSync]);

  const getStatusColor = () => {
    switch (gameState.blockchainSyncStatus) {
      case 'connected':
        return 'text-green-500';
      case 'syncing':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getQualityIndicator = () => {
    switch (connectionQuality) {
      case 'excellent':
        return '███';
      case 'good':
        return '██░';
      case 'poor':
        return '█░░';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/80 border border-cyan-500/50 rounded-lg p-3 font-mono text-xs max-w-sm">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="text-gray-400">
              Blockchain: <span className={getStatusColor()}>{gameState.blockchainSyncStatus}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Signal: </span>
            <span className={connectionQuality === 'excellent' ? 'text-green-500' : connectionQuality === 'good' ? 'text-yellow-500' : 'text-red-500'}>
              {getQualityIndicator()}
            </span>
          </div>

          <div className="text-gray-500">
            Last sync: {lastSyncTime < 1000 ? 'now' : `${Math.round(lastSyncTime / 1000)}s ago`}
          </div>

          {gameState.pendingTransactions.length > 0 && (
            <div className="text-cyan-400 mt-2">
              Pending txs: {gameState.pendingTransactions.length}
            </div>
          )}
        </div>

        {/* Transaction list */}
        {gameState.pendingTransactions.length > 0 && (
          <div className="ml-4 pl-4 border-l border-cyan-500/30 max-h-32 overflow-y-auto">
            {gameState.pendingTransactions.map((tx) => (
              <div key={tx.digest} className="text-cyan-400 text-xs mb-1 truncate">
                {tx.type}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BlockchainTransactionStatus({ digest }: { digest: string }) {
  const { status, loading } = require('@/hooks/use-blockchain-game-data').useTransactionStatus(digest);
  const removeTransaction = useGameStore((state) => state.removePendingTransaction);

  useEffect(() => {
    if (status === 'success' || status === 'failed') {
      // Auto-remove setelah 5 detik
      const timer = setTimeout(() => {
        removeTransaction(digest);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, digest, removeTransaction]);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 border-yellow-500/50',
    success: 'bg-green-500/20 border-green-500/50',
    failed: 'bg-red-500/20 border-red-500/50',
  };

  const statusIcons: Record<string, string> = {
    pending: '⏳',
    success: '✓',
    failed: '✗',
  };

  return (
    <div className={`border rounded px-3 py-2 text-sm font-mono flex items-center gap-2 ${statusColors[status] || 'bg-gray-500/20 border-gray-500/50'}`}>
      <span>{statusIcons[status] || '?'}</span>
      <span className="truncate">{digest.slice(0, 16)}...</span>
    </div>
  );
}
