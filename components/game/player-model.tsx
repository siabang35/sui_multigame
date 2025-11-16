'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-state';

export function PlayerModel() {
  const groupRef = useRef<THREE.Group>(null);
  const gameState = useGameStore((state) => state.game);
  const otherPlayers = gameState.otherPlayers;

  return (
    <>
      {/* Current Player */}
      {gameState.currentPlayer && (
        <group ref={groupRef} position={[gameState.currentPlayer.x, gameState.currentPlayer.y, gameState.currentPlayer.z]}>
          <PlayerCharacter isLocalPlayer={true} />
        </group>
      )}

      {/* Other Players */}
      {otherPlayers.map((player) => (
        <group key={player.id} position={[player.x, player.y, player.z]}>
          <PlayerCharacter isLocalPlayer={false} playerName={player.username} />
        </group>
      ))}
    </>
  );
}

interface PlayerCharacterProps {
  isLocalPlayer: boolean;
  playerName?: string;
}

function PlayerCharacter({ isLocalPlayer, playerName }: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const healthBarRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Player Body */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <capsuleGeometry args={[0.4, 2, 4, 8]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff00ff'}
          emissive={isLocalPlayer ? '#00c8ff' : '#ff00ff'}
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff00ff'}
          emissive={isLocalPlayer ? '#00c8ff' : '#ff00ff'}
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.12, 2.35, -0.3]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00ff00"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[-0.12, 2.35, -0.3]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00ff00"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Glowing Aura */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={isLocalPlayer ? '#00c8ff' : '#ff00ff'}
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Health Bar Background */}
      <mesh position={[0, 3.2, 0]}>
        <planeGeometry args={[1, 0.15]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      {/* Health Bar */}
      <mesh ref={healthBarRef} position={[-0.4, 3.2, 0.01]}>
        <planeGeometry args={[0.8, 0.1]} />
        <meshBasicMaterial
          color={isLocalPlayer ? '#00ff00' : '#ff6600'}
        />
      </mesh>

      {/* Name Tag */}
      {playerName && (
        <HtmlPortal position={[0, 3.5, 0]}>
          <div className="text-xs text-primary font-bold whitespace-nowrap px-2 py-1 bg-background/80 rounded border border-primary/50 glow-cyan">
            {playerName}
          </div>
        </HtmlPortal>
      )}

      {/* Attack Range Indicator (if attacking) */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[3, 32, 32]} />
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

// Simple HTML portal for name tags
function HtmlPortal({ position, children }: { position: [number, number, number]; children: React.ReactNode }) {
  return <group position={position}>{children}</group>;
}
