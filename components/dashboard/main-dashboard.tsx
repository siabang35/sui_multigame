'use client';

import React, { useState, useEffect } from 'react';
import { GameScene } from '@/components/game/game-scene';
import { GameHUD } from '@/components/game/game-hud';
import { WalletConnect } from '@/components/blockchain/wallet-connect';
import { GameBrowser } from '@/components/blockchain/game-browser';
import { TransactionMonitor } from '@/components/blockchain/transaction-monitor';
import { ThemeToggle } from '@/components/theme-provider';
import { useGameStore } from '@/lib/game-state';
import { useGamesList } from '@/hooks/use-blockchain-game-data';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useIsMobile } from '@/components/ui/use-mobile';
import { Menu, X } from 'lucide-react';

type DashboardView = 'lobby' | 'game' | 'inventory' | 'settings';

export function MainDashboard() {
  const [view, setView] = useState<DashboardView>('lobby');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const gameState = useGameStore((state) => state.game);
  const isInGame = !!gameState.gameId;
  const { games } = useGamesList();
  const isMobile = useIsMobile();

  // Dapp Kit hooks
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  if (isInGame) {
    return (
      <div className="w-screen h-screen bg-background text-foreground overflow-hidden">
        <GameScene isMultiplayer={true} />
        <GameHUD />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-primary/30 bg-gradient-to-r from-background via-background to-background/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between scan-line">
        <div className="flex items-center gap-2 md:gap-4">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <div className="text-xl md:text-2xl font-black glow-cyan">Rory Legend</div>
          <div className="hidden sm:block text-xs text-muted-foreground">Sui Blockchain Battle Arena</div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <WalletConnect />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Navigation */}
        <aside className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-64'
        } bg-card/30 border-r border-primary/30 backdrop-blur-sm p-4 overflow-y-auto`}>
          <nav className="space-y-2">
            {[
              { id: 'lobby', label: 'Lobby', icon: '🏠' },
              { id: 'game', label: 'Game Browser', icon: '🎮' },
              { id: 'inventory', label: 'Inventory', icon: '💼' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as DashboardView);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  view === item.id
                    ? 'bg-primary text-primary-foreground glow-cyan-box shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-105'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 space-y-3 pt-8 border-t border-primary/30">
            <div className="text-xs text-muted-foreground font-mono mb-4">STATS</div>

            <div className="stat-box hover:scale-105 transition-transform duration-200">
              <div className="text-xs text-muted-foreground">Total Games</div>
              <div className="text-lg font-bold text-primary">
                {games?.length || 0}
              </div>
            </div>

            <div className="stat-box hover:scale-105 transition-transform duration-200">
              <div className="text-xs text-muted-foreground">Active Players</div>
              <div className="text-lg font-bold text-accent">
                {games?.reduce((total: number, game: any) => total + (game.playerCount || 0), 0) || 0}
              </div>
            </div>

            <div className="stat-box hover:scale-105 transition-transform duration-200">
              <div className="text-xs text-muted-foreground">Network</div>
              <div className="text-lg font-bold text-secondary">
                {process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {view === 'lobby' && <LobbyView />}
            {view === 'game' && <GameBrowserView />}
            {view === 'inventory' && <InventoryView />}
            {view === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function LobbyView() {
  const [isCreating, setIsCreating] = useState(false);
  const [gameName, setGameName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [createError, setCreateError] = useState<string | null>(null);
  const { games } = useGamesList();
  const addPendingTransaction = useGameStore((state) => state.addPendingTransaction);
  const isMobile = useIsMobile();

  // Dapp Kit hooks for game creation
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Calculate real stats from blockchain data
  const totalGames = games?.length || 0;
  const totalPlayers = games?.reduce((total: number, game: any) => total + (game.playerCount || 0), 0) || 0;

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      setCreateError('Please enter a game name');
      return;
    }

    if (!currentAccount) {
      setCreateError('Please connect your wallet first');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      console.log('Creating game:', gameName, 'max players:', maxPlayers);

      const tx = new Transaction();
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_SUI_GAME_PACKAGE_ID}::game::create_game`,
        arguments: [
          tx.pure.string(gameName),
          tx.pure.u64(maxPlayers),
          tx.object('0x6'),
        ],
      });

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Game creation transaction sent:', result.digest);
            addPendingTransaction(result.digest, 'create_game');

            // Reset form
            setGameName('');
            setMaxPlayers(8);
            setIsCreating(false);
          },
          onError: (error) => {
            console.error('Failed to create game:', error);
            setCreateError(error instanceof Error ? error.message : 'Failed to create game');
            setIsCreating(false);
          },
        }
      );
    } catch (error) {
      console.error('Failed to create game:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create game');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold glow-cyan mb-2">Welcome to Rory Legend Game</h2>
        <p className="text-muted-foreground text-sm md:text-base">The decentralized multiplayer arena powered by Sui blockchain</p>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4 md:gap-6'}`}>
        <div className="stat-box hover:scale-105 transition-transform duration-200">
          <div className="text-sm text-muted-foreground mb-3">Online Players</div>
          <div className="text-2xl md:text-3xl font-bold text-primary glow-cyan">{totalPlayers.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-2">Across {totalGames} games</div>
        </div>

        <div className="stat-box hover:scale-105 transition-transform duration-200">
          <div className="text-sm text-muted-foreground mb-3">Active Games</div>
          <div className="text-2xl md:text-3xl font-bold text-accent">{totalGames}</div>
          <div className="text-xs text-muted-foreground mt-2">Waiting for players</div>
        </div>
      </div>

      <div className="stat-box space-y-4 hover:scale-105 transition-transform duration-200">
        <div className="text-lg font-bold text-primary">Create New Game</div>

        <div>
          <label className="text-sm text-muted-foreground block mb-2">Game Name</label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Enter game name"
            className="w-full bg-background border border-primary/30 rounded px-3 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all duration-200 hover:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-2">Max Players</label>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
            className="w-full bg-background border border-primary/30 rounded px-3 py-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all duration-200 hover:border-primary/50"
          >
            {[4, 8, 16, 32, 64].map((num) => (
              <option key={num} value={num}>
                {num} Players
              </option>
            ))}
          </select>
        </div>

        {createError && (
          <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/30 rounded px-3 py-2 animate-pulse">
            {createError}
          </div>
        )}

        <button
          onClick={handleCreateGame}
          disabled={!gameName.trim() || isCreating}
          className="button-neon w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-base font-semibold"
        >
          {isCreating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </div>
          ) : (
            'Create Game'
          )}
        </button>
      </div>
    </div>
  );
}

function GameBrowserView() {
  const { games, loading, error } = useGamesList();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold glow-cyan mb-2">Browse Games</h2>
        <p className="text-muted-foreground">Find and join active games from Sui blockchain</p>
      </div>

      {loading && (
        <div className="stat-box flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-muted-foreground">Loading games from blockchain...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="stat-box bg-red-500/10 border-red-500/30">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <GameBrowser />
    </div>
  );
}

function InventoryView() {
  const items = [
    { id: 1, name: 'Plasma Sword', rarity: 'Legendary', power: 85 },
    { id: 2, name: 'Energy Shield', rarity: 'Rare', power: 65 },
    { id: 3, name: 'Speed Boost', rarity: 'Common', power: 40 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold glow-cyan mb-2">Inventory</h2>
        <p className="text-muted-foreground">Your NFT assets and equipment</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="stat-box group cursor-pointer hover:border-primary/80">
            <div className="mb-2 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center text-4xl">
              ⚔️
            </div>
            <div className="text-sm font-semibold text-primary mb-1">{item.name}</div>
            <div className={`text-xs font-bold mb-2 ${
              item.rarity === 'Legendary' ? 'text-accent' :
              item.rarity === 'Rare' ? 'text-secondary' : 'text-muted-foreground'
            }`}>
              {item.rarity}
            </div>
            <div className="text-xs text-muted-foreground">Power: {item.power}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  const [settings, setSettings] = useState({
    masterVolume: 80,
    musicVolume: 60,
    sfxVolume: 80,
    enableChatNotifications: true,
    enableVibration: true,
    graphicsQuality: 'high',
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold glow-cyan mb-2">Settings</h2>
        <p className="text-muted-foreground">Customize your game experience</p>
      </div>

      <div className="stat-box space-y-6">
        {/* Audio Settings */}
        <div>
          <h3 className="font-semibold text-primary mb-4">Audio</h3>
          <div className="space-y-3 pl-4 border-l border-primary/30">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-muted-foreground">Master Volume</label>
                <span className="text-sm text-primary font-bold">{settings.masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.masterVolume}
                onChange={(e) => setSettings({ ...settings, masterVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-muted-foreground">Music Volume</label>
                <span className="text-sm text-primary font-bold">{settings.musicVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(e) => setSettings({ ...settings, musicVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-muted-foreground">SFX Volume</label>
                <span className="text-sm text-primary font-bold">{settings.sfxVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(e) => setSettings({ ...settings, sfxVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Graphics Settings */}
        <div>
          <h3 className="font-semibold text-primary mb-4">Graphics</h3>
          <div className="space-y-3 pl-4 border-l border-primary/30">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Quality</label>
              <select
                value={settings.graphicsQuality}
                onChange={(e) => setSettings({ ...settings, graphicsQuality: e.target.value })}
                className="w-full bg-background border border-primary/30 rounded px-3 py-2 text-sm text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="font-semibold text-primary mb-4">Notifications</h3>
          <div className="space-y-3 pl-4 border-l border-primary/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableChatNotifications}
                onChange={(e) => setSettings({ ...settings, enableChatNotifications: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-muted-foreground">Enable Chat Notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableVibration}
                onChange={(e) => setSettings({ ...settings, enableVibration: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-muted-foreground">Enable Vibration Feedback</span>
            </label>
          </div>
        </div>
      </div>

      <button className="button-neon w-full">Save Settings</button>
    </div>
  );
}
