# 🎯 Quick Reference Guide - EyeTrain1

A quick reference for common development tasks and code patterns.

## 🚀 Quick Commands

### Development
```bash
# Install dependencies
npm install && cd client && npm install && cd ..

# Run development mode
npm run dev

# Run backend only
npm run server

# Run frontend only
cd client && npm start

# Build for production
cd client && npm run build && cd ..

# Start production server
node server/index.js
```

### Testing
```bash
# Run all tests
npm test

# Run specific test
npm test -- test/api.test.js

# Test API endpoint
curl http://localhost:5000/api/health
```

### Git
```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git add .
git commit -m "Add: feature description"

# Push changes
git push origin feature/feature-name
```

---

## 📋 Common Code Patterns

### Add API Endpoint

```javascript
// In server/index.js

// GET endpoint
app.get('/api/your-endpoint', (req, res) => {
  try {
    const data = { message: 'Success' };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint with validation
app.post('/api/your-endpoint', (req, res) => {
  const { requiredField } = req.body;
  
  if (!requiredField) {
    return res.status(400).json({ error: 'Missing required field' });
  }
  
  // Process data
  res.json({ success: true });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Process file
  res.json({
    filename: req.file.filename,
    size: req.file.size
  });
});
```

### Create React Component

```javascript
// client/src/components/MyComponent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MyComponent({ apiBase }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiBase}/endpoint`);
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="my-component">
      <h3>My Component</h3>
      {/* Your content */}
    </div>
  );
}

export default MyComponent;
```

### File Upload Component

```javascript
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function FileUploader({ apiBase, onSuccess }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiBase}/upload`, formData);
      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    }
  }, [apiBase, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.png'] },
    maxFiles: 1
  });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {isDragActive ? 
        <p>Drop file here...</p> : 
        <p>Drag & drop or click to select</p>
      }
    </div>
  );
}
```

### Add Styling

```css
/* Add to client/src/index.css */

.my-component {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin: 1rem 0;
}

.my-component h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .my-component {
    padding: 1rem;
  }
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Storage
UPLOAD_DIR=./uploads
MODELS_DIR=./models
MAX_FILE_SIZE=50

# Database (when added)
DATABASE_URL=postgresql://user:pass@localhost/eyetrain

# AWS (when added)
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
S3_BUCKET=eyetrain-models

# Redis (when added)
REDIS_URL=redis://localhost:6379
```

### CORS Setup

```javascript
// In server/index.js
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

---

## 🗄️ Database Patterns

### PostgreSQL Setup

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Query example
async function getModels() {
  const result = await pool.query('SELECT * FROM models ORDER BY created_at DESC');
  return result.rows;
}

// Insert example
async function createModel(data) {
  const query = `
    INSERT INTO models (id, name, type, is_rigged)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [data.id, data.name, data.type, data.isRigged];
  const result = await pool.query(query, values);
  return result.rows[0];
}
```

### MongoDB Setup

```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URL);
const db = client.db('eyetrain');

// Find documents
async function getModels() {
  return await db.collection('models').find({}).toArray();
}

// Insert document
async function createModel(data) {
  const result = await db.collection('models').insertOne(data);
  return result.ops[0];
}
```

---

## 📦 Common Dependencies

### Install Packages

```bash
# Backend
npm install express cors multer uuid dotenv
npm install pg redis aws-sdk
npm install passport bcrypt jsonwebtoken

# Frontend
cd client
npm install axios react-dropzone
npm install three @react-three/fiber @react-three/drei
npm install react-router-dom
```

### Import Patterns

```javascript
// Backend
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Frontend
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as THREE from 'three';
```

---

## 🐛 Debugging

### Backend Debugging

```javascript
// Add logging
console.log('Debug:', data);

// Error handling
try {
  // Your code
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
}

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### Frontend Debugging

```javascript
// Console logging
console.log('State:', state);

// React DevTools
// Use React DevTools browser extension

// Network debugging
// Open browser DevTools > Network tab
```

### Common Issues

```bash
# Port in use
lsof -ti:5000 | xargs kill -9

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Frontend build issues
cd client
rm -rf build node_modules
npm install
npm run build
```

---

## 🧪 Testing Patterns

### API Testing

```javascript
const request = require('supertest');
const app = require('../server/index');

describe('API Tests', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  
  test('POST /api/upload', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', 'test.jpg');
    expect(res.status).toBe(200);
  });
});
```

### Component Testing

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  const element = screen.getByText(/my component/i);
  expect(element).toBeInTheDocument();
});
```

---

## 📚 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [Three.js Docs](https://threejs.org/docs)
- [MDN Web Docs](https://developer.mozilla.org)

### Tools
- [Postman](https://www.postman.com) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [VS Code](https://code.visualstudio.com)

### Learning
- [JavaScript Info](https://javascript.info)
- [Egghead.io](https://egghead.io)
- [FreeCodeCamp](https://www.freecodecamp.org)

---

## 💡 Pro Tips

1. **Use Git branches** - One feature per branch
2. **Commit often** - Small, focused commits
3. **Test locally** - Before pushing code
4. **Read errors** - They usually tell you what's wrong
5. **Use DevTools** - Browser and React DevTools
6. **Check docs** - Before Googling
7. **Ask for help** - When stuck
8. **Share code** - Pull requests for review

---

## 🎯 Next Steps

1. Check [ENHANCEMENTS.md](ENHANCEMENTS.md) for feature ideas
2. Read [GETTING_STARTED.md](GETTING_STARTED.md) for setup
3. Review [ROADMAP.md](ROADMAP.md) for planned features
4. Start coding! 🚀

---

**Keep this handy while developing!** 📌
