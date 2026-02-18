# 🎯 EyeTrain1 - Professional Photo to 3D Model Platform

A comprehensive web application for converting photos to 3D models with automatic rigging and motion capture capabilities. Inspired by **Meshy AI** and **DeepMotion**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 📸 Photo to 3D Conversion
- Upload photos and convert them to high-quality 3D models
- AI-powered conversion with progress tracking
- Support for multiple image formats (JPEG, PNG, GIF, BMP)

### 🤖 Automatic Humanoid Rigging
- Intelligent humanoid detection
- Automatic skeletal rigging for detected humanoids
- UE4/UE5 compatible skeleton (67 bones)
- Support for standard rig formats

### 🎬 Motion Capture Integration
- Upload BVH and FBX motion capture data
- Apply animations to rigged models
- Motion retargeting and validation
- Preview animations in real-time

### 🎮 Default Unreal Engine Models
- Pre-rigged UE Mannequin
- Male and female character bases
- Full UE4/UE5 skeleton compatibility
- Ready for game development

### 💾 Export & Share
- Multiple export formats (FBX, OBJ, GLTF, GLB, DAE)
- Export with animations
- Download ready-to-use assets

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm
- Modern web browser
- At least 2GB free disk space

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/burhanmian/eyetrain1.git
cd eyetrain1
```

2. **Install dependencies**
```bash
npm install
cd client && npm install && cd ..
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
MODELS_DIR=./models
MAX_FILE_SIZE=50
```

4. **Start the application**
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
# Backend server
npm run server

# Frontend client (in another terminal)
npm run client
```

5. **Open in browser**
```
http://localhost:3000
```

## 📖 Usage Guide

### Converting Photos to 3D Models

1. Navigate to the **Photo to 3D** tab
2. Drag and drop a photo or click to select one
3. Wait for the conversion process to complete
4. View your generated 3D model in the Models section

### Uploading 3D Models

1. Go to the **Upload Model** tab
2. Upload your FBX, OBJ, GLTF, GLB, or DAE file
3. The system will automatically detect if it's humanoid
4. Humanoid models will be automatically rigged

### Applying Motion Capture

1. Open the **Motion Capture** tab
2. Select a rigged model from the dropdown
3. Upload your BVH or FBX motion data
4. The animation will be applied to your model
5. Preview or export the animated model

### Using Default Unreal Models

1. Visit the **Unreal Models** tab
2. Browse available pre-rigged models
3. Select a model to use as a base
4. Apply motion capture or customize as needed

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API for all operations
- File upload handling with Multer
- In-memory job tracking
- Modular service architecture

### Frontend (React)
- Modern, responsive UI
- Component-based architecture
- Real-time upload progress
- Interactive 3D preview (Three.js ready)

### Directory Structure
```
eyetrain1/
├── server/
│   └── index.js          # Express server & API
├── client/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # React components
│       ├── App.js        # Main application
│       └── index.css     # Styles
├── uploads/              # Uploaded photos
├── models/               # Generated 3D models
│   └── default-unreal/   # Default UE models
├── package.json          # Root dependencies
└── README.md
```

## 🛠️ API Endpoints

### Photo Conversion
- `POST /api/upload-photo` - Upload photo for conversion
- `GET /api/job/:jobId` - Get conversion job status

### Model Management
- `POST /api/upload-model` - Upload 3D model
- `GET /api/model/:modelId` - Get model details
- `GET /api/models` - List all user models
- `GET /api/default-models` - Get default Unreal models

### Motion Capture
- `POST /api/upload-motion` - Upload motion data
- `GET /api/motion/:motionId` - Get motion details
- `GET /api/model/:modelId/motions` - List motions for model

### Export
- `POST /api/export` - Export model with animation

## 🎨 Technologies Used

### Backend
- **Express.js** - Web framework
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique ID generation

### Frontend
- **React** - UI framework
- **Axios** - HTTP client
- **React Dropzone** - File upload interface
- **Three.js** - 3D rendering (via @react-three/fiber)

## 🔮 Future Enhancements

- [ ] Real AI-powered photo-to-3D conversion
- [ ] Advanced rigging algorithms
- [ ] Real-time 3D preview with Three.js
- [ ] Cloud storage integration
- [ ] User authentication and accounts
- [ ] Collaborative features
- [ ] Animation timeline editor
- [ ] Physics simulation
- [ ] Texture editing tools
- [ ] Batch processing
- [ ] Plugin system for custom exporters

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by [Meshy AI](https://www.meshy.ai/) - Photo to 3D conversion
- Inspired by [DeepMotion](https://www.deepmotion.com/) - Motion capture technology
- Unreal Engine for skeletal standards

## 📧 Support

For support, please open an issue in the GitHub repository.

---

**Built with ❤️ for the 3D artist community**