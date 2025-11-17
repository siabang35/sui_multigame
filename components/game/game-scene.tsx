'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerModel } from './player-model';
import { SpaceEnvironment } from './space-environment';
import { useGameStore } from '@/lib/game-state';
import { useIsMobile } from '@/components/ui/use-mobile';

interface GameSceneProps {
  isMultiplayer?: boolean;
}

export function GameScene({ isMultiplayer = true }: GameSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const gameState = useGameStore((state) => state.game);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWindowSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Set loading to false after a short delay to ensure everything is rendered
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen if no game state or still loading
  if (windowSize.width === 0 || isLoading || !gameState.gameId || !gameState.currentPlayer) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400 text-lg font-semibold">Loading Space Arena...</p>
          <p className="text-gray-400 text-sm mt-2">
            {!gameState.gameId ? 'Waiting for game data...' :
             !gameState.currentPlayer ? 'Initializing player...' :
             'Preparing spaceship battlefield'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      <Canvas
        className="!h-full"
        camera={{ position: [0, 0, 50], fov: isMobile ? 75 : 60 }}
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={isMobile ? 75 : 60} />

        {/* Space Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#00c8ff" />
        <pointLight position={[100, 50, 100]} intensity={0.3} color="#ff00ff" />
        <pointLight position={[-100, -50, -100]} intensity={0.3} color="#00ff88" />

        {/* Space Environment */}
        <Stars radius={500} depth={50} count={isMobile ? 5000 : 10000} factor={4} />
        <Environment preset="night" />

        {/* Space Game World */}
        <SpaceEnvironment />

        {/* Player Spaceships */}
        <PlayerModel />

        {/* Space Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          autoRotate={false}
          minDistance={20}
          maxDistance={200}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>

      {/* Space HUD Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className={`absolute top-4 ${isMobile ? 'left-2 right-2' : 'left-4 right-4'} flex justify-between items-start pointer-events-auto`}>
          <div className="space-y-2">
            <div className={`text-cyan-400 font-bold ${isMobile ? 'text-base' : 'text-sm'} glow-cyan`}>SPACE SHOOTER</div>
            <div className="text-xs text-gray-400">Sui Testnet</div>
          </div>
          <div className="space-y-2 text-right">
            <div className="text-xs text-gray-400">PING: 12ms</div>
            <div className="text-xs text-gray-400">FPS: 60</div>
          </div>
        </div>

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-6 h-6 border border-cyan-400 rounded-full opacity-50">
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for camera following player
function CameraController() {
  const { camera } = useThree();
  const gameState = useGameStore((state) => state.game);
  const targetPosition = new THREE.Vector3();

  useFrame(() => {
    if (gameState.currentPlayer) {
      const player = gameState.currentPlayer;
      targetPosition.set(player.x - 15, player.y + 10, player.z + 20);

      camera.position.lerp(targetPosition, 0.05);
      camera.lookAt(player.x, player.y, player.z);
    }
  });

  return null;
}
