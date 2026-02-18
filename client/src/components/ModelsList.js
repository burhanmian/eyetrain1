import React from 'react';

function ModelsList({ models, onRefresh }) {
  const sortedModels = [...models].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (models.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '3rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <h2>Your Models</h2>
        <button 
          className="btn btn-secondary" 
          onClick={onRefresh}
          style={{ padding: '0.7rem 1.5rem' }}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="models-grid">
        {sortedModels.map(model => (
          <div key={model.id} className="model-card">
            <div className="model-thumbnail">
              {model.isHumanoid ? '🧍' : '📦'}
            </div>
            <div className="model-info">
              <h3>{model.originalName}</h3>
              <div className="model-meta">
                {model.isHumanoid && (
                  <span className="badge success">👤 Humanoid</span>
                )}
                {model.isRigged ? (
                  <span className="badge success">
                    ✅ Rigged
                  </span>
                ) : model.isHumanoid ? (
                  <span className="badge warning">
                    ⏳ Rigging...
                  </span>
                ) : (
                  <span className="badge">
                    Not Rigged
                  </span>
                )}
                {model.status && (
                  <span className="badge">
                    {model.status}
                  </span>
                )}
              </div>
              {model.isRigged && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  marginTop: '0.5rem',
                  opacity: 0.8 
                }}>
                  Rig: {model.rigType} • Bones: {model.boneCount}
                </p>
              )}
              <div className="model-actions">
                <button className="btn btn-primary">
                  View
                </button>
                {model.isRigged && (
                  <button className="btn btn-secondary">
                    Add Motion
                  </button>
                )}
                <button className="btn btn-secondary">
                  Export
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModelsList;
