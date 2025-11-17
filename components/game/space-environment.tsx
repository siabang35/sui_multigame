'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function SpaceEnvironment() {
  return (
    <>
      {/* Space Boundaries - Invisible walls */}
      <SpaceBoundary position={[200, 0, 0]} rotation={[0, 0, 0]} />
      <SpaceBoundary position={[-200, 0, 0]} rotation={[0, 0, 0]} />
      <SpaceBoundary position={[0, 0, 200]} rotation={[0, Math.PI / 2, 0]} />
      <SpaceBoundary position={[0, 0, -200]} rotation={[0, Math.PI / 2, 0]} />
      <SpaceBoundary position={[0, 100, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <SpaceBoundary position={[0, -100, 0]} rotation={[-Math.PI / 2, 0, 0]} />

      {/* Asteroid Field */}
      <AsteroidField />

      {/* Space Stations/Platforms */}
      <SpacePlatform position={[50, 0, 50]} />
      <SpacePlatform position={[-50, 0, 50]} />
      <SpacePlatform position={[50, 0, -50]} />
      <SpacePlatform position={[-50, 0, -50]} />

      {/* Central Space Station */}
      <CentralSpaceStation />

      {/* Space Debris */}
      <SpaceDebris />

      {/* Energy Fields */}
      <EnergyFields />
    </>
  );
}

function SpaceBoundary({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[400, 200]} />
      <meshBasicMaterial
        color="#ff0000"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AsteroidField() {
  const asteroids = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 300,
      ] as [number, number, number],
      scale: Math.random() * 2 + 0.5,
      rotation: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ] as [number, number, number],
    }));
  }, []);

  return (
    <>
      {asteroids.map((asteroid, index) => (
        <Asteroid
          key={index}
          position={asteroid.position}
          scale={asteroid.scale}
          rotation={asteroid.rotation}
        />
      ))}
    </>
  );
}

function Asteroid({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.z += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale} rotation={rotation}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

function SpacePlatform({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Platform Base */}
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[8, 8, 1, 16]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Platform Pillars */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 6;
        const z = Math.sin(angle) * 6;
        return (
          <mesh key={i} position={[x, -1, z]}>
            <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
            <meshStandardMaterial
              color="#444444"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CentralSpaceStation() {
  const stationRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (stationRef.current) {
      stationRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={stationRef} position={[0, 0, 0]}>
      {/* Central Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial
          color="#00c8ff"
          emissive="#00c8ff"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Rotating Rings */}
      {[10, 15, 20].map((radius, index) => (
        <mesh key={index} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.5, 32]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#00c8ff" : "#ff00ff"}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Energy Beams */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <EnergyBeam
            key={i}
            start={[Math.cos(angle) * 25, 0, Math.sin(angle) * 25]}
            end={[Math.cos(angle) * 35, 0, Math.sin(angle) * 35]}
          />
        );
      })}
    </group>
  );
}

function EnergyBeam({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
          args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00ff88" />
    </line>
  );
}

function SpaceDebris() {
  const debris = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 400,
      ] as [number, number, number],
      type: Math.floor(Math.random() * 3), // 0: cube, 1: sphere, 2: cylinder
    }));
  }, []);

  return (
    <>
      {debris.map((item, index) => (
        <DebrisItem
          key={index}
          position={item.position}
          type={item.type}
        />
      ))}
    </>
  );
}

function DebrisItem({ position, type }: { position: [number, number, number]; type: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.015;
      meshRef.current.position.y += Math.sin(state.clock.getElapsedTime() + position[0]) * 0.002;
    }
  });

  const geometry = useMemo(() => {
    switch (type) {
      case 0: return <boxGeometry args={[1, 1, 1]} />;
      case 1: return <sphereGeometry args={[0.5, 8, 8]} />;
      case 2: return <cylinderGeometry args={[0.3, 0.3, 1, 8]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [type]);

  return (
    <mesh ref={meshRef} position={position}>
      {geometry}
      <meshStandardMaterial
        color="#666666"
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  );
}

function EnergyFields() {
  const fieldsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (fieldsRef.current) {
      fieldsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={fieldsRef}>
      {[30, 50, 70, 90].map((radius, index) => (
        <mesh key={index} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 1, 64]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#00c8ff" : "#ff00ff"}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
