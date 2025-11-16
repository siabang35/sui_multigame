'use client';

import React from 'react';

interface PlayerStats {
  username: string;
  level: number;
  totalGames: number;
  wins: number;
  kills: number;
  deaths: number;
  winRate: number;
  kda: number;
}

export function PlayerProfile({ stats }: { stats: PlayerStats }) {
  return (
    <div className="stat-box space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan-box">
          <span className="text-2xl font-bold text-primary-foreground">P</span>
        </div>
        <div>
          <div className="text-xl font-bold text-primary glow-cyan">{stats.username}</div>
          <div className="text-sm text-muted-foreground">Level {stats.level}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Total Games" value={stats.totalGames} />
        <StatItem label="Wins" value={stats.wins} highlight="accent" />
        <StatItem label="Kills" value={stats.kills} highlight="secondary" />
        <StatItem label="Deaths" value={stats.deaths} highlight="destructive" />
        <StatItem label="Win Rate" value={`${stats.winRate}%`} highlight="primary" />
        <StatItem label="K/D Ratio" value={stats.kda.toFixed(2)} highlight="accent" />
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = 'muted-foreground',
}: {
  label: string;
  value: string | number;
  highlight?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-bold text-${highlight}`}>{value}</div>
    </div>
  );
}
