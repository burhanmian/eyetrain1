/**
 * PoseDetector – wraps MediaPipe Pose for real-time webcam tracking.
 *
 * MediaPipe returns 33 landmarks (normalised 0-1 x/y, depth z).
 * We re-index them into named joints that match the BVH skeleton
 * and compute simple Euler rotations from bone vectors.
 *
 * Landmark indices (MediaPipe Pose):
 *  0  nose          11 leftShoulder   12 rightShoulder
 * 13  leftElbow     14 rightElbow     15 leftWrist      16 rightWrist
 * 23  leftHip       24 rightHip       25 leftKnee       26 rightKnee
 * 27  leftAnkle     28 rightAnkle     11/12 midShoulder (computed)
 * 23/24 midHip (hips, computed)
 */

import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';

export { POSE_CONNECTIONS };

// MediaPipe landmark index map
const LM = {
  nose: 0,
  leftEye: 1, rightEye: 2,
  leftEar: 7, rightEar: 8,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
  leftHeel: 29, rightHeel: 30
};

// Compute midpoint between two landmarks
function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 };
}

// Vector from a to b
function vec(a, b) {
  return { x: b.x - a.x, y: b.y - a.y, z: (b.z || 0) - (a.z || 0) };
}

// Angle (deg) of 2D vector
function atan2Deg(dy, dx) {
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Convert raw MediaPipe landmarks to named joints with position + rotation.
 * Positions are normalised (0-1).  Rotations are rough Euler angles in degrees.
 */
export function landmarksToJoints(lm) {
  if (!lm || lm.length < 29) return null;

  const get = idx => lm[idx] || { x: 0, y: 0, z: 0 };

  const lShoulder = get(LM.leftShoulder);
  const rShoulder = get(LM.rightShoulder);
  const lHip      = get(LM.leftHip);
  const rHip      = get(LM.rightHip);
  const lElbow    = get(LM.leftElbow);
  const rElbow    = get(LM.rightElbow);
  const lWrist    = get(LM.leftWrist);
  const rWrist    = get(LM.rightWrist);
  const lKnee     = get(LM.leftKnee);
  const rKnee     = get(LM.rightKnee);
  const lAnkle    = get(LM.leftAnkle);
  const rAnkle    = get(LM.rightAnkle);
  const nose      = get(LM.nose);

  const hips   = mid(lHip, rHip);
  const neck   = mid(lShoulder, rShoulder);
  const spine1 = mid(hips, neck);
  const spine  = mid(hips, spine1);

  // Simple rotation calculation: angle of bone vector
  const boneAngle = (a, b) => {
    const v = vec(a, b);
    return {
      rx: atan2Deg(-v.y, Math.sqrt(v.x * v.x + v.z * v.z)),
      ry: atan2Deg(v.x, v.z),
      rz: atan2Deg(v.x, -v.y)
    };
  };

  return {
    hips,
    spine:  { ...spine,  ...boneAngle(hips,  neck) },
    spine1: { ...spine1, ...boneAngle(spine, neck) },
    neck:   { ...neck,   ...boneAngle(neck,  nose) },
    head:   { ...nose,   rx: 0, ry: 0, rz: 0 },

    leftShoulder:  { ...lShoulder,  ...boneAngle(lShoulder, lElbow) },
    leftArm:       { ...lElbow,     ...boneAngle(lShoulder, lElbow) },
    leftForeArm:   { ...lWrist,     ...boneAngle(lElbow,    lWrist) },
    leftHand:      { ...lWrist,     rx: 0, ry: 0, rz: 0 },

    rightShoulder: { ...rShoulder,  ...boneAngle(rShoulder, rElbow) },
    rightArm:      { ...rElbow,     ...boneAngle(rShoulder, rElbow) },
    rightForeArm:  { ...rWrist,     ...boneAngle(rElbow,    rWrist) },
    rightHand:     { ...rWrist,     rx: 0, ry: 0, rz: 0 },

    leftUpLeg:  { ...lHip,   ...boneAngle(lHip,   lKnee) },
    leftLeg:    { ...lKnee,  ...boneAngle(lKnee,  lAnkle) },
    leftFoot:   { ...lAnkle, rx: 0, ry: 0, rz: 0 },

    rightUpLeg: { ...rHip,   ...boneAngle(rHip,   rKnee) },
    rightLeg:   { ...rKnee,  ...boneAngle(rKnee,  rAnkle) },
    rightFoot:  { ...rAnkle, rx: 0, ry: 0, rz: 0 }
  };
}

// ─────────────────────────────────────────────────────────────
// PoseDetector class
// ─────────────────────────────────────────────────────────────
export class PoseDetector {
  constructor({ onResult, onError } = {}) {
    this.onResult = onResult || (() => {});
    this.onError  = onError  || console.error;
    this.pose     = null;
    this.running  = false;
  }

  async init() {
    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    this.pose.setOptions({
      modelComplexity:     1,
      smoothLandmarks:     true,
      enableSegmentation:  false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5
    });

    this.pose.onResults(results => {
      if (!results.poseLandmarks) return;
      const joints = landmarksToJoints(results.poseLandmarks);
      if (joints) this.onResult({ joints, landmarks: results.poseLandmarks });
    });

    await this.pose.initialize();
    this.running = true;
  }

  async processFrame(videoElement) {
    if (!this.pose || !this.running) return;
    await this.pose.send({ image: videoElement });
  }

  destroy() {
    this.running = false;
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
  }
}
