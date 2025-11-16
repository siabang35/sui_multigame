'use client';

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { initializeBlockchainEventStream, getBlockchainEventStream } from './blockchain-event-stream';
import { useGameStore } from './game-state';

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');
const GAME_PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_GAME_PACKAGE_ID || '0x45ed0c095882c178f0744afd2eaa6298d9c065c8e73266ebf0df993cabe16a63';
const GAME_MODULE = 'game';

export interface GameData {
  id: string;
  name: string;
  creator: string;
  isActive: boolean;
  createdAt: number;
  playerCount: number;
  maxPlayers: number;
  version: number;
}

export interface PlayerData {
  id: string;
  gameId: string;
  address: string;
  username: string;
  x: number;
  y: number;
  z: number;
  health: number;
  score: number;
  kills: number;
  deaths: number;
  joinedAt: number;
  lastActionAt: number;
  isAlive: boolean;
}

export type WalletType = 'sui' | 'slush' | 'ethos' | 'mysten' | null;

export class SuiGameService {
  private suiClient: SuiClient;
  private eventStream: any;
  private listeningGames: Set<string> = new Set();

  constructor() {
    this.suiClient = new SuiClient({ url: SUI_RPC_URL });
    this.eventStream = initializeBlockchainEventStream(GAME_PACKAGE_ID);
  }

  // ===== Game Functions =====
  async createGame(
    gameName: string,
    maxPlayers: number
  ): Promise<string> {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  async joinGame(gameId: string, username: string) {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  async movePlayer(
    gameId: string,
    playerId: string,
    x: number,
    y: number,
    z: number
  ): Promise<string> {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  async attackPlayer(
    gameId: string,
    attackerId: string,
    targetId: string,
    damage: number
  ): Promise<string> {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  async respawnPlayer(
    gameId: string,
    playerId: string
  ): Promise<string> {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  // ===== Query Functions =====
  async getGameStatus(gameId: string) {
    try {
      const gameObject = await this.suiClient.getObject({
        id: gameId,
        options: { showContent: true },
      });

      if (gameObject.data?.content?.dataType === 'moveObject') {
        const fields = gameObject.data.content.fields as any;
        return {
          id: gameId,
          name: fields.name ? Buffer.from(fields.name).toString('utf-8') : 'Unnamed Game',
          creator: fields.creator,
          isActive: fields.is_active,
          createdAt: Number(fields.created_at),
          playerCount: Number(fields.player_count),
          maxPlayers: Number(fields.max_players),
          version: Number(fields.version),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get game status:', error);
      return null;
    }
  }

  async getAllGames(): Promise<GameData[]> {
    try {
      console.log('[] Using fallback method to fetch games...');

      // Query Game creation transactions
      const games = await this.suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            module: GAME_MODULE,
            function: 'create_game',
            package: GAME_PACKAGE_ID,
          },
        },
        limit: 50,
        order: 'descending',
      });

      const gameList: GameData[] = [];

      for (const tx of games.data) {
        try {
          // Fetch transaction details to get game data
          const txDetails = await this.suiClient.getTransactionBlock({
            digest: tx.digest,
            options: { showObjectChanges: true },
          });

          if (txDetails.objectChanges) {
            for (const change of txDetails.objectChanges) {
              if (change.type === 'created' && change.objectType?.includes('Game')) {
                const gameData: GameData = {
                  id: change.objectId,
                  name: 'Unnamed Game',
                  creator: '0x0...0x0',
                  isActive: true,
                  createdAt: Date.now(),
                  playerCount: 0,
                  maxPlayers: 32,
                  version: 1,
                };
                gameList.push(gameData);
              }
            }
          }
        } catch (error) {
          console.error('[] Error processing game transaction:', error);
        }
      }

      return gameList;
    } catch (error) {
      console.error('[] Failed to fetch games via fallback:', error);
      return [];
    }
  }

  async getPlayerByAddress(gameId: string, playerAddress: string): Promise<PlayerData | null> {
    try {
      // Query for Player objects owned by the player address
      const objects = await this.suiClient.getOwnedObjects({
        owner: playerAddress,
        filter: {
          StructType: `${GAME_PACKAGE_ID}::game::Player`,
        },
        options: { showContent: true },
      });

      // Find the player object for this specific game
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as any;
          if (fields.game_id === gameId) {
            return {
              id: obj.data.objectId,
              gameId: fields.game_id,
              address: fields.player_address,
              username: Buffer.from(fields.username).toString('utf-8'),
              x: Number(fields.x),
              y: Number(fields.y),
              z: Number(fields.z),
              health: Number(fields.health),
              score: Number(fields.score),
              kills: Number(fields.kills),
              deaths: Number(fields.deaths),
              joinedAt: Number(fields.joined_at),
              lastActionAt: Number(fields.last_action_at),
              isAlive: fields.is_alive,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get player by address:', error);
      return null;
    }
  }

  async getAllPlayers(gameId: string): Promise<PlayerData[]> {
    try {
      // Query for all Player objects in the game
      const objects = await this.suiClient.queryEvents({
        query: {
          MoveEventType: `${GAME_PACKAGE_ID}::game::PlayerJoined`,
        },
        limit: 100,
        order: 'descending',
      });

      const players: PlayerData[] = [];

      for (const event of objects.data) {
        try {
          const eventData = event.parsedJson as any;
          if (eventData.game_id === gameId) {
            // Get the player object
            const player = await this.getPlayerByAddress(gameId, eventData.player_address);
            if (player) {
              players.push(player);
            }
          }
        } catch (error) {
          console.error('Error processing player event:', error);
        }
      }

      return players;
    } catch (error) {
      console.error('Failed to get all players:', error);
      return [];
    }
  }

  // ===== Wallet Functions =====
  async connectWallet(): Promise<string> {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  async getBalance(): Promise<number> {
    throw new Error('Use Dapp Kit hooks instead of this service method');
  }

  // ===== Event Subscription =====
  async subscribeToGameEvents(gameId: string, callback: (event: any) => void) {
    if (this.listeningGames.has(gameId)) {
      console.log(`Already listening to events for game ${gameId}`);
      return;
    }

    this.listeningGames.add(gameId);

    try {
      const unsubscribe = this.eventStream.subscribe('PlayerJoined', (event: any) => {
        if (event.data.game_id === gameId) {
          callback(event);
        }
      });

      const unsubscribeMove = this.eventStream.subscribe('PlayerMoved', (event: any) => {
        if (event.data.game_id === gameId) {
          callback(event);
        }
      });

      const unsubscribeAttack = this.eventStream.subscribe('PlayerAttacked', (event: any) => {
        if (event.data.game_id === gameId) {
          callback(event);
        }
      });

      const unsubscribeRespawn = this.eventStream.subscribe('PlayerRespawned', (event: any) => {
        if (event.data.game_id === gameId) {
          callback(event);
        }
      });

      const unsubscribeDied = this.eventStream.subscribe('PlayerDied', (event: any) => {
        if (event.data.game_id === gameId) {
          callback(event);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeMove();
        unsubscribeAttack();
        unsubscribeRespawn();
        unsubscribeDied();
        this.listeningGames.delete(gameId);
      };
    } catch (error) {
      console.error('Failed to subscribe to game events:', error);
      this.listeningGames.delete(gameId);
      return () => {};
    }
  }

  private readonly GAME_MODULE = GAME_MODULE;
}

declare global {
  interface Window {
    sui?: {
      requestPermissions(): Promise<{ accounts: Array<{ address: string }> }>;
      signAndExecuteTransaction(data: any): Promise<{ digest: string }>;
    };
    suiWallet?: {
      requestPermissions(): Promise<{ accounts: Array<{ address: string }> }>;
      signAndExecuteTransaction(data: any): Promise<{ digest: string }>;
    };
    ethos?: {
      requestPermissions(): Promise<{ accounts: Array<{ address: string }> }>;
      signAndExecuteTransaction(data: any): Promise<{ digest: string }>;
    };
    mystenwallet?: {
      requestPermissions(): Promise<{ accounts: Array<{ address: string }> }>;
      signAndExecuteTransaction(data: any): Promise<{ digest: string }>;
    };
  }
}

export const suiGameService = new SuiGameService();
