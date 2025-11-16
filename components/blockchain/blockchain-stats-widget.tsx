'use client';

import React from 'react';
import { useBlockchainStats, useWalletBalance } from '@/hooks/use-blockchain-stats';

export function BlockchainStatsWidget() {
  const { stats, loading: statsLoading } = useBlockchainStats();
  const { balance, loading: balanceLoading } = useWalletBalance();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* Total Games */}
      <div className="stat-box">
        <div className="text-xs text-muted-foreground font-mono mb-2">TOTAL GAMES</div>
        <div className="text-2xl font-bold text-primary glow-cyan">
          {statsLoading ? '...' : stats.totalGames}
        </div>
        <div className="text-xs text-muted-foreground mt-1">On-chain</div>
      </div>

      {/* Active Players */}
      <div className="stat-box">
        <div className="text-xs text-muted-foreground font-mono mb-2">ACTIVE PLAYERS</div>
        <div className="text-2xl font-bold text-accent">
          {statsLoading ? '...' : stats.activePlayers}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Playing now</div>
      </div>

      {/* Network Latency */}
      <div className="stat-box">
        <div className="text-xs text-muted-foreground font-mono mb-2">LATENCY</div>
        <div className={`text-2xl font-bold ${
          stats.networkLatency < 500 ? 'text-green-500' :
          stats.networkLatency < 1000 ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {statsLoading ? '...' : `${stats.networkLatency}ms`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Response time</div>
      </div>

      {/* Wallet Balance */}
      <div className="stat-box">
        <div className="text-xs text-muted-foreground font-mono mb-2">BALANCE</div>
        <div className="text-2xl font-bold text-secondary">
          {balanceLoading ? '...' : `${balance?.toFixed(2) || '0'}`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">SUI</div>
      </div>
    </div>
  );
}
