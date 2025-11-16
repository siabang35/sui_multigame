'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerModel } from './player-model';
import { GameEnvironment } from './game-environment';
import { useGameStore } from '@/lib/game-state';
import { useIsMobile } from '@/components/ui/use-mobile';

interface GameSceneProps {
  isMultiplayer?: boolean;
}

export function GameScene({ isMultiplayer = true }: GameSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const isMobile = useIsMobile();

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

  if (windowSize.width === 0) return null;

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-background">
      <Canvas
        className="!h-full"
        camera={{ position: [0, 15, 25], fov: isMobile ? 75 : 60 }}
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <PerspectiveCamera makeDefault position={[0, 15, 25]} fov={isMobile ? 75 : 60} />

        {/* Enhanced Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        <pointLight position={[0, 20, 0]} intensity={0.5} color="#00c8ff" />
        <pointLight position={[50, 15, 50]} intensity={0.3} color="#ff00ff" />
        <pointLight position={[-50, 15, -50]} intensity={0.3} color="#00ff88" />

        {/* Environment */}
        <Sky
          distance={450000}
          sunPosition={[100, 50, 100]}
          inclination={0.6}
          azimuth={0.25}
        />
        <Stars radius={300} depth={60} count={isMobile ? 10000 : 20000} factor={7} />
        <Environment preset="night" />

        {/* Game World */}
        <GameEnvironment />

        {/* Player Model */}
        <PlayerModel />

        {/* Controls - Mobile optimized */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          autoRotate={false}
          minDistance={isMobile ? 15 : 10}
          maxDistance={isMobile ? 80 : 100}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enablePan={isMobile ? false : true}
          enableZoom={isMobile ? false : true}
          enableRotate={true}
        />
      </Canvas>

      {/* HUD Overlay - Mobile responsive */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className={`absolute top-4 ${isMobile ? 'left-2 right-2' : 'left-4 right-4'} flex justify-between items-start pointer-events-auto`}>
          <div className="space-y-2">
            <div className={`text-primary font-bold ${isMobile ? 'text-base' : 'text-sm'} glow-cyan`}>MULTIPLY</div>
            <div className="text-xs text-muted-foreground">Sui Testnet</div>
          </div>
          <div className="space-y-2 text-right">
            <div className="text-xs text-muted-foreground">PING: 12ms</div>
            <div className="text-xs text-muted-foreground">FPS: 60</div>
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
