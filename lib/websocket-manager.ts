'use client';

export type MessageType =
  | 'player-join'
  | 'player-leave'
  | 'player-move'
  | 'player-attack'
  | 'player-respawn'
  | 'player-stats-update'
  | 'game-update'
  | 'chat-message'
  | 'leaderboard-update'
  | 'sync-request'
  | 'sync-response';

export interface GameMessage {
  type: MessageType;
  playerId: string;
  gameId: string;
  timestamp: number;
  data: Record<string, any>;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageListeners: Map<MessageType, Function[]> = new Map();
  private connectionListeners: Function[] = [];
  private disconnectionListeners: Function[] = [];
  private isConnected = false;
  private messageQueue: GameMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    // Use a dummy WebSocket URL if none provided to prevent connection attempts
    this.url = url || 'ws://dummy-url-that-wont-connect';
  }

  async connect(playerId: string, gameId: string): Promise<void> {
    // If no valid WebSocket URL, skip connection entirely
    if (!this.url || this.url.includes('dummy-url')) {
      console.log('[WebSocket] Skipping connection - no WebSocket URL configured');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        console.log('[WebSocket] Attempting connection to:', this.url);
        this.ws = new WebSocket(this.url);

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          console.log('[WebSocket] Connection timeout - giving up');
          if (this.ws) {
            this.ws.close();
          }
          resolve(); // Resolve instead of reject to not break the flow
        }, 5000);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected successfully');
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send initial sync message
          this.send({
            type: 'sync-request',
            playerId,
            gameId,
            timestamp: Date.now(),
            data: { action: 'join' },
          });

          // Start heartbeat
          this.startHeartbeat();

          // Process queued messages
          this.processMessageQueue();

          // Notify listeners
          this.connectionListeners.forEach((listener) => listener());

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            this.handleMessage(JSON.parse(event.data));
          } catch (parseError) {
            console.error('[WebSocket] Failed to parse message:', event.data, parseError);
          }
        };

        this.ws.onerror = (error) => {
          console.log('[WebSocket] Connection error (this is normal if no server running):', error);
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          // Don't reject - let the connection timeout handle it
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Connection closed:', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          this.stopHeartbeat();
          this.disconnectionListeners.forEach((listener) => listener());

          // Only attempt reconnect if we actually connected before
          if (this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect(playerId, gameId).catch(() => {
                console.log('[WebSocket] Reconnection failed - giving up');
              });
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        console.error('[WebSocket] Failed to create WebSocket:', error);
        resolve(); // Resolve instead of reject to not break the flow
      }
    });
  }

  send(message: GameMessage): void {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private handleMessage(message: GameMessage): void {
    const listeners = this.messageListeners.get(message.type) || [];
    listeners.forEach((listener) => listener(message));
  }

  on(messageType: MessageType, callback: (message: GameMessage) => void): void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, []);
    }
    this.messageListeners.get(messageType)!.push(callback);
  }

  off(messageType: MessageType, callback: Function): void {
    if (this.messageListeners.has(messageType)) {
      const callbacks = this.messageListeners.get(messageType)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  onConnect(callback: () => void): void {
    this.connectionListeners.push(callback);
  }

  onDisconnect(callback: () => void): void {
    this.disconnectionListeners.push(callback);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.ws?.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}
