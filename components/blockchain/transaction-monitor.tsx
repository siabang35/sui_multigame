'use client';

import React, { useState, useEffect } from 'react';
import { suiGameService } from '@/lib/sui-game-service';
import { useGameStore } from '@/lib/game-state';
import { BlockchainTransactionStatus } from './realtime-sync-monitor';

interface TransactionLog {
  digest: string;
  type: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

export function TransactionMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [manualTransactions, setManualTransactions] = useState<TransactionLog[]>([]);
  const pendingTxs = useGameStore((state) => state.game.pendingTransactions);

  const handleTransactionComplete = (digest: string, status: 'success' | 'failed') => {
    setManualTransactions((prev) => {
      const existing = prev.find((tx) => tx.digest === digest);
      if (existing) {
        return prev.map((tx) =>
          tx.digest === digest ? { ...tx, status } : tx
        );
      }
      return [
        ...prev,
        {
          digest,
          type: 'transaction',
          status,
          timestamp: Date.now(),
        },
      ];
    });
  };

  const allTransactions = [...pendingTxs.map((tx) => ({
    digest: tx.digest,
    type: tx.type,
    status: 'pending' as const,
    timestamp: tx.timestamp,
  })), ...manualTransactions];

  const sortedTransactions = allTransactions.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="button-neon text-sm flex items-center gap-2"
      >
        <span>TX MONITOR</span>
        {pendingTxs.length > 0 && (
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
        )}
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="stat-box absolute top-full mt-2 right-0 w-96 z-50">
          <div className="text-xs text-muted-foreground font-mono mb-4 flex justify-between items-center">
            <span>TRANSACTION HISTORY</span>
            <span className="text-primary">{sortedTransactions.length}</span>
          </div>

          {sortedTransactions.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedTransactions.map((tx) => (
                <div
                  key={tx.digest}
                  className={`border rounded px-3 py-2 text-xs font-mono transition-all ${
                    tx.status === 'pending'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : tx.status === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">{tx.type}</span>
                    <span className={
                      tx.status === 'pending'
                        ? 'text-yellow-500'
                        : tx.status === 'success'
                          ? 'text-green-500'
                          : 'text-red-500'
                    }>
                      {tx.status === 'pending' && '⏳'}
                      {tx.status === 'success' && '✓'}
                      {tx.status === 'failed' && '✗'}
                    </span>
                  </div>
                  <div className="text-muted-foreground truncate">
                    {tx.digest.slice(0, 20)}...
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-primary/30 mt-4 pt-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-xs px-3 py-2 bg-primary/20 hover:bg-primary/30 rounded text-primary transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
