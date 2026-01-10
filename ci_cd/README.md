# CI/CD Pipeline Documentation

![CI Status](https://github.com/katwre/Microbiome-ai-dev/actions/workflows/ci.yml/badge.svg)

## Overview

This project uses **GitHub Actions** for full **CI/CD** (Continuous Integration & Continuous Deployment):
- ✅ **CI**: Automatically runs 42 tests on every push
- ✅ **CD**: Automatically deploys to Render when tests pass on `main` branch

## Current Setup

### ✅ Continuous Integration (CI)

**Workflow File:** [.github/workflows/ci.yml](../.github/workflows/ci.yml)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What Gets Tested:**

#### 1. Backend Tests (25 tests)
- **Framework:** Django TestCase
- **Coverage:**
  - 8 Model tests (AnalysisJob, UploadedFile, AnalysisResult)
  - 14 API endpoint tests (Upload, Status, Details, Results, Bacteria)
  - 3 Integration tests (Complete workflow, Job isolation)
- **Runtime:** ~5 seconds
- **Python Version:** 3.11

#### 2. Frontend Tests (17 tests)
- **Framework:** Vitest + React Testing Library
- **Coverage:**
  - Component tests (UploadForm, StatusDisplay, etc.)
  - Page tests (Home, JobDetail)
  - Utility tests (API client, formatting)
- **Runtime:** ~3 seconds
- **Node Version:** Uses Bun (latest)

### ✅ Continuous Deployment (CD)

**Triggers:**
- Only on pushes to `main` branch
- Only when all tests pass
- Pull requests do NOT trigger deployment

**Deploy Targets:**
- Backend: Render (microbiome-backend)
- Frontend: Render (microbiome-frontend)

**Deploy Method:**
- Uses Render Deploy Hooks
- Triggers via curl POST requests
- Deployment runs on Render (not in GitHub Actions)
- Takes ~5-10 minutes

**Configuration:**
- Deploy hooks stored in GitHub Secrets
- `RENDER_DEPLOY_HOOK_BACKEND`
- `RENDER_DEPLOY_HOOK_FRONTEND`

### Full CI/CD Pipeline Flow

```mermaid
graph LR
    A[Push to main] --> B[Run Tests]
    B --> C{Tests Pass?}
    C -->|Yes| D[Deploy Backend]
    C -->|No| E[❌ Stop]
    D --> F[Deploy Frontend]
    F --> G[✅ Live on Render]
```

### Detailed Flow

1. **Developer pushes code** to `main` branch
2. **GitHub Actions triggered** automatically
3. **Backend tests run** (25 tests, ~30 sec)
4. **Frontend tests run** (17 tests, ~20 sec)
5. **If all pass** → Trigger Render deployment
6. **Render builds** new Docker images
7. **Render deploys** new version (5-10 min)
8. **Live URLs updated** automatically

### Test Results

```bash
Backend:  25/25 tests passing ✅
Frontend: 17/17 tests passing ✅
Total:    42/42 tests passing ✅
```

## Setup CD (One-Time Configuration)

### Get Render Deploy Hooks

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **For Backend Service:**
   - Click "microbiome-backend"
   - Go to "Settings" tab
   - Scroll to "Deploy Hook" section
   - Click "Create Deploy Hook"
   - Copy the URL (looks like `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`)

3. **For Frontend Service:**
   - Click "microbiome-frontend"
   - Go to "Settings" tab
   - Scroll to "Deploy Hook" section
   - Click "Create Deploy Hook"
   - Copy the URL

### Add Secrets to GitHub

1. **Go to your GitHub repository**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add Backend Hook:**
   - Name: `RENDER_DEPLOY_HOOK_BACKEND`
   - Value: (paste backend deploy hook URL)
   - Click "Add secret"

5. **Add Frontend Hook:**
   - Name: `RENDER_DEPLOY_HOOK_FRONTEND`
   - Value: (paste frontend deploy hook URL)
   - Click "Add secret"

### Test the Setup

1. **Make a small change** (e.g., update README)
2. **Commit and push to main:**
   ```bash
   git add .
   git commit -m "test: Trigger CD pipeline"
   git push origin main
   ```
3. **Watch GitHub Actions** - Should see:
   - ✅ Backend tests pass
   - ✅ Frontend tests pass
   - ✅ Deploy job runs
   - ✅ Render builds new version

4. **Check Render Dashboard** - Should see deployment in progress

### Verify Deployment

After ~5-10 minutes:
- Visit your frontend URL
- Check if changes are live
- Verify backend API responds

## Viewing CI/CD Results

### On GitHub
1. Go to your repository on GitHub
2. Click "Actions" tab
3. See all workflow runs

### Status Badge
The README shows real-time CI status:
- ✅ Green = All tests passing
- ❌ Red = Tests failing
- 🟡 Yellow = Tests running

### In Pull Requests
- CI status shows automatically
- Prevents merging if tests fail
- Shows which tests failed

## Local Testing

Before pushing, run tests locally:

### Backend Tests
```bash
cd backend/microbiome-backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
bun test
```

### Both at Once
```bash
# Backend
cd backend/microbiome-backend && python manage.py test && cd ../..

# Frontend
cd frontend && bun test && cd ..
```

## CI Configuration Details

### Backend Job
```yaml
- Python 3.11
- Install dependencies from requirements.txt
- Run Django tests with verbosity=2
- Cache pip dependencies for speed
```

### Frontend Job
```yaml
- Bun (latest)
- Install dependencies from bun.lockb
- Run Vitest tests
- Cache node_modules for speed
```

## Performance Optimizations

- **Caching:** Dependencies cached between runs
- **Parallel Jobs:** Backend and frontend run simultaneously
- **Fast Runners:** GitHub-hosted Ubuntu runners
- **Minimal Output:** Only show failures by default

## Troubleshooting

### CI Failing Locally Passing?

**Check environment differences:**
```bash
# Different Python version?
python --version  # CI uses 3.11

# Different dependencies?
pip freeze  # Compare with requirements.txt

# Database issues?
# CI uses in-memory SQLite
```

### View CI Logs

1. Go to Actions tab on GitHub
2. Click the failing workflow
3. Click the failing job
4. Expand the step that failed

### Common Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Add to requirements.txt/package.json |
| Database locked | Normal for concurrent tests |
| Test timeout | Increase timeout or optimize test |
| Import error | Check file paths are correct |

## Branch Protection

### Recommended Settings
```
Settings → Branches → Add rule:
- Branch name pattern: main
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- Select: backend-tests, frontend-tests
```

This prevents merging failing code!

## Future Enhancements

### 🔄 Continuous Deployment (CD)
```yaml
# After tests pass:
- Build Docker images
- Push to registry
- Deploy to production
- Run smoke tests
```

### 📊 Test Coverage Reports
```yaml
- Generate coverage.py report
- Upload to Codecov
- Show coverage badge
```

### 🔒 Security Scanning
```yaml
- Run safety check (Python)
- Run npm audit (JavaScript)
- Scan Docker images
```

### ⚡ Performance Testing
```yaml
- Load testing with Locust
- Frontend performance with Lighthouse
- Database query analysis
```

## Metrics

### Current Performance
- **Total CI Time:** ~3-4 minutes
- **Backend Tests:** ~30 seconds
- **Frontend Tests:** ~20 seconds
- **Setup Time:** ~2-3 minutes (with caching)

### Success Rate
- Target: >95% green builds
- Current: Monitor in Actions tab

## Best Practices

### ✅ Do
- Run tests locally before pushing
- Keep tests fast (<10 seconds each)
- Fix failing tests immediately
- Add tests for new features
- Use meaningful commit messages

### ❌ Don't
- Skip CI on failing tests
- Commit broken code
- Push without testing
- Ignore CI failures
- Delete .github/workflows files

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Django Testing](https://docs.djangoproject.com/en/5.1/topics/testing/)
- [Vitest Docs](https://vitest.dev/)
- [Backend Testing Guide](../backend/microbiome-backend/TESTING.md)
- [Frontend Testing Guide](../frontend/TESTING.md)

## Status

✅ **CI Pipeline Active**
- Backend tests: Automated
- Frontend tests: Automated
- Status badge: Live
- Branch protection: Recommended

🔜 **Coming Soon**
- Continuous Deployment (CD)
- Test coverage reporting
- Security scanning
- Performance monitoring
