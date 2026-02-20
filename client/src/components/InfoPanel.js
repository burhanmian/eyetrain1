/**
 * InfoPanel – shows device setup guide and feature overview.
 */
import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'webcam',
    icon: '📷',
    title: 'Webcam',
    color: '#00ccff',
    content: (
      <>
        <p>Works in any modern browser with a webcam. Uses <strong>MediaPipe Pose</strong> (Google AI) running entirely in your browser — no data leaves your machine.</p>
        <ul>
          <li>33 body landmarks tracked in real time</li>
          <li>Works at 15-30 fps depending on your hardware</li>
          <li>Best results in well-lit environments</li>
          <li>Stand 2–3 m from the camera, full body visible</li>
        </ul>
        <p><strong>Steps:</strong> Click <em>Start Camera</em> → Allow camera permission → Click <em>Record</em> → Export BVH.</p>
      </>
    )
  },
  {
    id: 'kinect1',
    icon: '🎮',
    title: 'Kinect v1',
    color: '#ff9900',
    content: (
      <>
        <p>Microsoft Kinect for Xbox 360 (2010).  Uses the <strong>Kinect SDK 1.8</strong> depth+colour sensor to track 20 skeletal joints at 30 fps.</p>
        <h4 style={{ marginTop: 12 }}>Requirements</h4>
        <ul>
          <li>Windows 7+ (64-bit)</li>
          <li><a href="https://www.microsoft.com/en-us/download/details.aspx?id=40278" target="_blank" rel="noreferrer" style={{ color: '#ff9900' }}>Kinect SDK 1.8</a></li>
          <li>Python 3.8+, package: <code>pykinect</code></li>
          <li>USB 2.0 port + AC power adapter for sensor</li>
        </ul>
        <h4 style={{ marginTop: 12 }}>Start the bridge</h4>
        <code style={codeStyle}>python bridge/kinect_bridge.py --device 1</code>
        <p style={{ marginTop: 8 }}>The bridge connects to this app on <code>ws://localhost:5001</code>.</p>
      </>
    )
  },
  {
    id: 'kinect2',
    icon: '🔭',
    title: 'Kinect v2',
    color: '#cc44ff',
    content: (
      <>
        <p>Microsoft Kinect for Xbox One (2014).  Uses <strong>Kinect SDK 2.0</strong> with improved depth resolution.  Tracks 25 skeletal joints including hand states.</p>
        <h4 style={{ marginTop: 12 }}>Requirements</h4>
        <ul>
          <li>Windows 8.1+ (64-bit)</li>
          <li><a href="https://www.microsoft.com/en-us/download/details.aspx?id=44561" target="_blank" rel="noreferrer" style={{ color: '#cc44ff' }}>Kinect for Windows SDK 2.0</a></li>
          <li>Python 3.8+, package: <code>pykinect2</code></li>
          <li>USB 3.0 port (required)</li>
        </ul>
        <h4 style={{ marginTop: 12 }}>Start the bridge</h4>
        <code style={codeStyle}>python bridge/kinect_bridge.py --device 2</code>
        <p style={{ marginTop: 8 }}>The bridge connects to this app on <code>ws://localhost:5001</code>.</p>
      </>
    )
  },
  {
    id: 'export',
    icon: '💾',
    title: 'Export Formats',
    color: '#00ff88',
    content: (
      <>
        <p>All captured motion can be exported in standard formats compatible with major 3D software.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Format</th>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Compatible with</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['BVH', 'Blender, Maya, 3ds Max, MotionBuilder, Unity, Unreal Engine'],
              ['JSON', 'Custom pipelines, Three.js, any programming language']
            ].map(([fmt, apps]) => (
              <tr key={fmt} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 0', color: '#00ff88', fontWeight: 700 }}>{fmt}</td>
                <td style={{ padding: '6px 0', fontSize: 13, opacity: 0.8 }}>{apps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }
];

const codeStyle = {
  display: 'block',
  background: 'rgba(0,0,0,0.4)',
  borderRadius: 6,
  padding: '8px 14px',
  marginTop: 6,
  fontFamily: 'monospace',
  fontSize: 13,
  color: '#00ff88',
  wordBreak: 'break-all'
};

export default function InfoPanel() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8,
                   background: 'linear-gradient(90deg,#00ccff,#00ff88)',
                   WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Device Setup Guide
      </h2>
      <p style={{ opacity: 0.6, marginBottom: 24, fontSize: 14 }}>
        Click a section to expand setup instructions.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTIONS.map(sec => (
          <div key={sec.id}
               style={{
                 border: `1px solid ${open === sec.id ? sec.color : 'rgba(255,255,255,0.08)'}`,
                 borderRadius: 12,
                 overflow: 'hidden',
                 background: open === sec.id
                   ? `linear-gradient(135deg, ${sec.color}15, transparent)`
                   : 'rgba(255,255,255,0.02)'
               }}>
            <button
              onClick={() => setOpen(open === sec.id ? null : sec.id)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '14px 18px', cursor: 'pointer', color: 'white',
                display: 'flex', alignItems: 'center', gap: 14
              }}
            >
              <span style={{ fontSize: 22 }}>{sec.icon}</span>
              <strong style={{ fontSize: 16, color: open === sec.id ? sec.color : 'white' }}>
                {sec.title}
              </strong>
              <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                {open === sec.id ? '▲' : '▼'}
              </span>
            </button>
            {open === sec.id && (
              <div style={{
                padding: '0 18px 18px 54px',
                fontSize: 14,
                lineHeight: 1.7,
                color: '#ccc'
              }}>
                {sec.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
