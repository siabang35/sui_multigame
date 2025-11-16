'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function GameEnvironment() {
  // Ground
  return (
    <>
      {/* Main Arena Ground */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.7}
          map={createGridTexture()}
        />
      </mesh>

      {/* Arena Boundaries - Glowing walls */}
      <ArenaWall position={[100, 5, 0]} rotation={[0, 0, 0]} />
      <ArenaWall position={[-100, 5, 0]} rotation={[0, 0, 0]} />
      <ArenaWall position={[0, 5, 100]} rotation={[0, Math.PI / 2, 0]} />
      <ArenaWall position={[0, 5, -100]} rotation={[0, Math.PI / 2, 0]} />

      {/* Platforms */}
      <Platform position={[30, 3, 30]} scale={[8, 1, 8]} />
      <Platform position={[-30, 3, 30]} scale={[8, 1, 8]} />
      <Platform position={[30, 3, -30]} scale={[8, 1, 8]} />
      <Platform position={[-30, 3, -30]} scale={[8, 1, 8]} />

      {/* Central Platform */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <cylinderGeometry args={[15, 15, 0.5, 32]} />
        <meshStandardMaterial
          color="#00c8ff"
          emissive="#00c8ff"
          emissiveIntensity={0.2}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Enhanced Decorative Objects */}
      <FloatingCube position={[50, 5, 50]} color="#00ff88" />
      <FloatingCube position={[-50, 5, 50]} color="#ff00ff" />
      <FloatingCube position={[50, 5, -50]} color="#00c8ff" />
      <FloatingCube position={[-50, 5, -50]} color="#ff8800" />

      {/* Enhanced Ambient Particles Effect */}
      <ParticleCloud />
      <EnergyRings />
      <FloatingOrbs />
    </>
  );
}

function ArenaWall({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={[200, 10, 1]} />
      <meshStandardMaterial
        color="#0a0e27"
        emissive="#00c8ff"
        emissiveIntensity={0.15}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function Platform({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale}>
      <boxGeometry />
      <meshStandardMaterial
        color="#ff00ff"
        emissive="#ff00ff"
        emissiveIntensity={0.2}
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  );
}

function FloatingCube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = position[1] + Math.sin(time * 2 + position[0] * 0.1) * 3;
      meshRef.current.rotation.x = time * 0.5;
      meshRef.current.rotation.y = time * 0.7;
      meshRef.current.rotation.z = time * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow position={position}>
      <boxGeometry args={[4, 4, 4]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function ParticleCloud() {
  const particlesRef = React.useRef<THREE.Points>(null);

  React.useEffect(() => {
    if (!particlesRef.current) return;

    const geometry = new THREE.BufferGeometry();
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = Math.random() * 30;
      positions[i + 2] = (Math.random() - 0.5) * 200;

      // Random colors for particles
      colors[i] = Math.random() * 0.5 + 0.5; // R
      colors[i + 1] = Math.random() * 0.5 + 0.5; // G
      colors[i + 2] = Math.random() * 0.5 + 0.5; // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesRef.current.geometry = geometry;
  }, []);

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation={true}
      />
    </points>
  );
}

function EnergyRings() {
  const ringsRef = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={ringsRef}>
      {[20, 40, 60, 80].map((radius, index) => (
        <mesh key={index} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.5, 64]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#00c8ff" : "#ff00ff"}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingOrbs() {
  const orbsRef = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    if (orbsRef.current) {
      const time = state.clock.getElapsedTime();
      orbsRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        mesh.position.y = 8 + Math.sin(time * 1.5 + index * Math.PI / 3) * 4;
        mesh.rotation.x = time * 0.8 + index;
        mesh.rotation.y = time * 1.2 + index;
      });
    }
  });

  return (
    <group ref={orbsRef}>
      {[
        { pos: [25, 8, 25], color: "#00ff88" },
        { pos: [-25, 8, 25], color: "#ff00ff" },
        { pos: [25, 8, -25], color: "#00c8ff" },
        { pos: [-25, 8, -25], color: "#ff8800" },
        { pos: [0, 8, 35], color: "#8800ff" },
        { pos: [0, 8, -35], color: "#ff0088" },
      ].map((orb, index) => (
        <mesh key={index} position={orb.pos as [number, number, number]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial
            color={orb.color}
            emissive={orb.color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function createGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;

    for (let i = 0; i < 64; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 64);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(64, i);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.repeat.set(10, 10);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}
