/**
 * Skeleton3DViewer – Three.js real-time 3D skeleton display.
 * Uses @react-three/fiber and @react-three/drei.
 *
 * joints: { [name]: { x, y, z } }  (normalised 0-1 coords from webcam, or metres from Kinect)
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

const BONES = [
  ['hips',         'spine'],
  ['spine',        'spine1'],
  ['spine1',       'neck'],
  ['neck',         'head'],
  ['spine1',       'leftShoulder'],
  ['leftShoulder', 'leftArm'],
  ['leftArm',      'leftForeArm'],
  ['leftForeArm',  'leftHand'],
  ['spine1',       'rightShoulder'],
  ['rightShoulder','rightArm'],
  ['rightArm',     'rightForeArm'],
  ['rightForeArm', 'rightHand'],
  ['hips',         'leftUpLeg'],
  ['leftUpLeg',    'leftLeg'],
  ['leftLeg',      'leftFoot'],
  ['hips',         'rightUpLeg'],
  ['rightUpLeg',   'rightLeg'],
  ['rightLeg',     'rightFoot'],
];

// Convert unified joint position (webcam or Kinect) to Three.js world coords
function toWorld(j, source) {
  if (!j) return new THREE.Vector3(0, 0, 0);
  if (source === 'kinect') {
    // Kinect coords are in metres, already world-space
    return new THREE.Vector3(j.x, j.y, j.z);
  }
  // Webcam: normalised 0-1, y is inverted
  return new THREE.Vector3(
    (j.x - 0.5) * 2,
    -(j.y - 0.5) * 2,
    (j.z || 0) * 2
  );
}

function BoneLine({ start, end }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current || !start || !end) return;
    const positions = ref.current.geometry.attributes.position;
    positions.setXYZ(0, start.x, start.y, start.z);
    positions.setXYZ(1, end.x,   end.y,   end.z);
    positions.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      0, 0, 0
    ], 3));
    return geo;
  }, []);

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#00ff88" linewidth={2} />
    </line>
  );
}

function JointSphere({ position }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current && position) {
      ref.current.position.set(position.x, position.y, position.z);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshStandardMaterial color="#00ccff" emissive="#004466" />
    </mesh>
  );
}

function Skeleton({ joints, source }) {
  if (!joints) return null;

  const worldJoints = {};
  for (const name of Object.keys(joints)) {
    worldJoints[name] = toWorld(joints[name], source);
  }

  return (
    <group>
      {BONES.map(([a, b]) => {
        if (!worldJoints[a] || !worldJoints[b]) return null;
        return (
          <BoneLine key={`${a}-${b}`} start={worldJoints[a]} end={worldJoints[b]} />
        );
      })}
      {Object.entries(worldJoints).map(([name, pos]) => (
        <JointSphere key={name} position={pos} />
      ))}
    </group>
  );
}

export default function Skeleton3DViewer({ joints, source = 'webcam' }) {
  return (
    <div style={{ width: '100%', height: 340, borderRadius: 12, overflow: 'hidden',
                  background: 'linear-gradient(135deg, #0d0d2b 0%, #1a1a3e 100%)',
                  border: '1px solid rgba(0,255,136,0.2)' }}>
      <Canvas camera={{ position: [0, 0.5, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 3, 2]} intensity={1} color="#7070ff" />
        <pointLight position={[-2, -1, -2]} intensity={0.5} color="#00ffaa" />

        <Grid
          args={[6, 6]}
          position={[0, -1.5, 0]}
          cellColor="#1a1a4a"
          sectionColor="#2a2a6a"
          fadeDistance={10}
        />

        <Skeleton joints={joints} source={source} />

        <OrbitControls
          enablePan={false}
          minDistance={1}
          maxDistance={6}
          autoRotate={!joints}
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  );
}
