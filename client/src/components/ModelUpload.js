import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function ModelUpload({ onUploaded, apiBase }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelId, setModelId] = useState(null);
  const [result, setResult] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('model', file);

    setUploading(true);

    try {
      const response = await axios.post(`${apiBase}/upload-model`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setModelId(response.data.modelId);
      setUploading(false);
      setAnalyzing(true);

      // Poll for model status
      pollModelStatus(response.data.modelId);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading model: ' + error.message);
      setUploading(false);
    }
  }, [apiBase]);

  const pollModelStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${apiBase}/model/${id}`);
        const model = response.data;

        if (model.status === 'ready') {
          clearInterval(interval);
          setAnalyzing(false);
          setResult(model);
          if (onUploaded) onUploaded();
        } else if (model.status === 'failed') {
          clearInterval(interval);
          setAnalyzing(false);
          alert('Model processing failed');
        }
      } catch (error) {
        console.error('Error polling model status:', error);
      }
    }, 1000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/*': ['.fbx', '.obj', '.gltf', '.glb', '.dae']
    },
    maxFiles: 1,
    disabled: uploading || analyzing
  });

  const reset = () => {
    setUploading(false);
    setAnalyzing(false);
    setModelId(null);
    setResult(null);
  };

  return (
    <div className="upload-section">
      {!analyzing && !result && (
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-icon">📦</div>
          <h3>Upload 3D Model</h3>
          <p>
            {isDragActive
              ? 'Drop the model file here...'
              : 'Drag & drop a 3D model, or click to select'}
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Supports: FBX, OBJ, GLTF, GLB, DAE
          </p>
        </div>
      )}

      {uploading && (
        <div className="processing-status">
          <div className="status-header">
            <h3>Uploading model...</h3>
            <div className="status-icon">⏳</div>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="processing-status">
          <div className="status-header">
            <h3>Analyzing Model</h3>
            <div className="status-icon">🔄</div>
          </div>
          <p style={{ marginTop: '1rem' }}>
            Detecting humanoid features and preparing for rigging...
          </p>
        </div>
      )}

      {result && (
        <div className="processing-status">
          <div className="status-header">
            <h3>✅ Model Uploaded!</h3>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <p>
              <strong>Humanoid Detected:</strong>{' '}
              {result.isHumanoid ? '✅ Yes' : '❌ No'}
            </p>
            {result.isRigged && (
              <>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>Rigged:</strong> ✅ Yes ({result.rigType})
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>Bones:</strong> {result.boneCount}
                </p>
              </>
            )}
            {result.isHumanoid && !result.isRigged && (
              <p style={{ marginTop: '0.5rem', color: '#FFA500' }}>
                ⚠️ Rigging in progress...
              </p>
            )}
          </div>
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: '1rem' }}>
            Upload Another Model
          </button>
        </div>
      )}
    </div>
  );
}

export default ModelUpload;
