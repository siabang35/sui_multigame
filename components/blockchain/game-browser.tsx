'use client';

import React, { useState, useEffect } from 'react';
import { suiGameService } from '@/lib/sui-game-service';
import { useGameStore } from '@/lib/game-state';
import { BlockchainTransactionStatus } from './realtime-sync-monitor';
import { useJoinGame } from '@/hooks/use-join-game';

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
  const { joinGame } = useJoinGame();

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

  useEffect(() => {
    const subscribeToGameEvents = async () => {
      if (games.length === 0) return;

      try {
        const unsubscribe = suiGameService.subscribeToGameEvents(
          games[0].id,
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
  }, [games.length, games[0]?.id]);

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

      // Add to pending transactions for monitoring
      addPendingTransaction(result.digest, 'join_game');

      setGameState({
        gameId: game.id,
        gameName: game.name,
        isActive: game.isActive,
        playerCount: game.playerCount + 1,
        maxPlayers: game.maxPlayers,
      });

      console.log('[] Join game transaction submitted:', result.digest);
      setSelectedGame(null);
    } catch (error) {
      console.error('[] Failed to join game:', error);
      setJoinError(error instanceof Error ? error.message : 'Failed to join game');
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
