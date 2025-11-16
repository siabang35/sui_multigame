'use client';

import { useEffect, useState, useCallback } from 'react';
import { suiGameService, type GameData, type PlayerData } from '@/lib/sui-game-service';

export function useGamesList() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gamesList = await suiGameService.getAllGames();
        setGames(gamesList);
        setError(null);
      } catch (err) {
        console.error('[v0] Error fetching games:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    // Re-fetch games setiap 10 detik untuk update
    const interval = setInterval(fetchGames, 10000);

    return () => clearInterval(interval);
  }, []);

  return { games, loading, error };
}

export function useGamePlayers(gameId: string) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const playersList = await suiGameService.getGamePlayers(gameId);
        setPlayers(playersList);
        setError(null);
      } catch (err) {
        console.error('[v0] Error fetching players:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);

    return () => clearInterval(interval);
  }, [gameId]);

  return { players, loading, error };
}

export function useLeaderboard(gameId: string) {
  const [leaderboard, setLeaderboard] = useState<Array<{ address: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    let unwatch: (() => void) | null = null;

    const setupWatch = async () => {
      try {
        unwatch = await suiGameService.watchLeaderboard(gameId, (data) => {
          setLeaderboard(data);
          setLoading(false);
        });
      } catch (error) {
        console.error('[v0] Error setting up leaderboard watch:', error);
        setLoading(false);
      }
    };

    setupWatch();

    return () => {
      if (unwatch) unwatch();
    };
  }, [gameId]);

  return { leaderboard, loading };
}

export function usePlayerStats(gameId: string, playerAddress: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerAddress) return;

    let unwatch: (() => void) | null = null;

    const setupWatch = async () => {
      try {
        unwatch = await suiGameService.watchPlayerStats(gameId, playerAddress, (data) => {
          setStats(data);
          setLoading(false);
        });
      } catch (error) {
        console.error('[v0] Error setting up player stats watch:', error);
        setLoading(false);
      }
    };

    setupWatch();

    return () => {
      if (unwatch) unwatch();
    };
  }, [gameId, playerAddress]);

  return { stats, loading };
}

export function useTransactionStatus(digest: string) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!digest) return;

    let unwatch: (() => void) | null = null;

    const setupWatch = async () => {
      try {
        setLoading(true);
        unwatch = await suiGameService.watchTransaction(digest, (status) => {
          setStatus(status);
          setLoading(false);
        });
      } catch (error) {
        console.error('[v0] Error watching transaction:', error);
        setLoading(false);
      }
    };

    setupWatch();

    return () => {
      if (unwatch) unwatch();
    };
  }, [digest]);

  return { status, loading };
}
