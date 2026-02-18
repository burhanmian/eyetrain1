const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const modelsDir = path.join(__dirname, '..', 'models');
const defaultModelsDir = path.join(modelsDir, 'default-unreal');

[uploadDir, modelsDir, defaultModelsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: (process.env.MAX_FILE_SIZE || 50) * 1024 * 1024 }, // MB to bytes
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|fbx|obj|gltf|glb|bvh|dae/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('model');
    
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// In-memory storage for conversion jobs and models
const conversionJobs = new Map();
const userModels = new Map();
const motionCaptures = new Map();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EyeTrain1 API is running' });
});

// Upload photo for 3D conversion
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const jobId = uuidv4();
    const job = {
      id: jobId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
      type: 'photo-to-3d'
    };

    conversionJobs.set(jobId, job);

    // Simulate 3D conversion process
    simulateConversion(jobId);

    res.json({
      success: true,
      jobId: jobId,
      message: 'Photo uploaded successfully. Converting to 3D model...'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload 3D model for rigging
app.post('/api/upload-model', upload.single('model'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const modelId = uuidv4();
    const model = {
      id: modelId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      status: 'analyzing',
      isHumanoid: false,
      isRigged: false,
      createdAt: new Date()
    };

    userModels.set(modelId, model);

    // Simulate humanoid detection and rigging
    simulateRigging(modelId);

    res.json({
      success: true,
      modelId: modelId,
      message: 'Model uploaded successfully. Analyzing for humanoid features...'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload motion/mocap data
app.post('/api/upload-motion', upload.single('motion'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { modelId } = req.body;
    if (!modelId || !userModels.has(modelId)) {
      return res.status(400).json({ error: 'Invalid model ID' });
    }

    const motionId = uuidv4();
    const motion = {
      id: motionId,
      modelId: modelId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      status: 'processing',
      createdAt: new Date()
    };

    motionCaptures.set(motionId, motion);

    // Simulate motion application
    simulateMotionApplication(motionId, modelId);

    res.json({
      success: true,
      motionId: motionId,
      message: 'Motion data uploaded successfully. Applying to model...'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversion job status
app.get('/api/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = conversionJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Get model details
app.get('/api/model/:modelId', (req, res) => {
  const { modelId } = req.params;
  const model = userModels.get(modelId);

  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }

  res.json(model);
});

// Get all user models
app.get('/api/models', (req, res) => {
  const models = Array.from(userModels.values());
  res.json(models);
});

// Get default Unreal models
app.get('/api/default-models', (req, res) => {
  const defaultModels = [
    {
      id: 'unreal-mannequin',
      name: 'UE Mannequin',
      type: 'humanoid',
      isRigged: true,
      format: 'FBX',
      description: 'Standard Unreal Engine mannequin with full skeleton',
      thumbnail: '/api/thumbnails/unreal-mannequin.png'
    },
    {
      id: 'unreal-female',
      name: 'UE Female Character',
      type: 'humanoid',
      isRigged: true,
      format: 'FBX',
      description: 'Female character base mesh with UE4/UE5 skeleton',
      thumbnail: '/api/thumbnails/unreal-female.png'
    },
    {
      id: 'unreal-male',
      name: 'UE Male Character',
      type: 'humanoid',
      isRigged: true,
      format: 'FBX',
      description: 'Male character base mesh with UE4/UE5 skeleton',
      thumbnail: '/api/thumbnails/unreal-male.png'
    }
  ];

  res.json(defaultModels);
});

// Get motion capture data
app.get('/api/motion/:motionId', (req, res) => {
  const { motionId } = req.params;
  const motion = motionCaptures.get(motionId);

  if (!motion) {
    return res.status(404).json({ error: 'Motion data not found' });
  }

  res.json(motion);
});

// Get all motions for a model
app.get('/api/model/:modelId/motions', (req, res) => {
  const { modelId } = req.params;
  const motions = Array.from(motionCaptures.values())
    .filter(m => m.modelId === modelId);

  res.json(motions);
});

// Export model with animation
app.post('/api/export', (req, res) => {
  const { modelId, motionId, format } = req.body;

  if (!modelId || !userModels.has(modelId)) {
    return res.status(400).json({ error: 'Invalid model ID' });
  }

  const exportId = uuidv4();
  const exportData = {
    id: exportId,
    modelId: modelId,
    motionId: motionId || null,
    format: format || 'FBX',
    status: 'preparing',
    createdAt: new Date()
  };

  // Simulate export process
  setTimeout(() => {
    exportData.status = 'ready';
    exportData.downloadUrl = `/api/download/${exportId}`;
  }, 2000);

  res.json({
    success: true,
    exportId: exportId,
    message: 'Export started',
    data: exportData
  });
});

// Helper functions to simulate processing

function simulateConversion(jobId) {
  const job = conversionJobs.get(jobId);
  let progress = 0;

  const interval = setInterval(() => {
    progress += 10;
    job.progress = progress;

    if (progress >= 100) {
      clearInterval(interval);
      job.status = 'completed';
      
      // Create a model from the conversion
      const modelId = uuidv4();
      const model = {
        id: modelId,
        filename: `model_${job.filename.replace(/\.[^.]+$/, '.fbx')}`,
        originalName: job.originalName.replace(/\.[^.]+$/, '.fbx'),
        path: job.path.replace(/\.[^.]+$/, '.fbx'),
        status: 'ready',
        isHumanoid: Math.random() > 0.3, // Simulate humanoid detection
        isRigged: false,
        createdAt: new Date(),
        sourceJobId: jobId
      };

      userModels.set(modelId, model);
      job.modelId = modelId;

      // If humanoid, start rigging
      if (model.isHumanoid) {
        simulateRigging(modelId);
      }
    }
  }, 500);
}

function simulateRigging(modelId) {
  const model = userModels.get(modelId);
  
  setTimeout(() => {
    model.status = 'analyzing';
  }, 500);

  setTimeout(() => {
    // Determine if humanoid
    if (!model.hasOwnProperty('isHumanoid')) {
      model.isHumanoid = Math.random() > 0.2; // 80% chance of being humanoid
    }

    if (model.isHumanoid) {
      model.status = 'rigging';
      
      setTimeout(() => {
        model.status = 'ready';
        model.isRigged = true;
        model.rigType = 'UE4-Skeleton';
        model.boneCount = 67; // Standard UE4 skeleton
      }, 2000);
    } else {
      model.status = 'ready';
      model.isRigged = false;
    }
  }, 1500);
}

function simulateMotionApplication(motionId, modelId) {
  const motion = motionCaptures.get(motionId);
  const model = userModels.get(modelId);

  setTimeout(() => {
    motion.status = 'validating';
  }, 500);

  setTimeout(() => {
    if (model.isRigged) {
      motion.status = 'applying';
      
      setTimeout(() => {
        motion.status = 'completed';
        motion.duration = Math.floor(Math.random() * 10) + 2; // 2-12 seconds
        motion.fps = 30;
        motion.frames = motion.duration * motion.fps;
      }, 2000);
    } else {
      motion.status = 'failed';
      motion.error = 'Model must be rigged to apply motion capture';
    }
  }, 1500);
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EyeTrain1 server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`📦 Models directory: ${modelsDir}`);
});

module.exports = app;
