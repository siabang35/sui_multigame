'use client';

import React, { useEffect, useState } from 'react';
import { suiGameService } from '@/lib/sui-game-service';
import { useGameStore } from '@/lib/game-state';

interface GameListing {
  id: string;
  name: string;
  creator: string;
  playerCount: number;
  maxPlayers: number;
  isActive: boolean;
  createdAt: number;
  joinedPlayers: string[];
}

export function GameBrowserRealtime() {
  const [games, setGames] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setGameState = useGameStore((state) => state.setGameState);
  const addPendingTransaction = useGameStore((state) => state.addPendingTransaction);

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      try {
        setLoading(true);
        
        // Fetch initial games
        const gamesList = await suiGameService.getAllGames();
        const gameListings: GameListing[] = gamesList.map((game: any) => ({
          id: game.id,
          name: game.name,
          creator: game.creator,
          playerCount: game.playerCount,
          maxPlayers: game.maxPlayers,
          isActive: game.isActive,
          createdAt: game.createdAt,
          joinedPlayers: [],
        }));

        setGames(gameListings);
        setError(null);

        // Subscribe ke real-time updates dari blockchain
        const eventStream = require('@/lib/blockchain-event-stream').getBlockchainEventStream();
        
        const unsubscribeJoin = eventStream.subscribe('PlayerJoined', (event: any) => {
          console.log('[v0] Player joined event received:', event);
          setGames((prevGames) =>
            prevGames.map((game) =>
              game.id === event.data.game_id
                ? {
                    ...game,
                    playerCount: game.playerCount + 1,
                    joinedPlayers: [...game.joinedPlayers, event.data.player_address],
                  }
                : game
            )
          );
        });

        const unsubscribeGameCreated = eventStream.subscribe('GameCreated', (event: any) => {
          console.log('[v0] New game created:', event);
          setGames((prevGames) => [
            ...prevGames,
            {
              id: event.data.game_id,
              name: Buffer.from(event.data.name).toString('utf-8'),
              creator: event.data.creator,
              playerCount: 0,
              maxPlayers: event.data.max_players,
              isActive: true,
              createdAt: event.data.timestamp,
              joinedPlayers: [],
            },
          ]);
        });

        return () => {
          unsubscribeJoin();
          unsubscribeGameCreated();
        };
      } catch (err) {
        console.error('[v0] Error fetching games:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };

    const cleanup = fetchAndSubscribe();
    return () => {
      cleanup.then((fn) => fn?.()).catch(console.error);
    };
  }, []);

  const handleJoinGame = async (gameId: string) => {
    try {
      // Use Dapp Kit hooks instead of service methods
      setError('Please use the main game browser to join games');
    } catch (err) {
      console.error('[v0] Error joining game:', err);
      setError(err instanceof Error ? err.message : 'Failed to join game');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-muted-foreground text-sm">Fetching games from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-box bg-red-500/10 border-red-500/30">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.length === 0 ? (
        <div className="stat-box text-center py-8">
          <p className="text-muted-foreground">No active games found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <div key={game.id} className="stat-box group hover:border-primary/80 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">{game.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Created by: {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-accent">
                    {game.playerCount}/{game.maxPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground">Players</div>
                </div>
              </div>

              <div className="h-2 bg-background rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                  style={{ width: `${(game.playerCount / game.maxPlayers) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {game.isActive ? (
                    <span className="text-green-500">● Active</span>
                  ) : (
                    <span className="text-red-500">● Inactive</span>
                  )}
                </div>
                <button
                  onClick={() => handleJoinGame(game.id)}
                  disabled={!game.isActive || game.playerCount >= game.maxPlayers}
                  className="button-neon text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Game
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
