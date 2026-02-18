import React from 'react';

function Features() {
  const features = [
    {
      icon: '📸',
      title: 'Photo to 3D',
      description: 'Upload photos and convert them to high-quality 3D models using advanced AI algorithms.'
    },
    {
      icon: '🤖',
      title: 'Auto Rigging',
      description: 'Automatically detect humanoid models and apply professional skeletal rigs compatible with industry standards.'
    },
    {
      icon: '🎬',
      title: 'Motion Capture',
      description: 'Upload BVH or FBX motion data and apply animations to your rigged characters seamlessly.'
    },
    {
      icon: '🎮',
      title: 'Unreal Ready',
      description: 'Access default Unreal Engine models with full UE4/UE5 skeleton compatibility for game development.'
    },
    {
      icon: '⚡',
      title: 'Real-time Preview',
      description: 'Preview your 3D models and animations in real-time with our interactive 3D viewer.'
    },
    {
      icon: '💾',
      title: 'Multiple Formats',
      description: 'Export your models and animations in various formats including FBX, OBJ, GLTF, and more.'
    }
  ];

  return (
    <section id="features" className="features">
      <h2>Powerful Features</h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
