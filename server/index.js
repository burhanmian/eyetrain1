/**
 * MoCap Studio – Server
 *
 * Provides:
 *  • REST API  (port 5000)  – save/load/export recordings
 *  • WebSocket (port 5001)  – real-time pose frames from browser or Kinect bridge
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app     = express();
const PORT    = Number(process.env.PORT    || 5000);
const WS_PORT = Number(process.env.WS_PORT || 5001);

// ── Directories ──────────────────────────────────────────────
const RECORDINGS_DIR = path.resolve(process.env.RECORDINGS_DIR || './recordings');
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// ── In-memory store ───────────────────────────────────────────
const recordings   = new Map();   // id → RecordingMeta
const liveSessions = new Map();   // id → LiveSession

// ─────────────────────────────────────────────────────────────
// WebSocket – real-time motion data
// Roles: browser | kinect-bridge
// ─────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: WS_PORT });
const sessionBrowsers = new Map();   // sessionId → Set<ws>
const kinectBridges   = new Set();

wss.on('connection', (ws, req) => {
  const url    = new URL(req.url, `ws://localhost:${WS_PORT}`);
  const role   = url.searchParams.get('role')   || 'browser';
  const device = url.searchParams.get('device') || 'webcam';

  ws.role   = role;
  ws.device = device;
  ws.isAlive = true;

  if (role === 'kinect-bridge') {
    kinectBridges.add(ws);
    ws.send(JSON.stringify({ type: 'bridge:welcome', device }));
    console.log(`[WS] Kinect bridge connected: ${device}`);
  }

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', raw => {
    try { handleMessage(ws, JSON.parse(raw.toString())); }
    catch (_) { /* ignore */ }
  });

  ws.on('close', () => {
    kinectBridges.delete(ws);
    if (ws.sessionId) {
      const set = sessionBrowsers.get(ws.sessionId);
      if (set) set.delete(ws);
    }
  });
});

// Heartbeat
const hbInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);
wss.on('close', () => clearInterval(hbInterval));

function broadcast(sessionId, msg) {
  const clients = sessionBrowsers.get(sessionId);
  if (!clients) return;
  const payload = JSON.stringify(msg);
  clients.forEach(c => { if (c.readyState === 1) c.send(payload); });
}

function handleMessage(ws, msg) {
  const { type, sessionId, data } = msg;

  switch (type) {

    case 'session:start': {
      const id = sessionId || uuidv4();
      ws.sessionId = id;
      if (!sessionBrowsers.has(id)) sessionBrowsers.set(id, new Set());
      sessionBrowsers.get(id).add(ws);

      liveSessions.set(id, {
        id,
        device: data?.device || ws.device || 'webcam',
        fps:    data?.fps    || 30,
        frames: [],
        startedAt: Date.now(),
        status: 'recording'
      });
      ws.send(JSON.stringify({ type: 'session:started', sessionId: id }));
      break;
    }

    case 'frame': {
      const sid = sessionId || ws.sessionId;
      const sess = liveSessions.get(sid);
      if (sess?.status === 'recording') {
        sess.frames.push({
          t:      data.t      || Date.now(),
          joints: data.joints
        });
        // if this came from a Kinect bridge, forward to browser clients
        if (ws.role === 'kinect-bridge') {
          broadcast(sid, { type: 'frame', data });
        }
      }
      break;
    }

    case 'session:stop': {
      const sid = sessionId || ws.sessionId;
      const sess = liveSessions.get(sid);
      if (!sess) break;

      sess.status   = 'done';
      sess.stoppedAt = Date.now();
      sess.duration  = (sess.stoppedAt - sess.startedAt) / 1000;

      const meta = {
        id:         sess.id,
        device:     sess.device,
        fps:        sess.fps,
        frameCount: sess.frames.length,
        duration:   sess.duration,
        startedAt:  sess.startedAt,
        stoppedAt:  sess.stoppedAt
      };
      recordings.set(sid, { ...meta, frames: sess.frames });
      liveSessions.delete(sid);

      ws.send(JSON.stringify({ type: 'session:stopped', ...meta }));
      break;
    }

    case 'bridge:hello': {
      ws.device = data?.device || 'kinect2';
      ws.role   = 'kinect-bridge';
      kinectBridges.add(ws);
      ws.send(JSON.stringify({ type: 'bridge:welcome', device: ws.device }));
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// REST API
// ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    wsPort: WS_PORT,
    kinectBridges: kinectBridges.size,
    recordings: recordings.size,
    liveSessions: liveSessions.size
  });
});

// List recordings (metadata only)
app.get('/api/recordings', (_req, res) => {
  const list = Array.from(recordings.values()).map(r => ({
    id:         r.id,
    device:     r.device,
    fps:        r.fps,
    frameCount: r.frameCount,
    duration:   r.duration,
    startedAt:  r.startedAt
  }));
  res.json(list);
});

// Get single recording (includes frames)
app.get('/api/recordings/:id', (req, res) => {
  const rec = recordings.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

// Save a recording posted from browser
app.post('/api/recordings', (req, res) => {
  const { frames, fps, device } = req.body;
  if (!Array.isArray(frames) || frames.length === 0)
    return res.status(400).json({ error: 'frames[] required' });

  const id  = uuidv4();
  const rec = {
    id,
    device:     device || 'webcam',
    fps:        fps    || 30,
    frames,
    frameCount: frames.length,
    duration:   frames.length / (fps || 30),
    startedAt:  frames[0]?.t  || Date.now(),
    stoppedAt:  frames[frames.length - 1]?.t || Date.now()
  };
  recordings.set(id, rec);
  res.json({ id, frameCount: rec.frameCount, duration: rec.duration });
});

// Delete recording
app.delete('/api/recordings/:id', (req, res) => {
  if (!recordings.has(req.params.id))
    return res.status(404).json({ error: 'Not found' });
  recordings.delete(req.params.id);
  res.json({ ok: true });
});

// Export as BVH
app.get('/api/recordings/:id/bvh', (req, res) => {
  const rec = recordings.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition',
    `attachment; filename="mocap_${rec.id.slice(0,8)}.bvh"`);
  res.send(buildBVH(rec));
});

// Export as JSON
app.get('/api/recordings/:id/json', (req, res) => {
  const rec = recordings.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });

  res.setHeader('Content-Disposition',
    `attachment; filename="mocap_${rec.id.slice(0,8)}.json"`);
  res.json(rec);
});

// Catch-all → React
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// ─────────────────────────────────────────────────────────────
// BVH builder
// Skeleton: Hips → Spine → Spine1 → Neck → Head
//                        → LeftShoulder  → LeftArm  → LeftForeArm  → LeftHand
//                        → RightShoulder → RightArm → RightForeArm → RightHand
//           Hips → LeftUpLeg  → LeftLeg  → LeftFoot
//                → RightUpLeg → RightLeg → RightFoot
// ─────────────────────────────────────────────────────────────
function buildBVH(rec) {
  const fps       = rec.fps || 30;
  const frameTime = (1 / fps).toFixed(6);
  const frames    = rec.frames || [];

  const hierarchy = `HIERARCHY
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

  let motion = `MOTION\nFrames: ${frames.length}\nFrame Time: ${frameTime}\n`;

  for (const f of frames) {
    const j  = f.joints || {};
    const px = ((j.hips?.x ?? 0) * 100).toFixed(4);
    const py = ((j.hips?.y ?? 0) * 100).toFixed(4);
    const pz = ((j.hips?.z ?? 0) * 100).toFixed(4);

    const r = name => [
      (j[name]?.rz ?? 0).toFixed(4),
      (j[name]?.rx ?? 0).toFixed(4),
      (j[name]?.ry ?? 0).toFixed(4)
    ].join(' ');

    motion += [
      px, py, pz,
      r('hips'),
      r('spine'), r('spine1'), r('neck'), r('head'),
      r('leftShoulder'), r('leftArm'), r('leftForeArm'), r('leftHand'),
      r('rightShoulder'), r('rightArm'), r('rightForeArm'), r('rightHand'),
      r('leftUpLeg'), r('leftLeg'), r('leftFoot'),
      r('rightUpLeg'), r('rightLeg'), r('rightFoot')
    ].join(' ') + '\n';
  }

  return hierarchy + '\n' + motion;
}

// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`MoCap Studio API  → http://localhost:${PORT}`);
  console.log(`WebSocket server  → ws://localhost:${WS_PORT}`);
});

module.exports = { app, wss };
