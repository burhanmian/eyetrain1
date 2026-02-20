/**
 * BVHExporter – converts an array of frame objects to a BVH string.
 *
 * Each frame object: { t: timestamp, joints: { [name]: { x,y,z, rx,ry,rz } } }
 * This runs in the browser; the server has its own copy for server-side export.
 */

const HIERARCHY = `HIERARCHY
ROOT Hips
{
  OFFSET 0.00 0.00 0.00
  CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
  JOINT Spine
  {
    OFFSET 0.00 10.00 0.00
    CHANNELS 3 Zrotation Xrotation Yrotation
    JOINT Spine1
    {
      OFFSET 0.00 10.00 0.00
      CHANNELS 3 Zrotation Xrotation Yrotation
      JOINT Neck
      {
        OFFSET 0.00 10.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT Head
        {
          OFFSET 0.00 8.00 0.00
          CHANNELS 3 Zrotation Xrotation Yrotation
          End Site { OFFSET 0.00 10.00 0.00 }
        }
      }
      JOINT LeftShoulder
      {
        OFFSET 5.00 0.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT LeftArm
        {
          OFFSET 12.00 0.00 0.00
          CHANNELS 3 Zrotation Xrotation Yrotation
          JOINT LeftForeArm
          {
            OFFSET 14.00 0.00 0.00
            CHANNELS 3 Zrotation Xrotation Yrotation
            JOINT LeftHand
            {
              OFFSET 12.00 0.00 0.00
              CHANNELS 3 Zrotation Xrotation Yrotation
              End Site { OFFSET 5.00 0.00 0.00 }
            }
          }
        }
      }
      JOINT RightShoulder
      {
        OFFSET -5.00 0.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT RightArm
        {
          OFFSET -12.00 0.00 0.00
          CHANNELS 3 Zrotation Xrotation Yrotation
          JOINT RightForeArm
          {
            OFFSET -14.00 0.00 0.00
            CHANNELS 3 Zrotation Xrotation Yrotation
            JOINT RightHand
            {
              OFFSET -12.00 0.00 0.00
              CHANNELS 3 Zrotation Xrotation Yrotation
              End Site { OFFSET -5.00 0.00 0.00 }
            }
          }
        }
      }
    }
  }
  JOINT LeftUpLeg
  {
    OFFSET 8.00 -5.00 0.00
    CHANNELS 3 Zrotation Xrotation Yrotation
    JOINT LeftLeg
    {
      OFFSET 0.00 -18.00 0.00
      CHANNELS 3 Zrotation Xrotation Yrotation
      JOINT LeftFoot
      {
        OFFSET 0.00 -18.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        End Site { OFFSET 0.00 -5.00 5.00 }
      }
    }
  }
  JOINT RightUpLeg
  {
    OFFSET -8.00 -5.00 0.00
    CHANNELS 3 Zrotation Xrotation Yrotation
    JOINT RightLeg
    {
      OFFSET 0.00 -18.00 0.00
      CHANNELS 3 Zrotation Xrotation Yrotation
      JOINT RightFoot
      {
        OFFSET 0.00 -18.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        End Site { OFFSET 0.00 -5.00 5.00 }
      }
    }
  }
}`;

const JOINT_ORDER = [
  'hips',
  'spine', 'spine1', 'neck', 'head',
  'leftShoulder', 'leftArm', 'leftForeArm', 'leftHand',
  'rightShoulder', 'rightArm', 'rightForeArm', 'rightHand',
  'leftUpLeg', 'leftLeg', 'leftFoot',
  'rightUpLeg', 'rightLeg', 'rightFoot'
];

/**
 * @param {Array} frames – array of { t, joints }
 * @param {number} fps
 * @returns {string} BVH file content
 */
export function exportBVH(frames, fps = 30) {
  const frameTime = (1 / fps).toFixed(6);

  let motion = `MOTION\nFrames: ${frames.length}\nFrame Time: ${frameTime}\n`;

  for (const frame of frames) {
    const j = frame.joints || {};
    const hips = j.hips || {};

    const vals = [
      // Root position (scaled to cm)
      ((hips.x || 0) * 100).toFixed(4),
      ((hips.y || 0) * 100).toFixed(4),
      ((hips.z || 0) * 100).toFixed(4),
      // Hips rotation
      (hips.rz || 0).toFixed(4),
      (hips.rx || 0).toFixed(4),
      (hips.ry || 0).toFixed(4)
    ];

    // All other joints (rotation only)
    for (let i = 1; i < JOINT_ORDER.length; i++) {
      const jnt = j[JOINT_ORDER[i]] || {};
      vals.push(
        (jnt.rz || 0).toFixed(4),
        (jnt.rx || 0).toFixed(4),
        (jnt.ry || 0).toFixed(4)
      );
    }

    motion += vals.join(' ') + '\n';
  }

  return HIERARCHY + '\n' + motion;
}

/**
 * Trigger a browser file download.
 * @param {string} content
 * @param {string} filename
 */
export function downloadBVH(content, filename = 'capture.bvh') {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download frames as raw JSON.
 */
export function downloadJSON(frames, filename = 'capture.json') {
  const blob = new Blob([JSON.stringify({ fps: 30, frames }, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
