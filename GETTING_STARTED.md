# 🚀 Getting Started with EyeTrain1 Development

This guide will help you get started with developing and extending the EyeTrain1 platform.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Adding Your First Feature](#first-feature)
6. [Testing Your Changes](#testing)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### Required Software
- **Node.js** 14+ and npm
- **Git** for version control
- **Code Editor** (VS Code recommended)
- **Modern Browser** (Chrome/Firefox/Edge)

### Recommended Tools
- **Postman** or **Insomnia** for API testing
- **React DevTools** browser extension
- **Redux DevTools** (if adding state management)

### Optional (For Advanced Features)
- **Python 3.8+** (for AI/ML features)
- **Docker** (for containerization)
- **PostgreSQL** or **MongoDB** (for database features)

---

## 🛠️ Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/burhanmian/eyetrain1.git
cd eyetrain1
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Environment Variables:**
```env
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
MODELS_DIR=./models
MAX_FILE_SIZE=50

# Optional: Add these as you implement features
DATABASE_URL=postgresql://user:password@localhost:5432/eyetrain
AWS_ACCESS_KEY=your_key_here
AWS_SECRET_KEY=your_secret_here
S3_BUCKET=eyetrain-models
REDIS_URL=redis://localhost:6379
```

### 4. Build the Frontend

```bash
cd client
npm run build
cd ..
```

### 5. Start the Development Server

**Option A: Development Mode (Hot Reload)**
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
cd client
npm start
```

**Option B: Production Mode**
```bash
# Build frontend first
cd client && npm run build && cd ..

# Start server
node server/index.js
```

### 6. Verify Installation

Open your browser and navigate to:
- Frontend: http://localhost:3000 (dev mode)
- Production: http://localhost:5000
- API Health: http://localhost:5000/api/health

You should see the EyeTrain1 interface!

---

## 📁 Project Structure

Understanding the codebase structure is crucial:

```
eyetrain1/
├── server/
│   └── index.js              # Main backend server
│                             # • API endpoints
│                             # • File upload handling
│                             # • Job processing
│
├── client/
│   ├── public/
│   │   └── index.html        # HTML template
│   │
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── PhotoUpload.js     # Photo upload tab
│   │   │   ├── ModelUpload.js     # Model upload tab
│   │   │   ├── MotionUpload.js    # Motion capture tab
│   │   │   ├── DefaultModels.js   # Unreal models tab
│   │   │   ├── ModelsList.js      # List of user models
│   │   │   └── Features.js        # Features showcase
│   │   │
│   │   ├── App.js            # Main application
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Global styles
│   │
│   └── package.json          # Frontend dependencies
│
├── uploads/                  # Uploaded files (gitignored)
├── models/                   # Generated models (gitignored)
│   └── default-unreal/       # Default models
│
├── test/
│   └── api.test.js          # API tests
│
├── Documentation/
│   ├── README.md            # Main documentation
│   ├── API.md               # API reference
│   ├── USER_GUIDE.md        # User guide
│   ├── ENHANCEMENTS.md      # Feature ideas
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── SECURITY.md          # Security info
│   └── TESTING.md           # Testing guide
│
├── package.json             # Backend dependencies
├── .gitignore              # Git ignore rules
└── .env.example            # Environment template
```

---

## 🔄 Development Workflow

### Daily Development Cycle

1. **Pull Latest Changes**
```bash
git pull origin main
```

2. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**
- Edit code in your preferred editor
- Save frequently
- Test as you go

4. **Test Locally**
```bash
# Run backend
npm run server

# Run frontend (separate terminal)
cd client && npm start
```

5. **Commit Changes**
```bash
git add .
git commit -m "Add: description of your changes"
```

6. **Push to GitHub**
```bash
git push origin feature/your-feature-name
```

7. **Create Pull Request**
- Go to GitHub
- Create PR from your branch
- Request review

---

## 🎯 Adding Your First Feature

Let's add a simple "Model Statistics" feature as an example.

### Step 1: Plan the Feature

**Goal:** Show statistics about uploaded models (total count, types, etc.)

**What to Build:**
- Backend API endpoint
- Frontend component
- Display in UI

### Step 2: Create Backend Endpoint

Edit `server/index.js`:

```javascript
// Add this new endpoint after existing ones

app.get('/api/statistics', (req, res) => {
  const models = Array.from(userModels.values());
  
  const stats = {
    totalModels: models.length,
    riggedModels: models.filter(m => m.isRigged).length,
    humanoidModels: models.filter(m => m.isHumanoid).length,
    formats: {},
    averageSize: 0
  };
  
  // Count formats
  models.forEach(model => {
    const ext = model.filename.split('.').pop();
    stats.formats[ext] = (stats.formats[ext] || 0) + 1;
  });
  
  res.json(stats);
});
```

### Step 3: Create Frontend Component

Create `client/src/components/Statistics.js`:

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Statistics({ apiBase }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${apiBase}/statistics`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  if (!stats) {
    return <div>No statistics available</div>;
  }

  return (
    <div className="statistics-section">
      <h3>📊 Model Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>{stats.totalModels}</h4>
          <p>Total Models</p>
        </div>
        <div className="stat-card">
          <h4>{stats.riggedModels}</h4>
          <p>Rigged Models</p>
        </div>
        <div className="stat-card">
          <h4>{stats.humanoidModels}</h4>
          <p>Humanoid Models</p>
        </div>
      </div>
      
      <div className="formats-breakdown">
        <h4>File Formats</h4>
        {Object.entries(stats.formats).map(([format, count]) => (
          <div key={format}>
            <span>{format.toUpperCase()}</span>: {count}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Statistics;
```

### Step 4: Add Styling

Add to `client/src/index.css`:

```css
.statistics-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.stat-card h4 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #4CAF50;
}

.stat-card p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.formats-breakdown {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.formats-breakdown div {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}
```

### Step 5: Integrate into Main App

Edit `client/src/App.js`:

```javascript
import Statistics from './components/Statistics';

// In the render method, add:
<Statistics apiBase={API_BASE} />
```

### Step 6: Test Your Feature

1. **Restart servers** if needed
2. **Upload a model** to generate data
3. **Check the statistics** display
4. **Test with different browsers**
5. **Verify API response** in browser devtools

### Step 7: Commit Your Changes

```bash
git add .
git commit -m "Add: model statistics dashboard"
git push origin feature/model-statistics
```

---

## 🧪 Testing Your Changes

### Manual Testing

1. **API Testing with curl:**
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test statistics endpoint
curl http://localhost:5000/api/statistics

# Test file upload
curl -X POST http://localhost:5000/api/upload-photo \
  -F "photo=@/path/to/image.jpg"
```

2. **Browser Testing:**
- Open DevTools (F12)
- Check Console for errors
- Verify Network requests
- Test different screen sizes

3. **Feature Checklist:**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No security vulnerabilities
- [ ] Responsive design
- [ ] Handles errors gracefully
- [ ] Loading states work
- [ ] Data persists correctly

### Automated Testing

Create test file `test/statistics.test.js`:

```javascript
const request = require('supertest');
const app = require('../server/index');

describe('Statistics API', () => {
  test('GET /api/statistics returns stats', async () => {
    const response = await request(app).get('/api/statistics');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalModels');
    expect(response.body).toHaveProperty('riggedModels');
  });
});
```

Run tests:
```bash
npm test
```

---

## 📝 Common Tasks

### Add a New API Endpoint

```javascript
// In server/index.js
app.get('/api/my-endpoint', (req, res) => {
  // Your logic here
  res.json({ message: 'Success' });
});
```

### Add a New React Component

```javascript
// Create client/src/components/MyComponent.js
import React from 'react';

function MyComponent() {
  return <div>My Component</div>;
}

export default MyComponent;
```

### Add a New Page/Tab

1. Create component
2. Add tab button in App.js
3. Add routing logic
4. Update styling

### Connect to Database

```javascript
// Install pg for PostgreSQL
npm install pg

// In server/index.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Use in endpoints
app.get('/api/models', async (req, res) => {
  const result = await pool.query('SELECT * FROM models');
  res.json(result.rows);
});
```

### Add File Processing

```javascript
// Install library
npm install sharp

// Use in endpoint
const sharp = require('sharp');

app.post('/api/process-image', upload.single('image'), async (req, res) => {
  await sharp(req.file.path)
    .resize(800, 600)
    .toFile('output.jpg');
  
  res.json({ success: true });
});
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 <PID>
```

**2. Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For frontend
cd client
rm -rf node_modules package-lock.json
npm install
```

**3. CORS Errors**
- Check server has `cors` middleware
- Verify frontend proxy in `client/package.json`
- Check browser console for specific error

**4. Build Errors**
```bash
# Clear cache
cd client
rm -rf build
npm run build
```

**5. Upload Errors**
- Check file size limits
- Verify upload directory exists
- Check file permissions
- Verify MIME type validation

### Getting Help

1. **Check Documentation:**
   - README.md
   - API.md
   - SECURITY.md
   - DEPLOYMENT.md

2. **Search Issues:**
   - GitHub Issues
   - Stack Overflow
   - Google error messages

3. **Ask Community:**
   - Open GitHub issue
   - Tag with appropriate labels
   - Provide error logs

---

## 🎓 Learning Resources

### React
- [React Documentation](https://react.dev)
- [React Tutorial](https://react.dev/learn)
- [React DevTools](https://react.dev/learn/react-developer-tools)

### Node.js/Express
- [Node.js Docs](https://nodejs.org/docs)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [MDN Web Docs](https://developer.mozilla.org)

### Three.js (for 3D features)
- [Three.js Docs](https://threejs.org/docs)
- [Three.js Examples](https://threejs.org/examples)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

### AI/ML
- [TensorFlow.js](https://www.tensorflow.org/js)
- [MediaPipe](https://google.github.io/mediapipe/)
- [Hugging Face](https://huggingface.co)

---

## 🚀 Next Steps

1. **Explore the codebase** - Read through existing files
2. **Try the example** - Build the Statistics feature above
3. **Pick a feature** - Choose from ENHANCEMENTS.md
4. **Start coding** - Follow the development workflow
5. **Ask questions** - Don't hesitate to seek help
6. **Share progress** - Create pull requests
7. **Help others** - Review PRs, answer questions

---

## 📚 Additional Resources

- **ENHANCEMENTS.md** - 30+ feature ideas to implement
- **ROADMAP.md** - Planned features and timeline
- **API.md** - Complete API documentation
- **DEPLOYMENT.md** - How to deploy to production

---

**Ready to start building? Pick a feature and dive in!** 🎉
