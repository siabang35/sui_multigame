'use client';

export class GameError extends Error {
  constructor(
    public code: string,
    public message: string,
    public severity: 'info' | 'warning' | 'error' = 'error'
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ErrorHandler {
  private listeners: Map<string, Function[]> = new Map();

  handle(error: Error | GameError): void {
    let code = 'UNKNOWN_ERROR';
    let severity: 'info' | 'warning' | 'error' = 'error';

    if (error instanceof GameError) {
      code = error.code;
      severity = error.severity;
    }

    console.error(`[${code}] ${error.message}`);

    // Emit error event
    this.emit(code, error);
    this.emit('error', error);

    // Send to error tracking service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      this.reportError(code, error);
    }
  }

  on(code: string, callback: (error: Error) => void): void {
    if (!this.listeners.has(code)) {
      this.listeners.set(code, []);
    }
    this.listeners.get(code)!.push(callback);
  }

  private emit(code: string, error: Error): void {
    const callbacks = this.listeners.get(code) || [];
    callbacks.forEach((cb) => cb(error));
  }

  private reportError(code: string, error: Error): void {
    // TODO: Integrate with Sentry, LogRocket, or similar service
    // Example:
    // Sentry.captureException(error, { tags: { code } });
  }
}

export const errorHandler = new ErrorHandler();
