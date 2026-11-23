import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Bean({ position, rotation, scale = 1 }: { position: [number, number, number]; rotation: [number, number, number]; scale?: number }) {
  const crease = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = -0.88 + (1.76 * i) / 24;
      pts.push(new THREE.Vector3(x, 0.07 * Math.sin(x * 3.2), 0.55 * Math.sqrt(Math.max(0, 1 - x * x)) + 0.004));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.032, 8, false);
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh scale={[1, 0.72, 0.55]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial color="#6b4630" roughness={0.42} metalness={0.05} />
      </mesh>
      <mesh geometry={crease} scale={[1, 1, 1]}><meshStandardMaterial color="#160d09" roughness={0.9} /></mesh>
    </group>
  );
}

function Cluster() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer }, dt) => {
    if (!g.current) return;
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, pointer.x * 0.5, 3, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -pointer.y * 0.3, 3, dt);
  });
  return (
    <group ref={g}>
      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.5}><Bean position={[0, 0, 0]} rotation={[0.9, 0.3, -0.4]} scale={1.55} /></Float>
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.7}><Bean position={[-1.9, 1.1, -0.8]} rotation={[0.2, 0.9, 0.6]} scale={0.8} /></Float>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}><Bean position={[1.9, 1.2, -1.2]} rotation={[1.1, -0.4, 0.2]} scale={0.62} /></Float>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.8}><Bean position={[1.7, -1.3, 0.2]} rotation={[0.5, 0.2, 1.0]} scale={0.85} /></Float>
      <Float speed={1.3} rotationIntensity={0.3} floatIntensity={0.6}><Bean position={[-1.6, -1.4, -0.4]} rotation={[-0.4, 0.8, -0.9]} scale={0.7} /></Float>
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6.2], fov: 38 }} gl={{ antialias: true, alpha: true }} aria-hidden>
      <ambientLight intensity={0.55} color="#F5F0E7" />
      <hemisphereLight args={['#EAE0D2', '#2B1B16', 0.6]} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} color="#FFE9CC" />
      <directionalLight position={[-4, -1, 2]} intensity={0.8} color="#C6AD8B" />
      <Cluster />
    </Canvas>
  );
}
