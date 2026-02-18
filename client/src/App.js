import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoUpload from './components/PhotoUpload';
import ModelUpload from './components/ModelUpload';
import MotionUpload from './components/MotionUpload';
import DefaultModels from './components/DefaultModels';
import ModelsList from './components/ModelsList';
import Features from './components/Features';
import './index.css';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

function App() {
  const [activeTab, setActiveTab] = useState('photo');
  const [models, setModels] = useState([]);
  const [defaultModels, setDefaultModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
    fetchDefaultModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/models`);
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchDefaultModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/default-models`);
      setDefaultModels(response.data);
    } catch (error) {
      console.error('Error fetching default models:', error);
    }
  };

  const handlePhotoConverted = () => {
    fetchModels();
  };

  const handleModelUploaded = () => {
    fetchModels();
  };

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">🎯</div>
            <div>
              <h1>EyeTrain1</h1>
              <p className="tagline">Professional 3D Model Platform</p>
            </div>
          </div>
          <nav className="nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#models" className="nav-link">Models</a>
            <a href="#about" className="nav-link">About</a>
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h2>Transform Photos to 3D Models</h2>
          <p>
            Upload photos to create stunning 3D models, automatically rig humanoid characters,
            and apply motion capture for professional animations. Powered by AI, inspired by
            Meshy AI and DeepMotion.
          </p>
        </section>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => setActiveTab('photo')}
          >
            📸 Photo to 3D
          </button>
          <button
            className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📦 Upload Model
          </button>
          <button
            className={`tab-button ${activeTab === 'motion' ? 'active' : ''}`}
            onClick={() => setActiveTab('motion')}
          >
            🎬 Motion Capture
          </button>
          <button
            className={`tab-button ${activeTab === 'defaults' ? 'active' : ''}`}
            onClick={() => setActiveTab('defaults')}
          >
            🎮 Unreal Models
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'photo' && (
            <PhotoUpload onConverted={handlePhotoConverted} apiBase={API_BASE} />
          )}
          {activeTab === 'upload' && (
            <ModelUpload onUploaded={handleModelUploaded} apiBase={API_BASE} />
          )}
          {activeTab === 'motion' && (
            <MotionUpload models={models} apiBase={API_BASE} />
          )}
          {activeTab === 'defaults' && (
            <DefaultModels models={defaultModels} />
          )}
        </div>

        <section id="models">
          <ModelsList models={models} onRefresh={fetchModels} />
        </section>

        <Features />
      </main>

      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        opacity: 0.8,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginTop: '4rem'
      }}>
        <p>© 2024 EyeTrain1. Professional 3D Model Platform.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Inspired by Meshy AI and DeepMotion
        </p>
      </footer>
    </div>
  );
}

export default App;
