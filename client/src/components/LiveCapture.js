/**
 * LiveCapture
 *
 * Main motion capture component. Supports three sources:
 *   1. Webcam    – MediaPipe Pose runs entirely in the browser
 *   2. Kinect v1 – Receives joint data from the Python bridge via WebSocket
 *   3. Kinect v2 – Same as above, higher resolution depth
 *
 * Workflow:
 *   Select source → Preview → Record → Export (BVH / JSON)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PoseDetector, landmarksToJoints } from '../utils/PoseDetector';
import { exportBVH, downloadBVH, downloadJSON } from '../utils/BVHExporter';
import { mapKinectJoints } from '../utils/KinectMapper';
import SkeletonOverlay from './SkeletonOverlay';
import Skeleton3DViewer from './Skeleton3DViewer';

const WS_URL  = `ws://${window.location.hostname}:5001`;
const API_URL = '/api';
const FPS     = 30;

// ── device options ────────────────────────────────────────────
const DEVICES = [
  {
    id: 'webcam',
    label: 'Webcam',
    icon: '📷',
    desc: 'Uses your browser camera + MediaPipe AI pose detection. No extra hardware needed.',
    color: '#00ccff'
  },
  {
    id: 'kinect1',
    label: 'Kinect v1',
    icon: '🎮',
    desc: 'Microsoft Kinect for Xbox 360 / Kinect SDK 1.8. Requires the Python bridge running on Windows.',
    color: '#ff9900'
  },
  {
    id: 'kinect2',
    label: 'Kinect v2',
    icon: '🔭',
    desc: 'Microsoft Kinect for Xbox One / Kinect SDK 2.0. Higher resolution depth. Requires Python bridge.',
    color: '#cc44ff'
  }
];

export default function LiveCapture() {
  const [device,     setDevice]     = useState('webcam');
  const [status,     setStatus]     = useState('idle');      // idle | loading | ready | recording | stopped
  const [joints,     setJoints]     = useState(null);
  const [landmarks,  setLandmarks]  = useState(null);
  const [frames,     setFrames]     = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [fps,        setFps]        = useState(0);
  const [wsStatus,   setWsStatus]   = useState('disconnected');

  const videoRef      = useRef(null);
  const detectorRef   = useRef(null);
  const wsRef         = useRef(null);
  const loopRef       = useRef(null);
  const recordRef     = useRef(false);    // avoid stale closure in rAF
  const framesRef     = useRef([]);
  const fpsCounterRef = useRef({ count: 0, last: Date.now() });

  // ── fetch saved recordings ────────────────────────────────
  const loadRecordings = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/recordings`);
      const data = await r.json();
      setRecordings(data);
    } catch (_) {}
  }, []);

  useEffect(() => { loadRecordings(); }, [loadRecordings]);

  // ── helpers ────────────────────────────────────────────────
  const updateFps = () => {
    const c = fpsCounterRef.current;
    c.count++;
    const now = Date.now();
    if (now - c.last >= 1000) {
      setFps(c.count);
      c.count = 0;
      c.last  = now;
    }
  };

  const pushFrame = useCallback((newJoints) => {
    if (!recordRef.current) return;
    const frame = { t: Date.now(), joints: newJoints };
    framesRef.current.push(frame);
    setFrames(prev => [...prev, frame]);
  }, []);

  // ── Webcam setup ──────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      const video = videoRef.current;
      video.srcObject = stream;
      await new Promise(res => { video.onloadedmetadata = res; });
      await video.play();

      const detector = new PoseDetector({
        onResult: ({ joints: j, landmarks: lm }) => {
          setJoints(j);
          setLandmarks(lm);
          pushFrame(j);
          updateFps();
        }
      });
      await detector.init();
      detectorRef.current = detector;

      // Inference loop
      const loop = async () => {
        if (detectorRef.current) {
          await detectorRef.current.processFrame(video);
        }
        loopRef.current = requestAnimationFrame(loop);
      };
      loopRef.current = requestAnimationFrame(loop);

      setStatus('ready');
    } catch (err) {
      console.error('Webcam init error:', err);
      setStatus('idle');
      alert('Could not access webcam: ' + err.message);
    }
  }, [pushFrame]);

  // ── Kinect WebSocket setup ────────────────────────────────
  const startKinect = useCallback((version) => {
    setStatus('loading');
    const ws = new WebSocket(`${WS_URL}?role=browser&device=kinect${version}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      setStatus('ready');
    };
    ws.onclose = () => {
      setWsStatus('disconnected');
      setStatus('idle');
    };
    ws.onerror = () => {
      setWsStatus('error');
      setStatus('idle');
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'frame' && msg.data?.joints) {
          const mapped = mapKinectJoints(msg.data.joints, version);
          setJoints(mapped);
          setLandmarks(null);
          pushFrame(mapped);
          updateFps();
        }
      } catch (_) {}
    };
  }, [pushFrame]);

  // ── Start / stop device ────────────────────────────────────
  const startDevice = useCallback(async () => {
    framesRef.current = [];
    setFrames([]);

    if (device === 'webcam') {
      await startWebcam();
    } else if (device === 'kinect1') {
      startKinect(1);
    } else {
      startKinect(2);
    }
  }, [device, startWebcam, startKinect]);

  const stopDevice = useCallback(() => {
    // Stop webcam
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (detectorRef.current) { detectorRef.current.destroy(); detectorRef.current = null; }
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    // Stop Kinect WS
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    setJoints(null);
    setLandmarks(null);
    setStatus('idle');
    setWsStatus('disconnected');
  }, []);

  // ── Record controls ───────────────────────────────────────
  const startRecording = () => {
    framesRef.current = [];
    setFrames([]);
    recordRef.current = true;
    setStatus('recording');
  };

  const stopRecording = async () => {
    recordRef.current = false;
    setStatus('stopped');

    // Save to server
    try {
      await fetch(`${API_URL}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: framesRef.current,
          fps: FPS,
          device
        })
      });
      await loadRecordings();
    } catch (err) {
      console.error('Failed to save recording:', err);
    }
  };

  // ── Export ────────────────────────────────────────────────
  const exportLocalBVH = () => {
    const bvh = exportBVH(framesRef.current, FPS);
    downloadBVH(bvh, `capture_${Date.now()}.bvh`);
  };

  const exportLocalJSON = () => {
    downloadJSON(framesRef.current, `capture_${Date.now()}.json`);
  };

  const exportServerBVH = (id) => {
    window.open(`${API_URL}/recordings/${id}/bvh`, '_blank');
  };

  const exportServerJSON = (id) => {
    window.open(`${API_URL}/recordings/${id}/json`, '_blank');
  };

  const deleteRecording = async (id) => {
    await fetch(`${API_URL}/recordings/${id}`, { method: 'DELETE' });
    await loadRecordings();
  };

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => stopDevice();
  }, [stopDevice]);

  const selectedDevice = DEVICES.find(d => d.id === device);
  const isActive = ['ready', 'recording', 'stopped'].includes(status);

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <h2 style={styles.title}>Live Motion Capture</h2>
        <p style={styles.sub}>
          Capture full-body motion from webcam, Kinect v1, or Kinect v2 and export as BVH
        </p>
      </div>

      {/* ── Device selector ── */}
      <div style={styles.deviceRow}>
        {DEVICES.map(d => (
          <button
            key={d.id}
            onClick={() => !isActive && setDevice(d.id)}
            disabled={isActive}
            style={{
              ...styles.deviceBtn,
              borderColor: device === d.id ? d.color : 'rgba(255,255,255,0.1)',
              background:  device === d.id
                ? `linear-gradient(135deg, ${d.color}22, ${d.color}11)`
                : 'rgba(255,255,255,0.03)',
              color: device === d.id ? d.color : '#aaa',
              opacity: isActive && device !== d.id ? 0.4 : 1
            }}
          >
            <span style={{ fontSize: 26 }}>{d.icon}</span>
            <strong style={{ marginTop: 4 }}>{d.label}</strong>
            <span style={{ fontSize: 11, opacity: 0.7, marginTop: 4, lineHeight: 1.4 }}>{d.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Kinect bridge notice ── */}
      {(device === 'kinect1' || device === 'kinect2') && !isActive && (
        <div style={styles.notice}>
          <strong>Before connecting:</strong> Start the Python Kinect bridge:
          <code style={styles.code}>
            python bridge/kinect_bridge.py --device {device === 'kinect1' ? '1' : '2'}
          </code>
          The bridge streams skeleton data to this app over WebSocket.
          {wsStatus === 'connected' && <span style={{ color: '#00ff88', marginLeft: 8 }}>Connected</span>}
          {wsStatus === 'error'     && <span style={{ color: '#ff4444', marginLeft: 8 }}>Connection failed</span>}
        </div>
      )}

      {/* ── Video + Skeleton overlay ── */}
      <div style={styles.captureArea}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <video
            ref={videoRef}
            width={640}
            height={480}
            playsInline
            muted
            style={{
              ...styles.video,
              display: device === 'webcam' ? 'block' : 'none'
            }}
          />
          {device === 'webcam' && status !== 'idle' && status !== 'loading' && (
            <SkeletonOverlay landmarks={landmarks} width={640} height={480} />
          )}
          {(device === 'kinect1' || device === 'kinect2') && isActive && (
            <div style={styles.kinectCanvas}>
              <SkeletonOverlay joints={joints} width={640} height={480} />
              <div style={styles.kinectLabel}>
                {selectedDevice.icon} {selectedDevice.label} feed
                {wsStatus === 'connected' && <span style={{ color: '#00ff88', marginLeft: 8 }}>●</span>}
              </div>
            </div>
          )}
        </div>

        {/* 3D Viewer */}
        <div style={styles.viewer3d}>
          <div style={styles.viewerLabel}>3D Skeleton View</div>
          <Skeleton3DViewer
            joints={joints}
            source={device === 'webcam' ? 'webcam' : 'kinect'}
          />
          <div style={styles.viewerHint}>Drag to rotate • Scroll to zoom</div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={styles.controls}>
        {status === 'idle' && (
          <button style={{ ...styles.btn, background: '#0066cc' }} onClick={startDevice}>
            {device === 'webcam' ? '📷 Start Camera' : `${selectedDevice.icon} Connect ${selectedDevice.label}`}
          </button>
        )}

        {status === 'loading' && (
          <button style={{ ...styles.btn, background: '#444', cursor: 'wait' }} disabled>
            Loading…
          </button>
        )}

        {status === 'ready' && (
          <>
            <button style={{ ...styles.btn, background: '#cc0022' }} onClick={startRecording}>
              ● Start Recording
            </button>
            <button style={{ ...styles.btn, background: '#333' }} onClick={stopDevice}>
              Stop Device
            </button>
          </>
        )}

        {status === 'recording' && (
          <button style={{ ...styles.btn, background: '#884400', animation: 'pulse 1s infinite' }}
                  onClick={stopRecording}>
            ■ Stop Recording ({framesRef.current.length} frames)
          </button>
        )}

        {status === 'stopped' && (
          <>
            <button style={{ ...styles.btn, background: '#006633' }} onClick={exportLocalBVH}>
              Export BVH
            </button>
            <button style={{ ...styles.btn, background: '#004488' }} onClick={exportLocalJSON}>
              Export JSON
            </button>
            <button style={{ ...styles.btn, background: '#cc0022' }} onClick={startRecording}>
              ● New Recording
            </button>
            <button style={{ ...styles.btn, background: '#333' }} onClick={stopDevice}>
              Stop Device
            </button>
          </>
        )}

        {isActive && (
          <div style={styles.stats}>
            <span style={{ color: '#00ff88' }}>{fps} fps</span>
            {status === 'recording' && (
              <span style={{ color: '#ff4444', marginLeft: 12 }}>
                ● REC {framesRef.current.length} frames
                ({(framesRef.current.length / FPS).toFixed(1)}s)
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Saved Recordings ── */}
      {recordings.length > 0 && (
        <div style={styles.recordingsSection}>
          <h3 style={styles.sectionTitle}>Saved Recordings</h3>
          <div style={styles.recList}>
            {recordings.map(rec => (
              <div key={rec.id} style={styles.recCard}>
                <div style={styles.recInfo}>
                  <span style={{ fontSize: 18 }}>
                    {rec.device === 'webcam' ? '📷' : rec.device === 'kinect1' ? '🎮' : '🔭'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rec.device.toUpperCase()}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {rec.frameCount} frames · {rec.duration?.toFixed(1)}s · {rec.fps} fps
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>
                      {new Date(rec.startedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={styles.recActions}>
                  <button style={styles.smallBtn} onClick={() => exportServerBVH(rec.id)}>BVH</button>
                  <button style={styles.smallBtn} onClick={() => exportServerJSON(rec.id)}>JSON</button>
                  <button style={{ ...styles.smallBtn, color: '#ff4444' }}
                          onClick={() => deleteRecording(rec.id)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = {
  root: {
    padding: '1.5rem',
    maxWidth: 1100,
    margin: '0 auto'
  },
  header: {
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #00ccff, #00ff88)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  sub: {
    marginTop: 6,
    opacity: 0.7,
    fontSize: 14
  },
  deviceRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  deviceBtn: {
    flex: 1,
    minWidth: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '16px 12px',
    borderRadius: 12,
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'transparent'
  },
  notice: {
    background: 'rgba(255,153,0,0.12)',
    border: '1px solid rgba(255,153,0,0.3)',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6
  },
  code: {
    display: 'block',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 6,
    padding: '6px 12px',
    marginTop: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#00ff88'
  },
  captureArea: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 20
  },
  video: {
    borderRadius: 12,
    background: '#111',
    display: 'block'
  },
  kinectCanvas: {
    width: 640,
    height: 480,
    background: '#0a0a1a',
    borderRadius: 12,
    border: '1px solid rgba(255,153,0,0.3)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kinectLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    background: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 13
  },
  viewer3d: {
    flex: 1,
    minWidth: 300
  },
  viewerLabel: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.7,
    marginBottom: 8
  },
  viewerHint: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.4,
    marginTop: 6
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    marginBottom: 24
  },
  btn: {
    padding: '10px 22px',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  stats: {
    marginLeft: 'auto',
    fontSize: 14,
    fontFamily: 'monospace'
  },
  recordingsSection: {
    marginTop: 16
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: 12,
    opacity: 0.9
  },
  recList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  recCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '12px 16px'
  },
  recInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  },
  recActions: {
    display: 'flex',
    gap: 8
  },
  smallBtn: {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600
  }
};
