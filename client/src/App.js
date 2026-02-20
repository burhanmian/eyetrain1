import React, { useState } from 'react';
import LiveCapture from './components/LiveCapture';
import InfoPanel from './components/InfoPanel';
import './App.css';

const TABS = [
  { id: 'capture', label: 'Live Capture', icon: '🎬' },
  { id: 'guide',   label: 'Setup Guide',  icon: '📖' }
];

export default function App() {
  const [tab, setTab] = useState('capture');

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎭</span>
            <div>
              <div className="logo-title">MoCap Studio</div>
              <div className="logo-sub">Webcam · Kinect v1 · Kinect v2</div>
            </div>
          </div>
          <nav className="nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        {tab === 'capture' && <LiveCapture />}
        {tab === 'guide'   && <InfoPanel />}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>MoCap Studio — Open-source motion capture · Inspired by iPi Soft</p>
        <p className="footer-sub">MediaPipe Pose · Kinect SDK 1.8/2.0 · BVH export · Three.js 3D preview</p>
      </footer>
    </div>
  );
}
