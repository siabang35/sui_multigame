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
  inputState: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    attack: boolean;
  };
}

export class MultiplayerGameController implements GameController {
  private physics: PhysicsEngine;
  private lastUpdateTime = Date.now();
  private moveSpeed = 15;
  private jumpForce = 8;
  private attackCooldown = 0;
  private attackCooldownMax = 0.5;

  inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    attack: false,
  };

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

      // Setup physics for AI enemies
      gameState.game.otherPlayers.forEach((enemy: any, index: number) => {
        this.physics.addObject(`enemy-${enemy.id}`, {
          x: enemy.x,
          y: enemy.y,
          z: enemy.z,
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
      });
    }
  }

  update(deltaTime: number) {
    // Optimize physics updates to reduce lag
    this.optimizePhysicsUpdates();

    this.physics.update(deltaTime);
    this.handleInput();
    this.updateGameState();
    this.updateAttackCooldown(deltaTime);
    this.updateAIEnemies(deltaTime);
  }

  private updateAIEnemies(deltaTime: number) {
    const gameState = useGameStore.getState();
    const player = gameState.game.currentPlayer;

    if (!player) return;

    gameState.game.otherPlayers.forEach((enemy: any) => {
      if (!enemy.isAlive) return;

      // Simple AI: move towards player with smoother movement
      const dx = player.x - enemy.x;
      const dz = player.z - enemy.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 5) { // Keep more distance for better gameplay
        const moveSpeed = 3; // Slightly faster for more responsive AI
        const moveX = (dx / distance) * moveSpeed * deltaTime;
        const moveZ = (dz / distance) * moveSpeed * deltaTime;

        // Update enemy position with physics
        const physicsObj = this.physics.getObject(`enemy-${enemy.id}`);
        if (physicsObj) {
          physicsObj.x += moveX;
          physicsObj.z += moveZ;

          // Update game state from physics
          gameState.addOtherPlayer({
            ...enemy,
            x: physicsObj.x,
            z: physicsObj.z,
          });
        } else {
          // Fallback direct update
          const newX = enemy.x + moveX;
          const newZ = enemy.z + moveZ;

          gameState.addOtherPlayer({
            ...enemy,
            x: newX,
            z: newZ,
          });
        }
      }

      // More frequent attacks when close for better combat feel
      if (distance < 10 && Math.random() < 0.02) { // 2% chance per frame when close
        this.performEnemyAttack(enemy, player);
      }
    });
  }

  private performEnemyAttack(attacker: any, target: any) {
    const damage = 20; // Increased damage for more challenge
    const gameState = useGameStore.getState();

    // Apply damage to player
    const newHealth = Math.max(0, target.health - damage);
    gameState.updatePlayerHealth(newHealth);

    // Knockback effect on player
    this.applyKnockback(attacker, target, 5); // Stronger knockback

    // Visual feedback - could add hit effect here
    console.log(`[] Enemy ${attacker.username} attacked player for ${damage} damage`);
  }

  handleInput() {
    if (!inputManager) return;

    const movement = inputManager.getMovementVector();
    const playerObj = this.physics.getObject('player');

    // Update input state
    this.inputState = {
      forward: inputManager.isKeyPressed('w') || inputManager.isKeyPressed('arrowup'),
      backward: inputManager.isKeyPressed('s') || inputManager.isKeyPressed('arrowdown'),
      left: inputManager.isKeyPressed('a') || inputManager.isKeyPressed('arrowleft'),
      right: inputManager.isKeyPressed('d') || inputManager.isKeyPressed('arrowright'),
      jump: inputManager.isKeyPressed(' '),
      attack: this.isMouseDown(),
    };

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
      if (this.inputState.jump && playerObj.isGrounded) {
        this.physics.applyImpulse('player', 0, this.jumpForce, 0);
      }

      // Attack
      if (this.inputState.attack && this.attackCooldown <= 0) {
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

    // Find nearby enemies within attack range (8 units for better gameplay)
    const attackRange = 8;
    const targetedEnemies = this.getNearbyEnemies(player, attackRange);

    if (targetedEnemies.length > 0) {
      // Attack all enemies in range for more dynamic combat
      targetedEnemies.forEach((target: any) => {
        const damage = 25; // Increased damage for better feel

        // Apply damage to enemy
        this.damageEnemy(target, damage);

        // Emit attack event for local sync
        this.onAttack({
          attackerId: player.id,
          targetId: target.id,
          damage,
          timestamp: Date.now(),
        });

        // Knockback effect
        this.applyKnockback(player, target, 8); // Stronger knockback
      });

      // Visual feedback - screen shake effect could be added here
    }
  }

  private getNearbyEnemies(player: any, range: number): any[] {
    // For single-player mode, create AI enemies if none exist
    const gameState = useGameStore.getState();
    let enemies = [...gameState.game.otherPlayers];

    // If no other players, spawn AI enemies
    if (enemies.length === 0) {
      enemies = this.spawnAIEnemies();
    }

    return enemies.filter((enemy: any) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dz = enemy.z - player.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= range && enemy.isAlive;
    });
  }

  private spawnAIEnemies(): any[] {
    const enemies: any[] = [];
    const gameState = useGameStore.getState();
    const player = gameState.game.currentPlayer;

    if (!player) return enemies;

    // Spawn 3-5 AI enemies around the player
    const numEnemies = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numEnemies; i++) {
      const angle = (i / numEnemies) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const x = player.x + Math.cos(angle) * distance;
      const z = player.z + Math.sin(angle) * distance;

      const enemy = {
        id: `ai-enemy-${i}`,
        address: `ai-${i}`,
        username: `Enemy ${i + 1}`,
        x,
        y: 0,
        z,
        health: 100,
        score: 0,
        kills: 0,
        deaths: 0,
        isAlive: true,
        syncStatus: 'synced' as const,
      };

      enemies.push(enemy);
      gameState.addOtherPlayer(enemy);
    }

    return enemies;
  }

  private damageEnemy(target: any, damage: number) {
    const gameState = useGameStore.getState();
    const newHealth = Math.max(0, target.health - damage);
    const isAlive = newHealth > 0;

    gameState.addOtherPlayer({
      ...target,
      health: newHealth,
      isAlive,
    });

    // If enemy died, respawn after delay
    if (!isAlive) {
      setTimeout(() => {
        this.respawnEnemy(target);
      }, 3000);
    }
  }

  private respawnEnemy(enemy: any) {
    const gameState = useGameStore.getState();
    const player = gameState.game.currentPlayer;

    if (!player) return;

    // Respawn at random location away from player
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    const x = player.x + Math.cos(angle) * distance;
    const z = player.z + Math.sin(angle) * distance;

    gameState.addOtherPlayer({
      ...enemy,
      x,
      y: 0,
      z,
      health: 100,
      isAlive: true,
    });
  }

  private applyKnockback(attacker: any, target: any, force: number) {
    const dx = target.x - attacker.x;
    const dz = target.z - attacker.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) return;

    const knockbackX = (dx / distance) * force;
    const knockbackZ = (dz / distance) * force;

    // Check if target is player or enemy
    if (target.id === useGameStore.getState().game.currentPlayer?.id) {
      // Apply knockback to player physics object
      const playerObj = this.physics.getObject('player');
      if (playerObj) {
        this.physics.applyImpulse('player', knockbackX, 0, knockbackZ);
      }
    } else {
      // Apply knockback to enemy physics object
      const physicsObj = this.physics.getObject(`enemy-${target.id}`);
      if (physicsObj) {
        this.physics.applyImpulse(`enemy-${target.id}`, knockbackX, 0, knockbackZ);
      } else {
        // Update position directly
        const gameState = useGameStore.getState();
        gameState.addOtherPlayer({
          ...target,
          x: target.x + knockbackX,
          z: target.z + knockbackZ,
        });
      }
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

    // Also heal nearby AI enemies for single-player challenge
    const nearbyEnemies = this.getNearbyEnemies(player, 15);
    nearbyEnemies.forEach((enemy: any) => {
      const enemyHealAmount = 20;
      const enemyNewHealth = Math.min(enemy.health + enemyHealAmount, 100);
      gameState.addOtherPlayer({
        ...enemy,
        health: enemyNewHealth,
      });
    });
  }

  private updateAttackCooldown(deltaTime: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
  }

  // Add method to reduce lag by optimizing physics updates
  private optimizePhysicsUpdates() {
    // Reduce collision checks for distant objects
    const gameState = useGameStore.getState();
    const player = gameState.game.currentPlayer;

    if (!player) return;

    // Only update physics for nearby objects to reduce lag
    const maxDistance = 50; // Only process objects within 50 units

    gameState.game.otherPlayers.forEach((enemy: any) => {
      const distance = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) +
        Math.pow(enemy.z - player.z, 2)
      );

      if (distance > maxDistance) {
        // Remove distant enemies from physics to reduce calculations
        this.physics.removeObject(`enemy-${enemy.id}`);
      } else {
        // Ensure nearby enemies have physics objects
        if (!this.physics.getObject(`enemy-${enemy.id}`)) {
          this.physics.addObject(`enemy-${enemy.id}`, {
            x: enemy.x,
            y: enemy.y,
            z: enemy.z,
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
    });
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

      // For single-player mode, skip blockchain updates
      // Position updates are handled locally only
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
