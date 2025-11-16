'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-state';
import { useIsMobile } from '@/components/ui/use-mobile';

export function GameHUD() {
  const gameState = useGameStore((state) => state.game);
  const player = gameState.currentPlayer;
  const isMobile = useIsMobile();

  if (!player) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top HUD Bar - Mobile responsive */}
      <div className={`absolute top-0 left-0 right-0 ${isMobile ? 'h-12' : 'h-16'} bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-md border-b border-primary/30 scan-line flex justify-between items-center ${isMobile ? 'px-3' : 'px-6'} pointer-events-auto`}>
        <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div>
            <div className={`text-primary font-bold glow-cyan ${isMobile ? 'text-sm' : 'text-base'}`}>MULTIPLY</div>
            <div className="text-xs text-muted-foreground">BATTLE ARENA</div>
          </div>
        </div>

        <div className={`flex items-center ${isMobile ? 'gap-4' : 'gap-8'}`}>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">PING</div>
            <div className={`font-mono text-primary ${isMobile ? 'text-xs' : 'text-sm'}`}>12ms</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">FPS</div>
            <div className={`font-mono text-primary ${isMobile ? 'text-xs' : 'text-sm'}`}>60</div>
          </div>
        </div>
      </div>

      {/* Left Panel - Player Stats - Mobile responsive */}
      <div className={`absolute ${isMobile ? 'left-2 top-16' : 'left-4 top-20'} space-y-2 pointer-events-auto`}>
        <StatBox
          label="HEALTH"
          value={player.health}
          max={100}
          color="text-primary"
          isMobile={isMobile}
        />
        <StatBox
          label="ARMOR"
          value={75}
          max={100}
          color="text-accent"
          isMobile={isMobile}
        />
        <StatBox
          label="SHIELD"
          value={50}
          max={100}
          color="text-secondary"
          isMobile={isMobile}
        />
      </div>

      {/* Right Panel - Scores - Mobile responsive */}
      <div className={`absolute ${isMobile ? 'right-2 top-16' : 'right-4 top-20'} space-y-2 pointer-events-auto`}>
        <div className={`stat-box ${isMobile ? 'w-24' : 'w-32'}`}>
          <div className="text-xs text-muted-foreground">SCORE</div>
          <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-primary glow-cyan`}>{player.score}</div>
        </div>
        <div className={`stat-box ${isMobile ? 'w-24' : 'w-32'}`}>
          <div className="text-xs text-muted-foreground">KILLS</div>
          <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-accent`}>{player.kills}</div>
        </div>
        <div className={`stat-box ${isMobile ? 'w-24' : 'w-32'}`}>
          <div className="text-xs text-muted-foreground">DEATHS</div>
          <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-destructive`}>{player.deaths}</div>
        </div>
      </div>

      {/* Bottom Right - Controls - Mobile responsive */}
      <div className={`absolute ${isMobile ? 'bottom-2 right-2' : 'bottom-4 right-4'} space-y-2 pointer-events-auto`}>
        <div className={`text-muted-foreground text-right mb-3 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>CONTROLS</div>
        <div className={`space-y-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          <div><span className="text-primary">W/A/S/D</span> - Move</div>
          <div><span className="text-primary">SPACE</span> - Jump</div>
          <div><span className="text-primary">LMB</span> - Attack</div>
          <div><span className="text-primary">E</span> - Special</div>
        </div>
      </div>

      {/* Bottom Left - Minimap - Mobile responsive */}
      <div className={`absolute ${isMobile ? 'bottom-2 left-2' : 'bottom-4 left-4'} pointer-events-auto`}>
        <Minimap />
      </div>

      {/* Center - Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Crosshair />
      </div>

      {/* Leaderboard */}
      <Leaderboard />
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
  max: number;
  color: string;
  isMobile?: boolean;
}

function StatBox({ label, value, max, color, isMobile = false }: StatBoxProps) {
  const percentage = (value / max) * 100;

  return (
    <div className={`stat-box ${isMobile ? 'w-32' : 'w-48'}`}>
      <div className="flex justify-between items-center mb-1">
        <div className={`text-xs text-muted-foreground font-mono ${isMobile ? 'text-[10px]' : ''}`}>{label}</div>
        <div className={`font-bold ${color} ${isMobile ? 'text-xs' : 'text-sm'}`}>{value}/{max}</div>
      </div>
      <div className={`w-full bg-card/50 rounded ${isMobile ? 'h-1.5' : 'h-2'} overflow-hidden border border-primary/30`}>
        <div
          className={`h-full bg-gradient-to-r from-primary to-accent transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Minimap() {
  const gameState = useGameStore((state) => state.game);
  const isMobile = useIsMobile();

  return (
    <div className={`stat-box ${isMobile ? 'w-24 h-24 p-1' : 'w-32 h-32 p-2'}`}>
      <div className={`text-muted-foreground font-mono mb-2 ${isMobile ? 'text-[8px]' : 'text-xs'}`}>MINIMAP</div>
      <div className={`w-full ${isMobile ? 'h-16' : 'h-20'} bg-background/80 border border-primary/50 rounded relative overflow-hidden`}>
        {/* Player position */}
        {gameState.currentPlayer && (
          <div
            className="absolute w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 glow-cyan-box"
            style={{
              left: `${(gameState.currentPlayer.x / 200) * 100}%`,
              top: `${(gameState.currentPlayer.z / 200) * 100}%`,
            }}
          />
        )}

        {/* Other players */}
        {gameState.otherPlayers.map((player) => (
          <div
            key={player.id}
            className={`absolute ${isMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              left: `${(player.x / 200) * 100}%`,
              top: `${(player.z / 200) * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Crosshair() {
  return (
    <div className="relative w-8 h-8">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-primary"></div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-primary"></div>
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-0.5 bg-primary"></div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-0.5 bg-primary"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-accent rounded-full"></div>
    </div>
  );
}

function Leaderboard() {
  const gameState = useGameStore((state) => state.game);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="button-neon text-sm"
      >
        LEADERBOARD {isOpen ? '▼' : '▶'}
      </button>

      {isOpen && (
        <div className="stat-box mt-2 max-w-md">
          <div className="text-xs text-muted-foreground font-mono mb-3">TOP 10 PLAYERS</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {gameState.leaderboard.slice(0, 10).map((entry, index) => (
              <div key={entry.address} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold w-6">#{index + 1}</span>
                  <span className="text-muted-foreground truncate">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </span>
                </div>
                <span className="text-accent font-bold">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
