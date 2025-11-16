'use client';

import { inputManager } from './game-input-manager';
import { PhysicsEngine, PhysicsObject } from './game-physics';
import { useGameStore } from './game-state';
import { suiGameService } from './sui-game-service';

export interface GameController {
  update(deltaTime: number): void;
  movePlayer(x: number, y: number, z: number): void;
  attackPlayer(targetId: string, damage: number): void;
  handleInput(): void;
  isMouseDown(): boolean;
}

export class MultiplayerGameController implements GameController {
  private physics: PhysicsEngine;
  private lastUpdateTime = Date.now();
  private moveSpeed = 15;
  private jumpForce = 8;
  private attackCooldown = 0;
  private attackCooldownMax = 0.5;

  isMouseDown(): boolean {
    return inputManager?.isMouseDown() ?? false;
  }

  constructor() {
    this.physics = PhysicsEngine.getInstance();
    this.setupPhysicsObjects();
  }

  private setupPhysicsObjects() {
    const gameState = useGameStore.getState();
    if (gameState.game.currentPlayer) {
      const player = gameState.game.currentPlayer;
      this.physics.addObject('player', {
        x: player.x,
        y: player.y,
        z: player.z,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        radius: 0.4,
        mass: 1,
        isGrounded: false,
      });
    }
  }

  update(deltaTime: number) {
    this.physics.update(deltaTime);
    this.handleInput();
    this.updateGameState();
    this.updateAttackCooldown(deltaTime);
  }

  handleInput() {
    if (!inputManager) return;

    const movement = inputManager.getMovementVector();
    const playerObj = this.physics.getObject('player');

    if (playerObj) {
      // Apply movement
      const moveForce = this.moveSpeed;
      if (movement.x !== 0) {
        this.physics.applyForce('player', movement.x * moveForce, 0, 0);
      }
      if (movement.z !== 0) {
        this.physics.applyForce('player', 0, 0, movement.z * moveForce);
      }

      // Jump
      if (inputManager.isKeyPressed(' ') && playerObj.isGrounded) {
        this.physics.applyImpulse('player', 0, this.jumpForce, 0);
      }

      // Attack
      if (this.isMouseDown() && this.attackCooldown <= 0) {
        this.performAttack();
        this.attackCooldown = this.attackCooldownMax;
      }

      // Special ability
      if (inputManager.isKeyPressed('e')) {
        this.performSpecialAbility();
      }
    }
  }

  private performAttack() {
    const gameState = useGameStore.getState();
    const player = gameState.game.currentPlayer;

    if (!player) return;

    // Find nearby enemies within attack range (5 units)
    const attackRange = 5;
    const targetedPlayers = gameState.game.otherPlayers.filter((p: any) => {
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const dz = p.z - player.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= attackRange && p.isAlive;
    });

    if (targetedPlayers.length > 0) {
      const target = targetedPlayers[0]; // Attack closest enemy
      const damage = 20;

      // Send attack transaction to blockchain
      if (gameState.game.gameId) {
        suiGameService.attackPlayer(gameState.game.gameId, player.id, target.id, damage)
          .then((digest: string) => {
            console.log('[] Attack transaction sent:', digest);
            gameState.addPendingTransaction(digest, 'attack_player');
          })
          .catch((error: any) => {
            console.error('[] Failed to send attack:', error);
          });
      }

      // Emit attack event for local sync
      this.onAttack({
        attackerId: player.id,
        targetId: target.id,
        damage,
        timestamp: Date.now(),
      });

      // Knockback effect
      const dx = target.x - player.x;
      const dz = target.z - player.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const knockbackForce = 5;
      const knockbackX = (dx / distance) * knockbackForce;
      const knockbackZ = (dz / distance) * knockbackForce;

      // Create knockback effect (will be synced via websocket)
    }
  }

  private performSpecialAbility() {
    const gameState = useGameStore.getState();
    const player = gameState.game.currentPlayer;

    if (!player) return;

    // Special ability: heal
    const healAmount = 30;
    const newHealth = Math.min(player.health + healAmount, 100);

    useGameStore.getState().updatePlayerHealth(newHealth);
    this.onSpecialAbility({
      playerId: player.id,
      abilityType: 'heal',
      timestamp: Date.now(),
    });
  }

  private updateAttackCooldown(deltaTime: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
  }

  private updateGameState() {
    const playerObj = this.physics.getObject('player');
    if (playerObj) {
      const gameState = useGameStore.getState();

      // Update local position
      gameState.updatePlayerPosition(
        playerObj.x,
        playerObj.y,
        playerObj.z
      );

      // Send position update to blockchain periodically (throttle to avoid spam)
      if (gameState.game.gameId && gameState.game.currentPlayer) {
        const now = Date.now();
        if (!this.lastPositionUpdate || now - this.lastPositionUpdate > 1000) { // Update every 1 second
          suiGameService.movePlayer(
            gameState.game.gameId,
            gameState.game.currentPlayer.id,
            playerObj.x,
            playerObj.y,
            playerObj.z
          )
          .then((digest: string) => {
            console.log('[] Position update sent:', digest);
            gameState.addPendingTransaction(digest, 'move_player');
          })
          .catch((error: any) => {
            console.error('[] Failed to send position update:', error);
          });

          this.lastPositionUpdate = now;
        }
      }
    }
  }

  private lastPositionUpdate: number = 0;

  movePlayer(x: number, y: number, z: number) {
    const playerObj = this.physics.getObject('player');
    if (playerObj) {
      playerObj.x = x;
      playerObj.y = y;
      playerObj.z = z;
    }
  }

  attackPlayer(targetId: string, damage: number) {
    this.onAttack({
      attackerId: useGameStore.getState().game.currentPlayer?.id || '',
      targetId,
      damage,
      timestamp: Date.now(),
    });
  }

  // Event handlers
  private onAttack = (event: any) => {
    // Will be connected to WebSocket
  };

  private onSpecialAbility = (event: any) => {
    // Will be connected to WebSocket
  };
}
