'use client';

export interface PhysicsObject {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number;
  ay: number;
  az: number;
  radius: number;
  mass: number;
  isGrounded: boolean;
}

const GRAVITY = -9.81;
const FRICTION = 0.95;
const AIR_FRICTION = 0.99;
const GROUND_LEVEL = 0;

export class PhysicsEngine {
  private objects: Map<string, PhysicsObject> = new Map();
  private static instance: PhysicsEngine;

  private constructor() {}

  static getInstance(): PhysicsEngine {
    if (!PhysicsEngine.instance) {
      PhysicsEngine.instance = new PhysicsEngine();
    }
    return PhysicsEngine.instance;
  }

  addObject(id: string, obj: PhysicsObject) {
    this.objects.set(id, obj);
  }

  removeObject(id: string) {
    this.objects.delete(id);
  }

  getObject(id: string): PhysicsObject | undefined {
    return this.objects.get(id);
  }

  update(deltaTime: number) {
    // Limit deltaTime to prevent large jumps (helps with lag)
    const clampedDeltaTime = Math.min(deltaTime, 1/30); // Max 30 FPS equivalent

    this.objects.forEach((obj) => {
      // Apply forces
      obj.ay = GRAVITY; // Gravity

      // Apply velocity with clamped delta time
      obj.x += obj.vx * clampedDeltaTime;
      obj.y += obj.vy * clampedDeltaTime;
      obj.z += obj.vz * clampedDeltaTime;

      // Apply acceleration with clamped delta time
      obj.vx += obj.ax * clampedDeltaTime;
      obj.vy += obj.ay * clampedDeltaTime;
      obj.vz += obj.az * clampedDeltaTime;

      // Ground collision
      if (obj.y <= GROUND_LEVEL + obj.radius) {
        obj.y = GROUND_LEVEL + obj.radius;
        obj.vy = 0;
        obj.isGrounded = true;

        // Friction on ground
        obj.vx *= FRICTION;
        obj.vz *= FRICTION;
      } else {
        obj.isGrounded = false;
        // Air friction
        obj.vx *= AIR_FRICTION;
        obj.vz *= AIR_FRICTION;
      }

      // Reset acceleration
      obj.ax = 0;
      obj.az = 0;
    });

    // Check collisions only if we have reasonable number of objects
    if (this.objects.size <= 20) { // Limit collision checks for performance
      this.checkCollisions();
    }
  }

  applyForce(id: string, fx: number, fy: number, fz: number) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.ax += fx / obj.mass;
      obj.ay += fy / obj.mass;
      obj.az += fz / obj.mass;
    }
  }

  applyImpulse(id: string, ix: number, iy: number, iz: number) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.vx += ix / obj.mass;
      obj.vy += iy / obj.mass;
      obj.vz += iz / obj.mass;
    }
  }

  private checkCollisions() {
    const objArray = Array.from(this.objects.values());

    for (let i = 0; i < objArray.length; i++) {
      for (let j = i + 1; j < objArray.length; j++) {
        const obj1 = objArray[i];
        const obj2 = objArray[j];

        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const dz = obj2.z - obj1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDistance = obj1.radius + obj2.radius;

        if (distance < minDistance) {
          this.resolveCollision(obj1, obj2, dx, dy, dz, distance);
        }
      }
    }
  }

  private resolveCollision(
    obj1: PhysicsObject,
    obj2: PhysicsObject,
    dx: number,
    dy: number,
    dz: number,
    distance: number
  ) {
    // Normal vector
    const nx = dx / distance;
    const ny = dy / distance;
    const nz = dz / distance;

    // Relative velocity
    const dvx = obj2.vx - obj1.vx;
    const dvy = obj2.vy - obj1.vy;
    const dvz = obj2.vz - obj1.vz;

    // Relative velocity dot normal
    const dvn = dvx * nx + dvy * ny + dvz * nz;

    // If objects are moving apart, don't resolve
    if (dvn >= 0) return;

    // Impulse scalar
    const e = 0.8; // Restitution (bounciness)
    const restitution = -(1 + e) * dvn / (1 / obj1.mass + 1 / obj2.mass);

    // Apply impulse
    const impulseX = restitution * nx;
    const impulseY = restitution * ny;
    const impulseZ = restitution * nz;

    obj1.vx -= impulseX / obj1.mass;
    obj1.vy -= impulseY / obj1.mass;
    obj1.vz -= impulseZ / obj1.mass;

    obj2.vx += impulseX / obj2.mass;
    obj2.vy += impulseY / obj2.mass;
    obj2.vz += impulseZ / obj2.mass;

    // Separate objects
    const minDistance = obj1.radius + obj2.radius;
    const overlap = minDistance - distance;
    const separationX = (overlap / 2) * nx;
    const separationY = (overlap / 2) * ny;
    const separationZ = (overlap / 2) * nz;

    obj1.x -= separationX;
    obj1.y -= separationY;
    obj1.z -= separationZ;

    obj2.x += separationX;
    obj2.y += separationY;
    obj2.z += separationZ;
  }

  getObjects(): PhysicsObject[] {
    return Array.from(this.objects.values());
  }
}


