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
    this.url = url;
  }

  async connect(playerId: string, gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
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
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.isConnected = false;
          this.stopHeartbeat();
          this.disconnectionListeners.forEach((listener) => listener());

          // Attempt reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect(playerId, gameId).catch(console.error);
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        reject(error);
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
