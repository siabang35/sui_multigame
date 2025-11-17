'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-state';
import { useGameController } from '@/hooks/use-game-controller';
import { MultiplayerGameController } from '@/lib/game-controller';

export function PlayerModel() {
  const groupRef = useRef<THREE.Group>(null);
  const gameState = useGameStore((state) => state.game);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const { inputState } = useGameController();
  const otherPlayers = gameState.otherPlayers;
  const controller = useGameController();

  useFrame((state, delta) => {
    if (!gameState.currentPlayer) return;

    // Update game controller with delta time
    (controller as MultiplayerGameController).update(delta);
  });

  return (
    <>
      {/* Current Player Spaceship */}
      {gameState.currentPlayer && (
        <group ref={groupRef} position={[gameState.currentPlayer.x, gameState.currentPlayer.y, gameState.currentPlayer.z]}>
          <Spaceship isLocalPlayer={true} player={gameState.currentPlayer} />
        </group>
      )}

      {/* Other Player Spaceships */}
      {otherPlayers.map((player) => (
        <group key={player.id} position={[player.x, player.y, player.z]}>
          <Spaceship isLocalPlayer={false} playerName={player.username} player={player} />
        </group>
      ))}
    </>
  );
}

interface SpaceshipProps {
  isLocalPlayer: boolean;
  playerName?: string;
  player: any;
}

function Spaceship({ isLocalPlayer, playerName, player }: SpaceshipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Mesh>(null);
  const healthBarRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation for spaceship
      groupRef.current.rotation.y += 0.005;
    }

    // Engine glow animation
    if (engineRef.current && engineRef.current.material) {
      const material = engineRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6 + Math.sin(state.clock.getElapsedTime() * 10) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Spaceship Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <coneGeometry args={[1.5, 4, 8]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          emissive={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          emissiveIntensity={0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Cockpit */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          color="#87CEEB"
          emissive="#87CEEB"
          emissiveIntensity={0.1}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Wings */}
      <mesh castShadow receiveShadow position={[2, -0.5, 0]}>
        <boxGeometry args={[3, 0.2, 1]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          emissive={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          emissiveIntensity={0.1}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[-2, -0.5, 0]}>
        <boxGeometry args={[3, 0.2, 1]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          emissive={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          emissiveIntensity={0.1}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Engine Exhaust */}
      <mesh ref={engineRef} position={[0, -2.5, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 1, 8]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Rocket Boosters */}
      <mesh position={[0.8, -1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1, 6]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[-0.8, -1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1, 6]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Weapon Systems */}
      <mesh position={[1.2, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 6]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[-1.2, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 6]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Energy Shield */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff4444'}
          transparent
          opacity={0.05}
          wireframe
        />
      </mesh>

      {/* Health Bar Background */}
      <mesh position={[0, 3, 0]}>
        <planeGeometry args={[2, 0.2]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      {/* Health Bar */}
      <mesh ref={healthBarRef} position={[-0.8 + (1.6 * (1 - player.health / 100)), 3, 0.01]}>
        <planeGeometry args={[1.6 * (player.health / 100), 0.15]} />
        <meshBasicMaterial
          color={isLocalPlayer ? '#00ff00' : '#ff6600'}
        />
      </mesh>

      {/* Name Tag */}
      {playerName && (
        <Html position={[0, 3.5, 0]}>
          <div className="text-xs text-cyan-400 font-bold whitespace-nowrap px-2 py-1 bg-black/80 rounded border border-cyan-400/50">
            {playerName}
          </div>
        </Html>
      )}

      {/* Attack Range Indicator */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.02}
          wireframe
        />
      </mesh>
    </group>
  );
}

// Removed HtmlPortal - using Html directly now
