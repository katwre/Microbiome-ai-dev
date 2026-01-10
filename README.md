# Microbiome Data Analysis

![CI Status](https://github.com/katwre/Microbiome-ai-dev/actions/workflows/ci.yml/badge.svg)

<p align="center">
  <img src="./img/poster.png" alt="Logo" width="500">
</p>

It's web-based application that allows users to upload microbiome sequencing data (such as 16S rRNA gene sequencing), perform basic data analysis, and generate visualizations of the microbiome diversity.

Microbiome analysis using 16S rRNA sequencing identifies which bacteria are present in your sample by reading a specific genetic "barcode" that all bacteria have. The sequencing machine reads millions of these DNA barcodes, and specialized software groups them into different bacterial species and measures how abundant each one is. This tells you the diversity of your microbial community - which bacteria are present, how many different types there are, and which ones dominate.

## Tech Stack

**Backend:**

🦎 Django • Python 3.12 • Django REST Framework • SQLite

**Bioinformatics:**

🧬 Nextflow • nf-core/ampliseq 25.10.2 • DADA2 • Cutadapt • Conda/Mamba

**Data & Analysis:**

📊 Pandas • Matplotlib

**DevOps & Deployment:**

🐳 Docker • Docker Compose

☁️ AWS EC2 • AWS S3 • AWS Batch

**CI/CD:**

🔄 GitHub Actions

**Workflow & Orchestration:**

🔗 n8n • MCP

**Frontend:** vibe-coded using Lovable - Vite, TypeScript, React, shadcn-ui, Tailwind CSS.


--- 


## Backend

**API Endpoints**

- `POST /api/jobs/upload/` - Upload FASTQ files or use test data
  - Parameters: project_name, email, data_type (paired-end/single-end), files (optional), use_test_data (boolean)
  - Returns: job_id, status
- `GET /api/jobs/{job_id}/status/` - Check analysis status and retrieve results
  - Returns: status (pending/running/completed/failed), results, error_details, report_url

**Database Models**

Django SQLite models:

- **AnalysisJob**: Tracks pipeline execution
  - Fields: job_id (UUID), project_name, email, status, created_at, updated_at, is_test_data, error_message
  - Relationships: OneToOne with AnalysisResults
- **AnalysisResults**: Stores pipeline outputs
  - Fields: asv_count, reads_input, reads_filtered, diversity_metrics, barplot_path, report_generated_at

**Bioinformatics Pipeline**

- **Workflow engine**: Nextflow 25.10.2
- **Pipeline**: nf-core/ampliseq v2.15.0
- **Tool management**: Conda/Mamba (not Docker containers)
- **Analysis steps**:
  1. Primer trimming (cutadapt)
  2. Quality filtering & denoising (DADA2)
  3. Chimera removal
  4. Taxonomic classification (GTDB database)
  5. Diversity analysis & visualization

**Error Handling**

Complete error chain: Nextflow → Django logs → Database → REST API → Frontend UI
- Nextflow failures captured with .exitcode and .nextflow.log
- Status polling every 5 seconds during execution
- Error details displayed in frontend with troubleshooting tips

**Testing**
[TBD] pinpoint to backendTESTING.md


## Deployment

### Local Development (Docker Compose)

**1. Setup and Build**
```bash
cd docker
cp .env.example .env
docker-compose build
docker-compose up -d
```

**2. Access Application**
- Frontend: http://localhost
- Backend API: http://localhost:8000/api/

**3. Run Analysis**
- Open http://localhost
- Fill in project details
- Upload FASTQ files OR check "Use test data"
- Click "Run analysis"
- First run: 10-15 minutes (conda creates environments)
- Subsequent runs: ~5 minutes (cached)

**4. Monitor & Debug**
```bash
# View logs
docker-compose logs -f backend

# Check container status
docker-compose ps

# Restart backend after code changes
docker-compose build backend
docker-compose restart backend
```

**5. Testing via API**
```bash
# Upload test job
curl -X POST http://localhost:8000/api/jobs/upload/ \
  -F "project_name=Test" \
  -F "email=test@example.com" \
  -F "data_type=paired-end" \
  -F "use_test_data=true"

# Check status (replace with actual job_id from response)
curl http://localhost:8000/api/jobs/<job_id>/status/
```

**6. Cleanup**
```bash
# Stop containers
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v
```


### AWS Production Deployment

**Architecture Overview**
```
┌─────────────────┐
│   CloudFront    │ ← CDN for frontend
│   + S3 Bucket   │   (Static React build)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   EC2 Instance  │ ← Django API + nginx
│   (or ECS)      │   (Backend container)
└────────┬────────┘
         │ Submit job
         ▼
┌─────────────────┐
│   AWS Batch     │ ← Run Nextflow pipeline
│   + ECS         │   (nf-core/ampliseq)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   S3 Buckets    │ ← Uploads + Results
└─────────────────┘
         ▲
         │ Metadata
┌────────┴────────┐
│   RDS Postgres  │ ← Job status + results
└─────────────────┘
```

**📋 Prerequisites**
- AWS Account with admin access
- AWS CLI configured
- Docker installed locally
- Domain name (optional but recommended)

**🚀 Deployment Steps**

**Step 1: Prepare Your Code**
```bash
# Install production dependencies
cd backend/microbiome-backend
cat requirements-prod.txt >> requirements.txt

# Generate secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Set up production settings
export DJANGO_SETTINGS_MODULE=mysite.settings_prod
```

**Step 2: Create AWS Infrastructure**

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed steps.

Quick setup:
```bash
# Create S3 buckets
aws s3 mb s3://microbiome-uploads-prod
aws s3 mb s3://microbiome-results-prod
aws s3 mb s3://microbiome-frontend-prod

# Configure S3 CORS
aws s3api put-bucket-cors \
  --bucket microbiome-uploads-prod \
  --cors-configuration file://docker/s3-cors.json

# Create RDS database
aws rds create-db-instance \
  --db-instance-identifier microbiome-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password $(openssl rand -base64 32)

# Create ECR repositories
aws ecr create-repository --repository-name microbiome-backend
aws ecr create-repository --repository-name microbiome-nextflow
```

**Step 3: Setup AWS Batch**
```bash
# Create compute environment
aws batch create-compute-environment \
  --compute-environment-name microbiome-compute \
  --type MANAGED \
  --compute-resources type=EC2,minvCpus=0,maxvCpus=16,instanceTypes=optimal

# Create job queue
aws batch create-job-queue \
  --job-queue-name microbiome-queue \
  --compute-environment-order order=1,computeEnvironment=microbiome-compute

# Register job definition
aws batch register-job-definition \
  --job-definition-name nextflow-ampliseq \
  --type container \
  --container-properties file://batch-job-definition.json
```

**Step 4: Deploy Backend to EC2**
```bash
# Launch EC2 instance (t3.medium recommended)
# Then use deployment script
chmod +x scripts/deploy-to-ec2.sh
./scripts/deploy-to-ec2.sh your-ec2-ip

# SSH to EC2 and configure
ssh ec2-user@your-ec2-ip
cd /opt/microbiome-ai/docker
cp .env.production.example .env
vim .env  # Add actual values
docker-compose up -d
```

**Step 5: Deploy Frontend**
```bash
# Build frontend
cd frontend
npm install
npm run build

# Update API endpoint in .env.production
echo "VITE_API_URL=https://api.yourdomain.com" > .env.production

# Deploy to S3
aws s3 sync dist/ s3://microbiome-frontend-prod

# Create CloudFront distribution (via AWS Console or CLI)
# Point to S3 bucket, enable HTTPS
```

**Step 6: Configure Domain & SSL**
```bash
# Request SSL certificate (AWS Certificate Manager)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --domain-name api.yourdomain.com \
  --validation-method DNS

# Configure Route 53 DNS:
# api.yourdomain.com → EC2 Elastic IP
# yourdomain.com → CloudFront distribution
```

**💰 Estimated Monthly Costs**
- EC2 t3.medium: ~$30
- RDS db.t4g.micro: ~$15  
- S3 storage (50GB): ~$1
- Data transfer: ~$5-10
- Batch compute (on-demand): ~$10-30
- **Total: $60-90/month**

**📊 Monitoring**
```bash
# View backend logs
ssh ec2-user@your-ec2-ip
docker logs -f microbiome-backend

# Monitor Batch jobs
aws batch describe-jobs --jobs job-id

# CloudWatch dashboard
# Create alarms for errors, high CPU, failed jobs
```

**🔒 Security Checklist**
- [ ] Change SECRET_KEY in production
- [ ] Set DEBUG=False
- [ ] Configure security groups (only 80/443/22)
- [ ] Enable HTTPS redirect
- [ ] Use IAM roles (no hardcoded AWS keys)
- [ ] Enable RDS encryption
- [ ] Regular backups enabled
- [ ] CloudWatch logging configured

**📖 Full Documentation**
See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete step-by-step guide.

