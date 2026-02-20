/**
 * KinectMapper
 *
 * Maps raw joint data from Kinect v1 (20 joints) or Kinect v2 (25 joints)
 * to the unified named joint schema used by the rest of the app.
 *
 * The Python bridge sends joint positions as:
 *   { jointName: { x, y, z, state } }
 *
 * Kinect v1 joints (KinectSDK 1.8 / OpenNI):
 *   HipCenter, Spine, ShoulderCenter, Head,
 *   ShoulderLeft, ElbowLeft, WristLeft, HandLeft,
 *   ShoulderRight, ElbowRight, WristRight, HandRight,
 *   HipLeft, KneeLeft, AnkleLeft, FootLeft,
 *   HipRight, KneeRight, AnkleRight, FootRight
 *
 * Kinect v2 joints (KinectSDK 2.0):
 *   SpineBase, SpineMid, Neck, Head,
 *   ShoulderLeft, ElbowLeft, WristLeft, HandLeft,
 *   ShoulderRight, ElbowRight, WristRight, HandRight,
 *   HipLeft, KneeLeft, AnkleLeft, FootLeft,
 *   HipRight, KneeRight, AnkleRight, FootRight,
 *   SpineShoulder, HandTipLeft, ThumbLeft, HandTipRight, ThumbRight
 */

function mid(a, b) {
  if (!a || !b) return { x: 0, y: 0, z: 0 };
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

function boneRotation(from, to) {
  if (!from || !to) return { rx: 0, ry: 0, rz: 0 };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const toDeg = r => (r * 180) / Math.PI;
  return {
    rx: toDeg(Math.atan2(-dy, Math.sqrt(dx * dx + dz * dz))),
    ry: toDeg(Math.atan2(dx, dz)),
    rz: toDeg(Math.atan2(dx, -dy))
  };
}

/**
 * Convert Kinect v1 joints to unified schema.
 * @param {Object} raw – raw joint map from bridge
 */
export function fromKinectV1(raw) {
  const g = name => raw[name] || { x: 0, y: 0, z: 0 };

  const hipL    = g('HipLeft');
  const hipR    = g('HipRight');
  const hipC    = g('HipCenter');
  const spine   = g('Spine');
  const shouldC = g('ShoulderCenter');
  const head    = g('Head');
  const shouldL = g('ShoulderLeft');
  const elbowL  = g('ElbowLeft');
  const wristL  = g('WristLeft');
  const shouldR = g('ShoulderRight');
  const elbowR  = g('ElbowRight');
  const wristR  = g('WristRight');
  const kneeL   = g('KneeLeft');
  const ankleL  = g('AnkleLeft');
  const kneeR   = g('KneeRight');
  const ankleR  = g('AnkleRight');

  return {
    hips:          { ...hipC },
    spine:         { ...spine,   ...boneRotation(hipC,   shouldC) },
    spine1:        { ...shouldC, ...boneRotation(spine,  shouldC) },
    neck:          { ...shouldC, ...boneRotation(shouldC, head) },
    head:          { ...head,    rx: 0, ry: 0, rz: 0 },

    leftShoulder:  { ...shouldL, ...boneRotation(shouldL, elbowL) },
    leftArm:       { ...elbowL,  ...boneRotation(shouldL, elbowL) },
    leftForeArm:   { ...wristL,  ...boneRotation(elbowL,  wristL) },
    leftHand:      { ...wristL,  rx: 0, ry: 0, rz: 0 },

    rightShoulder: { ...shouldR, ...boneRotation(shouldR, elbowR) },
    rightArm:      { ...elbowR,  ...boneRotation(shouldR, elbowR) },
    rightForeArm:  { ...wristR,  ...boneRotation(elbowR,  wristR) },
    rightHand:     { ...wristR,  rx: 0, ry: 0, rz: 0 },

    leftUpLeg:  { ...hipL,    ...boneRotation(hipL,   kneeL) },
    leftLeg:    { ...kneeL,   ...boneRotation(kneeL,  ankleL) },
    leftFoot:   { ...ankleL,  rx: 0, ry: 0, rz: 0 },

    rightUpLeg: { ...hipR,    ...boneRotation(hipR,   kneeR) },
    rightLeg:   { ...kneeR,   ...boneRotation(kneeR,  ankleR) },
    rightFoot:  { ...ankleR,  rx: 0, ry: 0, rz: 0 }
  };
}

/**
 * Convert Kinect v2 joints to unified schema.
 * @param {Object} raw – raw joint map from bridge
 */
export function fromKinectV2(raw) {
  const g = name => raw[name] || { x: 0, y: 0, z: 0 };

  const spineBase  = g('SpineBase');
  const spineMid   = g('SpineMid');
  const spineSh    = g('SpineShoulder');
  const neck       = g('Neck');
  const head       = g('Head');
  const shouldL    = g('ShoulderLeft');
  const elbowL     = g('ElbowLeft');
  const wristL     = g('WristLeft');
  const handL      = g('HandLeft');
  const shouldR    = g('ShoulderRight');
  const elbowR     = g('ElbowRight');
  const wristR     = g('WristRight');
  const handR      = g('HandRight');
  const hipL       = g('HipLeft');
  const kneeL      = g('KneeLeft');
  const ankleL     = g('AnkleLeft');
  const footL      = g('FootLeft');
  const hipR       = g('HipRight');
  const kneeR      = g('KneeRight');
  const ankleR     = g('AnkleRight');
  const footR      = g('FootRight');

  return {
    hips:          { ...spineBase },
    spine:         { ...spineMid,  ...boneRotation(spineBase, spineMid) },
    spine1:        { ...spineSh,   ...boneRotation(spineMid,  spineSh) },
    neck:          { ...neck,      ...boneRotation(spineSh,   head) },
    head:          { ...head,      rx: 0, ry: 0, rz: 0 },

    leftShoulder:  { ...shouldL,   ...boneRotation(shouldL, elbowL) },
    leftArm:       { ...elbowL,    ...boneRotation(shouldL, elbowL) },
    leftForeArm:   { ...wristL,    ...boneRotation(elbowL,  wristL) },
    leftHand:      { ...handL,     rx: 0, ry: 0, rz: 0 },

    rightShoulder: { ...shouldR,   ...boneRotation(shouldR, elbowR) },
    rightArm:      { ...elbowR,    ...boneRotation(shouldR, elbowR) },
    rightForeArm:  { ...wristR,    ...boneRotation(elbowR,  wristR) },
    rightHand:     { ...handR,     rx: 0, ry: 0, rz: 0 },

    leftUpLeg:  { ...hipL,   ...boneRotation(hipL,  kneeL) },
    leftLeg:    { ...kneeL,  ...boneRotation(kneeL, ankleL) },
    leftFoot:   { ...footL,  rx: 0, ry: 0, rz: 0 },

    rightUpLeg: { ...hipR,   ...boneRotation(hipR,  kneeR) },
    rightLeg:   { ...kneeR,  ...boneRotation(kneeR, ankleR) },
    rightFoot:  { ...footR,  rx: 0, ry: 0, rz: 0 }
  };
}

/**
 * Auto-detect version and map joints.
 */
export function mapKinectJoints(raw, version = 2) {
  return version === 1 ? fromKinectV1(raw) : fromKinectV2(raw);
}
