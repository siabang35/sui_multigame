'use client';

export class GameInputManager {
  private keys: Map<string, boolean> = new Map();
  private mousePosition = { x: 0, y: 0 };
  private mouseDown = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse events
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (!this.keys.get(key)) {
      this.keys.set(key, true);
      this.emit('keydown', key);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys.set(key, false);
    this.emit('keyup', key);
  }

  private handleMouseMove(e: MouseEvent) {
    this.mousePosition = { x: e.clientX, y: e.clientY };
    this.emit('mousemove', this.mousePosition);
  }

  private handleMouseDown(e: MouseEvent) {
    this.mouseDown = true;
    this.emit('mousedown', e.button);
  }

  private handleMouseUp(e: MouseEvent) {
    this.mouseDown = false;
    this.emit('mouseup', e.button);
  }

  isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) ?? false;
  }

  getMousePosition() {
    return this.mousePosition;
  }

  isMouseDown(): boolean {
    return this.mouseDown;
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => callback(...args));
    }
  }

  getMovementVector() {
    const x = (this.isKeyPressed('d') ? 1 : 0) - (this.isKeyPressed('a') ? 1 : 0);
    const z = (this.isKeyPressed('s') ? 1 : 0) - (this.isKeyPressed('w') ? 1 : 0);
    return { x, z };
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }
}

export const inputManager = typeof window !== 'undefined' ? new GameInputManager() : null;
