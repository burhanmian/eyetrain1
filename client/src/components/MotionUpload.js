import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function MotionUpload({ models, apiBase }) {
  const [selectedModel, setSelectedModel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const riggedModels = models.filter(m => m.isRigged);

  const pollMotionStatus = useCallback(async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${apiBase}/motion/${id}`);
        const motion = response.data;

        if (motion.status === 'completed') {
          clearInterval(interval);
          setProcessing(false);
          setResult(motion);
        } else if (motion.status === 'failed') {
          clearInterval(interval);
          setProcessing(false);
          alert(motion.error || 'Motion application failed');
        }
      } catch (error) {
        console.error('Error polling motion status:', error);
      }
    }, 1000);
  }, [apiBase]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0 || !selectedModel) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('motion', file);
    formData.append('modelId', selectedModel);

    setUploading(true);

    try {
      const response = await axios.post(`${apiBase}/upload-motion`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploading(false);
      setProcessing(true);

      // Poll for motion status
      pollMotionStatus(response.data.motionId);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading motion: ' + error.message);
      setUploading(false);
    }
  }, [apiBase, selectedModel, pollMotionStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/*': ['.bvh', '.fbx']
    },
    maxFiles: 1,
    disabled: uploading || processing || !selectedModel
  });

  const reset = () => {
    setUploading(false);
    setProcessing(false);
    setResult(null);
  };

  return (
    <div className="upload-section">
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Select Rigged Model</h3>
        {riggedModels.length === 0 ? (
          <p style={{ opacity: 0.8 }}>
            ⚠️ No rigged models available. Please upload and rig a model first.
          </p>
        ) : (
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem'
            }}
          >
            <option value="">Choose a model...</option>
            {riggedModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.originalName} ({model.rigType})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedModel && !processing && !result && (
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-icon">🎬</div>
          <h3>Upload Motion Capture Data</h3>
          <p>
            {isDragActive
              ? 'Drop the motion file here...'
              : 'Drag & drop motion capture data, or click to select'}
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Supports: BVH, FBX (animation)
          </p>
        </div>
      )}

      {uploading && (
        <div className="processing-status">
          <div className="status-header">
            <h3>Uploading motion data...</h3>
            <div className="status-icon">⏳</div>
          </div>
        </div>
      )}

      {processing && (
        <div className="processing-status">
          <div className="status-header">
            <h3>Applying Motion to Model</h3>
            <div className="status-icon">🔄</div>
          </div>
          <p style={{ marginTop: '1rem' }}>
            Validating and retargeting animation to model skeleton...
          </p>
        </div>
      )}

      {result && (
        <div className="processing-status">
          <div className="status-header">
            <h3>✅ Motion Applied!</h3>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Duration:</strong> {result.duration} seconds</p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>FPS:</strong> {result.fps}
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Total Frames:</strong> {result.frames}
            </p>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={reset}>
              Add Another Motion
            </button>
            <button className="btn btn-secondary">
              Preview Animation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MotionUpload;
