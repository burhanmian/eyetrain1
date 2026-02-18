# Deployment Guide

This guide covers deploying EyeTrain1 to various platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Deployment](#local-deployment)
- [Heroku Deployment](#heroku-deployment)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Production Checklist](#production-checklist)

## Prerequisites

- Node.js 14+ installed
- npm or yarn
- Git
- Account on your chosen hosting platform

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Storage
UPLOAD_DIR=./uploads
MODELS_DIR=./models

# File Upload
MAX_FILE_SIZE=50

# Optional: Database (for future use)
# DATABASE_URL=your_database_url

# Optional: Cloud Storage (for future use)
# AWS_BUCKET=your_bucket_name
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
```

## Local Deployment

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build the client
cd client
npm run build
cd ..

# Serve production build
NODE_ENV=production npm start
```

## Heroku Deployment

### 1. Prepare Your App

Create `Procfile`:
```
web: node server/index.js
```

Update `package.json` to include heroku-postbuild:
```json
{
  "scripts": {
    "heroku-postbuild": "cd client && npm install && npm run build"
  }
}
```

### 2. Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MAX_FILE_SIZE=50

# Deploy
git push heroku main

# Open app
heroku open
```

### 3. Configure Buildpacks
```bash
heroku buildpacks:add heroku/nodejs
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy application files
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server/index.js"]
```

### 2. Create .dockerignore

```
node_modules
client/node_modules
client/build
uploads
models
.git
.env
*.log
```

### 3. Build and Run

```bash
# Build image
docker build -t eyetrain1 .

# Run container
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/models:/app/models \
  eyetrain1
```

### 4. Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MAX_FILE_SIZE=50
    volumes:
      - ./uploads:/app/uploads
      - ./models:/app/models
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## AWS Deployment

### Using AWS Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize EB**
```bash
eb init -p node.js eyetrain1
```

3. **Create Environment**
```bash
eb create eyetrain1-env
```

4. **Deploy**
```bash
eb deploy
```

5. **Set Environment Variables**
```bash
eb setenv NODE_ENV=production MAX_FILE_SIZE=50
```

### Using AWS EC2

1. Launch an EC2 instance (Ubuntu recommended)
2. SSH into the instance
3. Install Node.js and npm
4. Clone the repository
5. Install dependencies and build
6. Use PM2 to run the application
7. Configure nginx as reverse proxy

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server/index.js --name eyetrain1

# Setup PM2 startup
pm2 startup
pm2 save
```

## Production Checklist

### Security
- [ ] Use HTTPS (SSL certificate)
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Validate all user inputs
- [ ] Use helmet.js for security headers
- [ ] Keep dependencies updated

### Performance
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement caching
- [ ] Optimize images
- [ ] Monitor memory usage
- [ ] Set up logging

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up application monitoring (e.g., New Relic)
- [ ] Enable logging (e.g., Winston)
- [ ] Configure backup strategy

### Infrastructure
- [ ] Set up database (if needed)
- [ ] Configure cloud storage (S3, etc.)
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling
- [ ] Implement load balancing

### Code Quality
- [ ] Run linters
- [ ] Fix all warnings
- [ ] Remove console.logs
- [ ] Add error handling
- [ ] Write tests
- [ ] Document API

## Nginx Configuration (Optional)

If using nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Increase max body size for file uploads
    client_max_body_size 100M;
}
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Memory Issues
- Increase Node.js memory limit
- Use streaming for large files
- Implement file cleanup

### File Upload Issues
- Check MAX_FILE_SIZE setting
- Verify directory permissions
- Check disk space

## Support

For deployment issues, please:
1. Check logs for errors
2. Verify environment variables
3. Consult platform-specific documentation
4. Open an issue on GitHub

## Updates and Maintenance

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install
cd client && npm install && cd ..

# Rebuild client
cd client && npm run build && cd ..

# Restart application
pm2 restart eyetrain1  # if using PM2
```
