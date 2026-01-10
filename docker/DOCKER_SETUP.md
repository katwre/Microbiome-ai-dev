# Docker Setup Summary

## ✅ What Was Fixed

### 1. **Backend Dockerfile** (`Dockerfile.backend`)
- ✅ Proper base image (Python 3.12-slim)
- ✅ System dependencies (gcc, libpq-dev for PostgreSQL support)
- ✅ Python requirements installation
- ✅ Media directory creation
- ✅ Gunicorn with proper workers and timeout
- ✅ Auto-run migrations on startup

### 2. **Frontend Dockerfile** (`Dockerfile.frontend`)
- ✅ Multi-stage build (build + production)
- ✅ Node.js 20 for building
- ✅ Nginx for serving static files
- ✅ Production-optimized

### 3. **Docker Compose** (`docker-compose.yml`)
- ✅ Proper service definitions
- ✅ Volume mounts for media and analysis data
- ✅ Docker socket access (for Nextflow)
- ✅ Network configuration
- ✅ Environment variables
- ✅ Service dependencies

### 4. **Nginx Configuration** (`nginx.conf`)
- ✅ API proxy to backend
- ✅ Media files proxy
- ✅ Gzip compression
- ✅ SPA routing support

### 5. **API Configuration** (Frontend)
- ✅ Environment-based API URLs
- ✅ Development: `http://localhost:8000`
- ✅ Production: Relative URLs (through nginx proxy)
- ✅ Updated all API calls to use centralized config

### 6. **Requirements File** 
- ✅ Created `requirements.txt` with all dependencies
- ✅ Includes Django, DRF, matplotlib, pandas, etc.

## 🚀 How to Test Docker

### Option 1: Quick Test (Development Mode)
```bash
cd /home/katwre/projects/Microbiome-ai-dev/docker
docker-compose up --build
```

Access at: http://localhost

### Option 2: Background Mode
```bash
docker-compose up --build -d
docker-compose logs -f  # View logs
```

### Option 3: Individual Services
```bash
# Build and run backend only
docker-compose up --build backend

# Build and run frontend only  
docker-compose up --build frontend
```

## 📋 Pre-Test Checklist

1. ✅ Docker installed and running
2. ✅ Docker Compose installed
3. ✅ Port 80 available (frontend)
4. ✅ Port 8000 available (backend)
5. ✅ Git repo clean (commit changes)

## 🔍 Testing Steps

1. **Build containers:**
   ```bash
   cd docker
   docker-compose build
   ```

2. **Start services:**
   ```bash
   docker-compose up
   ```

3. **Test frontend:**
   - Open: http://localhost
   - Should see the upload form

4. **Test backend API:**
   - Open: http://localhost/api/jobs/upload/
   - Should see API response

5. **Test analysis:**
   - Submit test data through frontend
   - Monitor logs: `docker-compose logs -f backend`
   - Check job status page

6. **Stop services:**
   ```bash
   docker-compose down
   ```

## ⚠️ Known Issues & Solutions

### Issue: Nextflow needs Docker access
**Solution:** Docker socket is mounted (`/var/run/docker.sock`)

### Issue: Media files not persisting
**Solution:** Volume mount configured for `/app/media`

### Issue: CORS errors
**Solution:** Nginx proxy handles all requests, no CORS needed

### Issue: API calls fail in production
**Solution:** Using relative URLs in production via env variables

## 📁 File Structure
```
docker/
├── Dockerfile.backend       # Backend container
├── Dockerfile.frontend      # Frontend container  
├── docker-compose.yml       # Orchestration
├── nginx.conf              # Nginx configuration
└── README.md               # Documentation

backend/microbiome-backend/
└── requirements.txt        # Python dependencies

frontend/
├── .env.development       # Dev API URL
└── .env.production        # Prod API URL
```

## 🎯 Next Steps

1. Test locally with Docker
2. Fix any issues that arise
3. Push to GitHub
4. Deploy to cloud (AWS/DigitalOcean)
5. Set up CI/CD pipeline
