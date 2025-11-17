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
        const playersList = await suiGameService.getAllPlayers(gameId);
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

    const fetchLeaderboard = async () => {
      try {
        // Get all players and sort by score for leaderboard
        const players = await suiGameService.getAllPlayers(gameId);
        const sortedPlayers = players
          .sort((a, b) => b.score - a.score)
          .map(player => ({
            address: player.address,
            score: player.score,
          }));
        setLeaderboard(sortedPlayers);
        setLoading(false);
      } catch (error) {
        console.error('[v0] Error fetching leaderboard:', error);
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);

    return () => clearInterval(interval);
  }, [gameId]);

  return { leaderboard, loading };
}

export function usePlayerStats(gameId: string, playerAddress: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerAddress) return;

    const fetchPlayerStats = async () => {
      try {
        const player = await suiGameService.getPlayerByAddress(gameId, playerAddress);
        if (player) {
          setStats({
            health: player.health,
            score: player.score,
            kills: player.kills,
            deaths: player.deaths,
            isAlive: player.isAlive,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('[v0] Error fetching player stats:', error);
        setLoading(false);
      }
    };

    fetchPlayerStats();
    const interval = setInterval(fetchPlayerStats, 2000);

    return () => clearInterval(interval);
  }, [gameId, playerAddress]);

  return { stats, loading };
}

export function usePlayerInventory(playerAddress: string) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerAddress) return;

    const fetchInventory = async () => {
      try {
        setLoading(true);
        // Query for NFT items owned by the player
        const objects = await suiGameService.suiClient.getOwnedObjects({
          owner: playerAddress,
          options: { showContent: true, showType: true },
        });

        const items: any[] = [];

        for (const obj of objects.data) {
          if (obj.data?.content?.dataType === 'moveObject') {
            const type = obj.data.type || '';

            // Check if it's a game-related NFT/item
            if (type.includes('game') || type.includes('item') || type.includes('equipment')) {
              const fields = obj.data.content.fields as any;

              // Determine item type and properties based on the Move struct
              let itemType = 'Unknown';
              let rarity = 'Common';
              let power = 0;
              let name = 'Unknown Item';

              // Parse different item types with better rarity distribution
              if (type.includes('sword') || type.includes('weapon') || type.includes('blade') || type.includes('dagger')) {
                itemType = 'Weapon';
                name = fields.name ? Buffer.from(fields.name).toString('utf-8') : 'Sword';
                power = Number(fields.power || fields.damage || Math.floor(Math.random() * 50) + 50);
                rarity = power >= 90 ? 'Legendary' : power >= 75 ? 'Epic' : power >= 60 ? 'Rare' : 'Common';
              } else if (type.includes('shield') || type.includes('armor') || type.includes('cloak')) {
                itemType = 'Armor';
                name = fields.name ? Buffer.from(fields.name).toString('utf-8') : 'Shield';
                power = Number(fields.defense || fields.power || Math.floor(Math.random() * 40) + 40);
                rarity = power >= 85 ? 'Legendary' : power >= 70 ? 'Epic' : power >= 55 ? 'Rare' : 'Common';
              } else if (type.includes('boots') || type.includes('speed') || type.includes('shoes')) {
                itemType = 'Boots';
                name = fields.name ? Buffer.from(fields.name).toString('utf-8') : 'Speed Boots';
                power = Number(fields.speed || fields.power || Math.floor(Math.random() * 45) + 30);
                rarity = power >= 80 ? 'Legendary' : power >= 65 ? 'Epic' : power >= 50 ? 'Rare' : 'Common';
              } else {
                // Generic item with varied rarities
                itemType = 'Accessory';
                name = fields.name ? Buffer.from(fields.name).toString('utf-8') : 'Accessory';
                power = Number(fields.power || fields.value || Math.floor(Math.random() * 35) + 25);
                rarity = power >= 85 ? 'Legendary' : power >= 70 ? 'Epic' : power >= 55 ? 'Rare' : 'Common';
              }

              items.push({
                id: obj.data.objectId,
                name,
                type: itemType,
                rarity,
                power,
                objectId: obj.data.objectId,
                rawType: type,
              });
            }
          }
        }

        // If no real items found, add some demo items for testing with varied rarities
        if (items.length === 0) {
          items.push(
            { id: 'demo-1', name: 'Plasma Sword', type: 'Weapon', rarity: 'Legendary', power: 85, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-2', name: 'Energy Shield', type: 'Armor', rarity: 'Rare', power: 65, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-3', name: 'Speed Boots', type: 'Boots', rarity: 'Common', power: 40, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-4', name: 'Quantum Blade', type: 'Weapon', rarity: 'Legendary', power: 92, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-5', name: 'Void Armor', type: 'Armor', rarity: 'Epic', power: 78, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-6', name: 'Shadow Cloak', type: 'Armor', rarity: 'Rare', power: 58, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-7', name: 'Lightning Boots', type: 'Boots', rarity: 'Epic', power: 72, objectId: 'demo', rawType: 'demo' },
            { id: 'demo-8', name: 'Crystal Dagger', type: 'Weapon', rarity: 'Rare', power: 63, objectId: 'demo', rawType: 'demo' }
          );
        }

        setInventory(items);
        setError(null);
      } catch (err) {
        console.error('[v0] Error fetching inventory:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory');

        // Fallback to demo items on error with varied rarities
        setInventory([
          { id: 'demo-1', name: 'Plasma Sword', type: 'Weapon', rarity: 'Legendary', power: 85, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-2', name: 'Energy Shield', type: 'Armor', rarity: 'Rare', power: 65, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-3', name: 'Speed Boots', type: 'Boots', rarity: 'Common', power: 40, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-4', name: 'Quantum Blade', type: 'Weapon', rarity: 'Legendary', power: 92, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-5', name: 'Void Armor', type: 'Armor', rarity: 'Epic', power: 78, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-6', name: 'Shadow Cloak', type: 'Armor', rarity: 'Rare', power: 58, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-7', name: 'Lightning Boots', type: 'Boots', rarity: 'Epic', power: 72, objectId: 'demo', rawType: 'demo' },
          { id: 'demo-8', name: 'Crystal Dagger', type: 'Weapon', rarity: 'Rare', power: 63, objectId: 'demo', rawType: 'demo' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [playerAddress]);

  return { inventory, loading, error };
}

export function useTransactionStatus(digest: string) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!digest) return;

    const checkTransactionStatus = async () => {
      try {
        setLoading(true);
        const txDetails = await suiGameService.suiClient.getTransactionBlock({
          digest,
          options: { showEffects: true },
        });

        if (txDetails.effects?.status?.status === 'success') {
          setStatus('success');
        } else if (txDetails.effects?.status?.status === 'failure') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
        setLoading(false);
      } catch (error) {
        console.error('[v0] Error checking transaction status:', error);
        setLoading(false);
      }
    };

    checkTransactionStatus();
    const interval = setInterval(checkTransactionStatus, 2000);

    return () => clearInterval(interval);
  }, [digest]);

  return { status, loading };
}
