import React from 'react';

function DefaultModels({ models }) {
  return (
    <div className="upload-section">
      <h2 style={{ marginBottom: '1.5rem' }}>Default Unreal Engine Models</h2>
      <p style={{ opacity: 0.9, marginBottom: '2rem' }}>
        Professional, pre-rigged models compatible with Unreal Engine 4 and 5.
        Ready for motion capture and animation.
      </p>

      <div className="models-grid">
        {models.map(model => (
          <div key={model.id} className="model-card">
            <div className="model-thumbnail">
              🎮
            </div>
            <div className="model-info">
              <h3>{model.name}</h3>
              <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
                {model.description}
              </p>
              <div className="model-meta">
                <span className="badge success">
                  {model.isRigged ? '✅ Rigged' : 'Not Rigged'}
                </span>
                <span className="badge">{model.format}</span>
                <span className="badge">{model.type}</span>
              </div>
              <div className="model-actions">
                <button className="btn btn-primary">
                  Use This Model
                </button>
                <button className="btn btn-secondary">
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          opacity: 0.7 
        }}>
          <p>Loading default models...</p>
        </div>
      )}
    </div>
  );
}

export default DefaultModels;
