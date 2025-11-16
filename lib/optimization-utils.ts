'use client';

/**
 * Memory optimization utilities
 */
export class MemoryOptimizer {
  private objectPool: Map<string, any[]> = new Map();

  allocateFromPool(type: string): any {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }

    const pool = this.objectPool.get(type)!;
    return pool.pop() || this.createObject(type);
  }

  returnToPool(type: string, obj: any): void {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }

    this.objectPool.get(type)!.push(obj);
  }

  private createObject(type: string): any {
    switch (type) {
      case 'Vector3':
        return { x: 0, y: 0, z: 0 };
      case 'Quaternion':
        return { x: 0, y: 0, z: 0, w: 1 };
      default:
        return {};
    }
  }

  clearPool(): void {
    this.objectPool.clear();
  }
}

/**
 * Network optimization utilities
 */
export class NetworkOptimizer {
  private messageBuffer: any[] = [];
  private batchSize = 5;
  private batchTimer: NodeJS.Timeout | null = null;
  private onBatch: ((messages: any[]) => void) | null = null;

  bufferMessage(message: any): void {
    this.messageBuffer.push(message);

    if (this.messageBuffer.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), 50);
    }
  }

  private flushBatch(): void {
    if (this.messageBuffer.length > 0 && this.onBatch) {
      this.onBatch(this.messageBuffer);
      this.messageBuffer = [];
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  onMessageBatch(callback: (messages: any[]) => void): void {
    this.onBatch = callback;
  }

  getMessageBuffer(): any[] {
    return this.messageBuffer;
  }
}

/**
 * Lazy loading utilities
 */
export function lazyLoadComponent(componentPath: string) {
  return import(componentPath).then((mod) => mod.default);
}

/**
 * Debounce function for event handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for continuous events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
