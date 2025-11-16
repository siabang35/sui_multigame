'use client';

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type { SuiEventFilter } from '@mysten/sui/client';

// Ambil network dari environment
const SUI_NETWORK =
  process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';

const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL ||
  getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');

interface BlockchainEvent {
  eventId: string;
  type:
    | 'GameCreated'
    | 'PlayerJoined'
    | 'PlayerMoved'
    | 'PlayerAttacked'
    | 'PlayerRespawned'
    | 'LeaderboardUpdated'
    | 'PlayerDied';
  data: any;
  timestamp: number;
  digest: string;
}

type EventHandler = (event: BlockchainEvent) => void;

export class BlockchainEventStream {
  private suiClient: SuiClient;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  // ⛔ FIX: ReturnType instead of NodeJS.Timeout
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  private lastEventCursor: string | undefined = undefined;
  private isListening: boolean = false;

  constructor(
    private gamePackageId: string,
    private gameModule: string = 'game' // ⛔ FIX: full module path
  ) {
    this.suiClient = new SuiClient({ url: SUI_RPC_URL });
  }

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  async startListening(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    console.log('[v1] Starting blockchain event listener...');

    this.pollingInterval = setInterval(async () => {
      await this.fetchAndEmitEvents();
    }, 2000);

    await this.fetchAndEmitEvents();
  }

  stopListening(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isListening = false;
    console.log('[v1] Stopped blockchain event listener');
  }

  private async fetchAndEmitEvents(): Promise<void> {
    try {
      const events = await this.suiClient.queryEvents({
        query: {
          MoveModule: {
            module: this.gameModule,
            package: this.gamePackageId,
          },
        },
        limit: 100,
        order: 'ascending',
        cursor: this.lastEventCursor as any,
      });

      if (events.data.length > 0) {
        console.log(`[v1] Received ${events.data.length} blockchain events`);
      }

      for (const ev of events.data) {
        const parsed = this.parseEvent(ev);
        if (parsed) this.emitEvent(parsed);
      }

      if (events.data.length > 0) {
        this.lastEventCursor = events.nextCursor as string | undefined;
      }
    } catch (err) {
      console.error('[v1] Error fetching events:', err);
    }
  }

  private parseEvent(ev: any): BlockchainEvent | null {
    try {
      const typeName = ev.type?.split('::').pop();

      const json =
        typeof ev.parsedJson === 'string'
          ? JSON.parse(ev.parsedJson)
          : ev.parsedJson || {};

      return {
        eventId: `${ev.id.txDigest}_${ev.id.eventSeq}`,
        type: typeName,
        data: json,
        timestamp: ev.timestampMs,
        digest: ev.id.txDigest,
      };
    } catch (err) {
      console.error('[v1] Failed to parse event:', err);
      return null;
    }
  }

  private emitEvent(event: BlockchainEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];

    console.log(
      `[v1] Emit ${event.type} → ${handlers.length} subscribers`
    );

    handlers.forEach((h) => {
      try {
        h(event);
      } catch (err) {
        console.error(`[v1] Error handler for ${event.type}:`, err);
      }
    });
  }

  getListenerCount(eventType: string): number {
    return this.eventHandlers.get(eventType)?.length || 0;
  }

  getSubscribedEventTypes(): string[] {
    return [...this.eventHandlers.keys()];
  }
}

// Singleton
let eventStream: BlockchainEventStream | null = null;

export function initializeBlockchainEventStream(
  packageId: string
): BlockchainEventStream {
  if (!eventStream) {
    eventStream = new BlockchainEventStream(packageId);
  }
  return eventStream;
}

export function getBlockchainEventStream(): BlockchainEventStream {
  if (!eventStream) {
    throw new Error(
      'BlockchainEventStream not initialized. Call initializeBlockchainEventStream() first.'
    );
  }
  return eventStream;
}
