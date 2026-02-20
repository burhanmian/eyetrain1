/**
 * SkeletonOverlay
 * Draws a 2D skeleton on a canvas element sized to match a video feed.
 * Accepts either:
 *   landmarks – raw MediaPipe 33-landmark array (for webcam)
 *   joints    – unified named-joint object (for Kinect or processed data)
 */
import React, { useRef, useEffect } from 'react';

// MediaPipe Pose connections (pairs of landmark indices)
const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],  // arms
  [11, 23], [12, 24], [23, 24],                        // torso
  [23, 25], [25, 27], [24, 26], [26, 28],              // legs
  [0,  11], [0,  12],                                  // head-shoulders
];

// Named joint connections for Kinect / unified schema
const NAMED_CONNECTIONS = [
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

export default function SkeletonOverlay({ landmarks, joints, width = 640, height = 480 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarks) drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
    else if (joints) drawNamedJoints(ctx, joints, canvas.width, canvas.height);
  }, [landmarks, joints]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    />
  );
}

function drawLandmarks(ctx, lm, w, h) {
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth   = 2;

  // Draw connections
  for (const [a, b] of CONNECTIONS) {
    if (!lm[a] || !lm[b]) continue;
    if (lm[a].visibility < 0.3 || lm[b].visibility < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }

  // Draw joints
  ctx.fillStyle = '#00ffff';
  for (const pt of lm) {
    if (!pt || pt.visibility < 0.3) continue;
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNamedJoints(ctx, joints, w, h) {
  // Kinect joints arrive as real-world coords (metres, roughly -2 to +2).
  // Normalise to 0-1 by mapping x: [-1, 1] → [0, 1], y: [2, -0.5] → [0, 1]
  const nx = v => (v + 1.5) / 3;
  const ny = v => 1 - (v + 0.5) / 3;

  ctx.strokeStyle = '#ff9900';
  ctx.lineWidth   = 2;

  for (const [a, b] of NAMED_CONNECTIONS) {
    if (!joints[a] || !joints[b]) continue;
    ctx.beginPath();
    ctx.moveTo(nx(joints[a].x) * w, ny(joints[a].y) * h);
    ctx.lineTo(nx(joints[b].x) * w, ny(joints[b].y) * h);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffcc00';
  for (const name of Object.keys(joints)) {
    const j = joints[name];
    if (!j) continue;
    ctx.beginPath();
    ctx.arc(nx(j.x) * w, ny(j.y) * h, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
