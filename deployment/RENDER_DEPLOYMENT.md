# Render Deployment Guide

## Prerequisites

1. ✅ GitHub repository with your code
2. ✅ Render account (sign up at https://render.com)
3. ✅ All tests passing in CI

## Deployment Steps

### Option 1: Deploy with Blueprint (Recommended)

This deploys everything automatically using `render.yaml`.

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com

2. **Create New Blueprint**
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `katwre/Microbiome-ai-dev`
   - Render will detect `render.yaml`

3. **Configure Services**
   - Render will create 3 services:
     - ✅ microbiome-backend (Django API)
     - ✅ microbiome-frontend (React app)
     - ✅ microbiome-db (PostgreSQL)

4. **Wait for Deployment** (~5-10 minutes)
   - Backend builds and runs migrations
   - Frontend builds and serves static files
   - Database is provisioned

5. **Get Your URLs**
   - Backend: `https://microbiome-backend.onrender.com`
   - Frontend: `https://microbiome-frontend.onrender.com`

6. **Update Environment Variables**
   After first deployment, update these in Render dashboard:
   
   **Backend service:**
   - `CORS_ALLOWED_ORIGINS`: `https://microbiome-frontend.onrender.com`
   - `CSRF_TRUSTED_ORIGINS`: `https://microbiome-frontend.onrender.com,https://microbiome-backend.onrender.com`
   - `ALLOWED_HOSTS`: `microbiome-backend.onrender.com,.onrender.com`

   **Frontend service:**
   - `VITE_API_URL`: `https://microbiome-backend.onrender.com`

7. **Trigger Redeploy**
   - Redeploy both services for env vars to take effect

### Option 2: Manual Deployment

If you prefer manual control:

#### 1. Create PostgreSQL Database

```
New → PostgreSQL
Name: microbiome-db
Database: microbiome
User: microbiome
Region: Oregon (US West)
Plan: Free
```

Save the connection string for later.

#### 2. Deploy Backend

```
New → Web Service
- Connect repository: katwre/Microbiome-ai-dev
- Name: microbiome-backend
- Region: Oregon (US West)
- Branch: main
- Runtime: Docker
- Dockerfile Path: ./docker/Dockerfile.backend
- Docker Context: .
- Plan: Free

Environment Variables:
- DJANGO_SETTINGS_MODULE: mysite.settings
- DEBUG: false
- SECRET_KEY: [Auto-generate in Render]
- DATABASE_URL: [Internal connection string from database]
- ALLOWED_HOSTS: microbiome-backend.onrender.com,.onrender.com
- CORS_ALLOWED_ORIGINS: https://microbiome-frontend.onrender.com
- CSRF_TRUSTED_ORIGINS: https://microbiome-frontend.onrender.com,https://microbiome-backend.onrender.com

Health Check Path: /api/
```

#### 3. Deploy Frontend

```
New → Web Service
- Connect repository: katwre/Microbiome-ai-dev  
- Name: microbiome-frontend
- Region: Oregon (US West)
- Branch: main
- Runtime: Docker
- Dockerfile Path: ./docker/Dockerfile.frontend
- Docker Context: .
- Plan: Free

Build Command Arguments:
- VITE_API_URL: https://microbiome-backend.onrender.com

Environment Variables:
- VITE_API_URL: https://microbiome-backend.onrender.com
```

## Post-Deployment

### 1. Run Database Migrations

```bash
# In Render backend service shell:
python manage.py migrate
python manage.py collectstatic --noinput
```

Or add this to Dockerfile.backend build command.

### 2. Test the Deployment

1. Visit your frontend URL: `https://microbiome-frontend.onrender.com`
2. Try uploading test data
3. Check if bacteria endpoint works

### 3. Check Logs

- Backend logs: Dashboard → microbiome-backend → Logs
- Frontend logs: Dashboard → microbiome-frontend → Logs
- Database logs: Dashboard → microbiome-db → Logs

## Troubleshooting

### Backend Issues

**"ALLOWED_HOSTS" error:**
```python
# Already fixed in settings.py:
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')
```

**Database connection error:**
- Check DATABASE_URL is set correctly
- Verify PostgreSQL service is running
- Check internal connection string

**Static files not loading:**
- Run `python manage.py collectstatic`
- Check WhiteNoise is in MIDDLEWARE

### Frontend Issues

**API calls fail (CORS):**
- Check CORS_ALLOWED_ORIGINS includes frontend URL
- Check CSRF_TRUSTED_ORIGINS includes both URLs
- Verify VITE_API_URL is set correctly

**Build fails:**
- Check Node version (20+)
- Verify all dependencies in package.json
- Check build logs for errors

**404 on routes:**
- Verify nginx.conf has `try_files` fallback
- Check dist/ folder contains index.html

### Database Issues

**Migrations fail:**
- Check DATABASE_URL format
- Ensure psycopg2-binary is installed
- Run migrations manually in shell

**Connection limit:**
- Free tier: 10 connections max
- Use connection pooling
- Set `conn_max_age=600` in settings

## Render Free Tier Limits

- ✅ 750 hours/month free compute
- ✅ Services sleep after 15 min inactivity
- ✅ First request after sleep takes ~30 seconds
- ✅ 512 MB RAM per service
- ✅ PostgreSQL: 100 MB storage, 10 connections

## Keeping Services Awake

### Option 1: UptimeRobot (Free)

1. Sign up at https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://microbiome-frontend.onrender.com`
   - Interval: 5 minutes

### Option 2: Render Cron Job

Add to `render.yaml`:
```yaml
services:
  - type: cron
    name: keep-alive
    schedule: "*/5 * * * *"  # Every 5 minutes
    buildCommand: ""
    startCommand: "curl https://microbiome-backend.onrender.com/api/"
```

## Upgrading to Paid Plan

For production use, consider:

- **Starter Plan** ($7/month per service)
  - No sleep
  - More RAM
  - Better performance

- **PostgreSQL Standard** ($7/month)
  - 1 GB storage
  - 100 connections
  - Better performance

## Next Steps

After successful deployment:

1. ✅ Update README with production URLs
2. ✅ Set up custom domain (optional)
3. ✅ Configure CD pipeline to auto-deploy
4. ✅ Set up monitoring/alerts
5. ✅ Configure backup strategy

## Getting Your URLs

Your deployed application URLs:

- **Frontend:** `https://microbiome-frontend.onrender.com`
- **Backend API:** `https://microbiome-backend.onrender.com`
- **Admin Panel:** `https://microbiome-backend.onrender.com/admin`

Test the API:
```bash
curl https://microbiome-backend.onrender.com/api/
```

## Custom Domain (Optional)

1. Go to frontend service settings
2. Click "Add Custom Domain"
3. Enter your domain (e.g., microbiome.yourdomain.com)
4. Add CNAME record in your DNS:
   ```
   microbiome.yourdomain.com → microbiome-frontend.onrender.com
   ```
5. Render auto-provisions SSL certificate

## Success Criteria

✅ Frontend loads at Render URL  
✅ Backend API responds  
✅ Can create test jobs  
✅ Database stores data  
✅ Bacteria endpoint works  
✅ No CORS errors  
✅ SSL certificate active  

**You now have 2 deployment points!** 🎉

Next: Add CD pipeline for auto-deployment
