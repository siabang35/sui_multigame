'use client';

import React from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-blood', title: 'First Blood', description: 'Get your first kill', icon: '🔴', unlocked: true },
  { id: 'double-kill', title: 'Double Kill', description: 'Kill 2 enemies in 5 seconds', icon: '⚡', unlocked: true },
  { id: 'rampage', title: 'Rampage', description: 'Get 10 kills in one game', icon: '🌟', unlocked: false, progress: 6 },
  { id: 'survivor', title: 'Survivor', description: 'Win 10 games', icon: '🛡️', unlocked: false, progress: 7 },
  { id: 'headshot', title: 'Precision Strike', description: 'Get 5 headshots', icon: '🎯', unlocked: false, progress: 3 },
  { id: 'unstoppable', title: 'Unstoppable', description: 'Win 5 consecutive games', icon: '💎', unlocked: false, progress: 2 },
];

export function AchievementBadges() {
  return (
    <div className="stat-box space-y-4">
      <div className="text-lg font-bold text-primary glow-cyan">Achievements</div>

      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
              achievement.unlocked
                ? 'border-primary/50 bg-primary/10'
                : 'border-muted/30 bg-muted/5'
            }`}
          >
            <div className="text-2xl mb-2">{achievement.icon}</div>
            <div className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{achievement.title}</div>

            {!achievement.unlocked && achievement.progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-muted/30 rounded h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(achievement.progress / 10) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{achievement.progress}/10</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
