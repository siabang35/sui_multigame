'use client';

import React, { useState, useEffect } from 'react';
import { suiGameService } from '@/lib/sui-game-service';
import { useGameStore } from '@/lib/game-state';
import { BlockchainTransactionStatus } from './realtime-sync-monitor';
import { useJoinGame } from '@/hooks/use-join-game';
import { multiplayerSync } from '@/lib/multiplayer-sync';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface GameSession {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isActive: boolean;
  creator: string;
  createdAt: number;
}

export function GameBrowser() {
  const [games, setGames] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameSession | null>(null);
  const [username, setUsername] = useState('Player');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  const setGameState = useGameStore((state) => state.setGameState);
  const addPendingTransaction = useGameStore((state) => state.addPendingTransaction);
  const addOtherPlayer = useGameStore((state) => state.addOtherPlayer);

  const { joinGame } = useJoinGame();
  const currentAccount = useCurrentAccount();

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const gamesList = await suiGameService.getAllGames();

        const formattedGames: GameSession[] = gamesList.map((game: any) => ({
          id: game.id,
          name: game.name || 'Unnamed Game',
          playerCount: game.playerCount || 0,
          maxPlayers: game.maxPlayers || 32,
          isActive: game.isActive,
          creator: game.creator ? `${game.creator.slice(0, 6)}...${game.creator.slice(-4)}` : '0x0...0x0',
          createdAt: game.createdAt || 0,
        }));

        setGames(formattedGames);
        console.log('[] Loaded', formattedGames.length, 'games from blockchain');
      } catch (error) {
        console.error('[] Failed to load games:', error);
        setJoinError('Failed to load games from blockchain');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
    const interval = setInterval(loadGames, 10000);
    return () => clearInterval(interval);
  }, []);

  // Real-time subscription for game events
  useEffect(() => {
    const subscribeToGameEvents = async () => {
      try {
        const unsubscribe = suiGameService.subscribeToGameEvents(
          'global',
          (event: any) => {
            console.log('[] Game event received:', event.type);

            if (event.type === 'PlayerJoined') {
              setGames((prevGames) =>
                prevGames.map((game) =>
                  game.id === event.data.game_id
                    ? { ...game, playerCount: game.playerCount + 1 }
                    : game
                )
              );
            } else if (event.type === 'GameCreated') {
              const newGame: GameSession = {
                id: event.data.game_id,
                name: Buffer.from(event.data.name).toString('utf-8') || 'New Game',
                playerCount: 0,
                maxPlayers: event.data.max_players || 32,
                isActive: true,
                creator: event.data.creator ? `${event.data.creator.slice(0, 6)}...${event.data.creator.slice(-4)}` : '0x0...0x0',
                createdAt: event.data.timestamp || Date.now(),
              };
              setGames((prevGames) => [newGame, ...prevGames]);
              console.log('[] New game added to list:', newGame.name);
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('[] Error subscribing to game events:', error);
      }
    };

    let cleanup: (() => void) | undefined;
    subscribeToGameEvents().then((fn) => {
      cleanup = fn;
    });

    return () => cleanup?.();
  }, []);

  const handleJoinGame = async (game: GameSession) => {
    try {
      if (!username.trim()) {
        setJoinError('Please enter a username');
        return;
      }

      setJoiningGameId(game.id);
      setJoinError(null);

      console.log('[] Joining game:', game.id, 'as', username);

      // Use the Dapp Kit hook to join the game
      const result = await joinGame(game.id, username);
      console.log('[] Join transaction result:', result);

      // Add to pending transactions for monitoring
      addPendingTransaction(result.digest, 'join_game');

      // Wait a bit more for transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Fetch updated player data - use current account from Dapp Kit
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const playerData = await suiGameService.getPlayerByAddress(game.id, currentAccount.address);
      console.log('[] Fetched player data after join:', playerData);

      if (!playerData) {
        throw new Error('Failed to retrieve player data after joining. Please try again.');
      }

      // Set game state with current player data
      setGameState({
        gameId: game.id,
        gameName: game.name,
        isActive: game.isActive,
        playerCount: game.playerCount + 1,
        maxPlayers: game.maxPlayers,
        currentPlayer: {
          id: playerData.id,
          address: playerData.address,
          username: playerData.username,
          x: playerData.x || 0,
          y: playerData.y || 0,
          z: playerData.z || 0,
          health: playerData.health || 100,
          score: playerData.score || 0,
          kills: playerData.kills || 0,
          deaths: playerData.deaths || 0,
          isAlive: playerData.isAlive !== false,
          syncStatus: 'synced',
        },
      });

      // Update blockchain sync status
      useGameStore.getState().updateBlockchainSync('connected');

      // Connect multiplayer sync for realtime gameplay (skip if no WebSocket URL)
      if (multiplayerSync && process.env.NEXT_PUBLIC_WS_URL) {
        console.log('[] Attempting multiplayer sync connection...');
        // Don't await - let it connect in background
        multiplayerSync.connect(playerData.id, game.id).then(() => {
          console.log('[] Multiplayer sync connected for game:', game.id);
        }).catch((syncError) => {
          console.warn('[] Multiplayer sync connection failed, continuing without real-time sync:', syncError);
        });
      } else {
        console.log('[] Skipping multiplayer sync - no WebSocket URL configured');
      }

      console.log('[] Game joined successfully, transitioning to game view');
      setSelectedGame(null);
      setJoiningGameId(null);
    } catch (error) {
      console.error('[] Failed to join game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game';
      setJoinError(errorMessage);
      setJoiningGameId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold text-primary glow-cyan">Available Games</div>

      {loading ? (
        <div className="stat-box flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-muted-foreground text-sm">Fetching games from blockchain...</p>
          </div>
        </div>
      ) : games.length === 0 ? (
        <div className="stat-box text-center py-8">
          <p className="text-muted-foreground text-sm">No games available. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((game) => (
            <div
              key={game.id}
              className="stat-box flex justify-between items-center group cursor-pointer hover:border-primary/80 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-primary truncate">{game.name}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  Creator: {game.creator}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Players: {game.playerCount}/{game.maxPlayers}
                </div>
                <div className="w-full bg-background rounded h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${(game.playerCount / game.maxPlayers) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedGame(game);
                  setJoinError(null);
                }}
                disabled={game.playerCount >= game.maxPlayers || joiningGameId === game.id}
                className="button-neon text-xs ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningGameId === game.id
                  ? 'JOINING...'
                  : game.playerCount >= game.maxPlayers
                    ? 'FULL'
                    : 'JOIN'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Join Dialog */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="stat-box max-w-md w-full mx-4 space-y-4">
            <div>
              <div className="text-lg font-bold text-primary glow-cyan">{selectedGame.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Enter your username to join the battle
              </div>
            </div>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              maxLength={20}
              className="w-full bg-background border border-primary/30 rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30"
              autoFocus
            />

            {joinError && (
              <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                {joinError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedGame(null);
                  setJoinError(null);
                }}
                className="flex-1 px-4 py-2 border border-primary/30 rounded text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleJoinGame(selectedGame)}
                disabled={joiningGameId === selectedGame.id}
                className="flex-1 button-neon text-sm disabled:opacity-50"
              >
                {joiningGameId === selectedGame.id ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
