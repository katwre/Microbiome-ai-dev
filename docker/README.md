# Docker Deployment Guide

## Overview

This application uses **Conda/Mamba** for Nextflow pipeline execution, making it simple and portable across local development and AWS. No Docker-in-Docker complexity required.

## Quick Start

### 1. Configure environment:
```bash
cd docker
cp .env.example .env
# Edit .env if needed (default paths usually work)
```

### 2. Build and run:
```bash
docker-compose up --build -d
```

### 3. Access:
- Frontend: http://localhost
- Backend API: http://localhost:8000/api/

### 4. View logs:
```bash
docker-compose logs -f
```

### 5. Stop:
```bash
docker-compose down
```

## Data Persistence

Uses Docker volumes:
- `nextflow-assets`: Pipeline cache
- `conda-envs`: Bioinformatics tools
- Media files: Uploaded data and results

On AWS, mount these to EFS for persistence.

## Troubleshooting

```bash
# Check status
docker-compose ps

# Enter backend
docker-compose exec backend bash

# Check Nextflow
docker-compose exec backend nextflow -version

# Rebuild
docker-compose up --build -d
```

See README_DEPLOYMENT.md for AWS deployment.
