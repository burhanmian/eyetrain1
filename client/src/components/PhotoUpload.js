import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function PhotoUpload({ onConverted, apiBase }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const pollJobStatus = useCallback(async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${apiBase}/job/${id}`);
        const job = response.data;

        setProgress(job.progress);

        if (job.status === 'completed') {
          clearInterval(interval);
          setProcessing(false);
          setResult(job);
          if (onConverted) onConverted();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setProcessing(false);
          alert('Conversion failed');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 1000);
  }, [apiBase, onConverted]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    setProgress(0);

    try {
      const response = await axios.post(`${apiBase}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploading(false);
      setProcessing(true);

      // Poll for job status
      pollJobStatus(response.data.jobId);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading photo: ' + error.message);
      setUploading(false);
    }
  }, [apiBase, pollJobStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    maxFiles: 1,
    disabled: uploading || processing
  });

  const reset = () => {
    setUploading(false);
    setProcessing(false);
    setProgress(0);
    setResult(null);
  };

  return (
    <div className="upload-section">
      {!processing && !result && (
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-icon">📸</div>
          <h3>Upload Photo</h3>
          <p>
            {isDragActive
              ? 'Drop the photo here...'
              : 'Drag & drop a photo here, or click to select'}
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Supports: JPEG, PNG, GIF, BMP
          </p>
        </div>
      )}

      {uploading && (
        <div className="processing-status">
          <div className="status-header">
            <h3>Uploading photo...</h3>
            <div className="status-icon">⏳</div>
          </div>
        </div>
      )}

      {processing && (
        <div className="processing-status">
          <div className="status-header">
            <h3>Converting to 3D Model</h3>
            <div className="status-icon">🔄</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            {progress}% complete - This may take a few moments...
          </p>
        </div>
      )}

      {result && (
        <div className="processing-status">
          <div className="status-header">
            <h3>✅ Conversion Complete!</h3>
          </div>
          <p style={{ marginTop: '1rem' }}>
            Your 3D model has been generated successfully.
            {result.modelId && ' Check the models section below.'}
          </p>
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: '1rem' }}>
            Convert Another Photo
          </button>
        </div>
      )}
    </div>
  );
}

export default PhotoUpload;
