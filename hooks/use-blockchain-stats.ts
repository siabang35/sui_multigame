'use client';

import { useEffect, useState } from 'react';
import { suiGameService } from '@/lib/sui-game-service';
import { useGameStore } from '@/lib/game-state';

export function useBlockchainStats() {
  const [stats, setStats] = useState({
    totalGames: 0,
    activePlayers: 0,
    totalTransactions: 0,
    networkLatency: 0,
    lastUpdate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const startTime = Date.now();
        
        // Fetch all games to count
        const games = await suiGameService.getAllGames();
        
        // Calculate latency
        const latency = Date.now() - startTime;

        setStats({
          totalGames: games.length,
          activePlayers: games.reduce((sum, game) => sum + game.playerCount, 0),
          totalTransactions: 0, // Could be fetched from transaction history
          networkLatency: latency,
          lastUpdate: Date.now(),
        });
        
        setLoading(false);
      } catch (error) {
        console.error('[v0] Error fetching blockchain stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}

export function useWalletBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Use Dapp Kit hook instead of service method
        // Balance fetching should be handled by the wallet component
        setBalance(0); // Placeholder - actual balance should come from wallet
        setLoading(false);
      } catch (error) {
        console.error('[v0] Error fetching balance:', error);
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { balance, loading };
}

export function useGameCreationStatus() {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionDigest, setTransactionDigest] = useState<string | null>(null);
  const addPendingTransaction = useGameStore((state) => state.addPendingTransaction);

  const createGame = async (gameName: string, maxPlayers: number) => {
    try {
      setStatus('pending');
      const digest = await suiGameService.createGame(gameName, maxPlayers);
      setTransactionDigest(digest);
      addPendingTransaction(digest, 'create_game');
      setStatus('success');
      
      return digest;
    } catch (error) {
      console.error('[v0] Error creating game:', error);
      setStatus('error');
      throw error;
    }
  };

  return { status, transactionDigest, createGame };
}
