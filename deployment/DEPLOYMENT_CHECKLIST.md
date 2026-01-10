# AWS Deployment Checklist

## Phase 1: Code Preparation (Do First)

### 1.1 Settings Configuration
- [ ] Create `settings_prod.py` for production settings
- [ ] Move secrets to environment variables
- [ ] Configure S3 for media files (django-storages)
- [ ] Switch to PostgreSQL RDS
- [ ] Update ALLOWED_HOSTS from env var
- [ ] Set DEBUG=False for production
- [ ] Configure CORS for production domain

### 1.2 Dependencies
- [ ] Add to `requirements.txt`:
  - `boto3>=1.34.0` (AWS SDK)
  - `django-storages[s3]>=1.14.0` (S3 file storage)
  - `psycopg2-binary>=2.9.9` (PostgreSQL)
  - `gunicorn>=21.2.0` (WSGI server)
  - `whitenoise>=6.6.0` (Static files)
  - `dj-database-url>=2.1.0` (Database URL parsing)

### 1.3 AWS Batch Integration
- [ ] Create `utils/aws_batch.py` to submit Nextflow jobs
- [ ] Update views.py to use AWS Batch instead of local Nextflow
- [ ] Add polling mechanism for Batch job status

### 1.4 Security
- [ ] Generate new SECRET_KEY for production
- [ ] Set up AWS Secrets Manager
- [ ] Configure security groups (only HTTPS/SSH)
- [ ] Set up SSL certificate via ACM
- [ ] Enable HTTPS redirect

---

## Phase 2: AWS Infrastructure Setup

### 2.1 S3 Buckets
```bash
# Create buckets
aws s3 mb s3://microbiome-uploads-prod
aws s3 mb s3://microbiome-results-prod
aws s3 mb s3://microbiome-frontend-prod

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket microbiome-uploads-prod \
  --versioning-configuration Status=Enabled

# Configure CORS for uploads bucket
aws s3api put-bucket-cors \
  --bucket microbiome-uploads-prod \
  --cors-configuration file://s3-cors.json
```

### 2.2 RDS PostgreSQL
```bash
# Create database (or use console)
aws rds create-db-instance \
  --db-instance-identifier microbiome-db-prod \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.5 \
  --allocated-storage 20 \
  --master-username microbiome_admin \
  --master-user-password $(openssl rand -base64 32) \
  --backup-retention-period 7 \
  --storage-encrypted \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

### 2.3 IAM Roles
- [ ] **EC2 Instance Role**: S3 access, Batch submit, Secrets Manager
- [ ] **Batch Job Role**: S3 read/write for Nextflow
- [ ] **ECS Task Execution Role**: ECR pull, CloudWatch logs

### 2.4 ECR Repositories
```bash
# Create repos
aws ecr create-repository --repository-name microbiome-backend
aws ecr create-repository --repository-name microbiome-nextflow

# Get login credentials
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

---

## Phase 3: Nextflow on AWS Batch

### 3.1 Batch Compute Environment
```bash
aws batch create-compute-environment \
  --compute-environment-name microbiome-compute-env \
  --type MANAGED \
  --state ENABLED \
  --compute-resources '{
    "type": "EC2",
    "minvCpus": 0,
    "maxvCpus": 16,
    "instanceTypes": ["m5.large", "m5.xlarge"],
    "subnets": ["subnet-xxx"],
    "securityGroupIds": ["sg-xxx"],
    "instanceRole": "arn:aws:iam::xxx:instance-profile/ecsInstanceRole"
  }'
```

### 3.2 Job Queue
```bash
aws batch create-job-queue \
  --job-queue-name microbiome-job-queue \
  --state ENABLED \
  --priority 1 \
  --compute-environment-order order=1,computeEnvironment=microbiome-compute-env
```

### 3.3 Job Definition
```bash
aws batch register-job-definition \
  --job-definition-name nextflow-ampliseq \
  --type container \
  --container-properties '{
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/microbiome-nextflow:latest",
    "vcpus": 4,
    "memory": 8192,
    "jobRoleArn": "arn:aws:iam::xxx:role/BatchJobRole",
    "environment": [
      {"name": "AWS_DEFAULT_REGION", "value": "us-east-1"}
    ]
  }'
```

---

## Phase 4: Backend Deployment

### Option A: EC2 (Simpler, Recommended)
```bash
# Launch EC2 t3.medium or t3.large
# Install Docker & Docker Compose
# Clone repo and deploy

# On EC2:
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Deploy
git clone <your-repo>
cd docker
cp .env.aws.example .env
# Edit .env with production values
docker-compose up -d
```

### Option B: ECS/Fargate (More scalable)
- [ ] Create ECS cluster
- [ ] Define task definition
- [ ] Create Application Load Balancer
- [ ] Configure auto-scaling

### Option C: Lambda + API Gateway (Serverless)
⚠️ **Not recommended** for your use case:
- Nextflow jobs are long-running (5-15 min)
- Lambda has 15-minute timeout
- Better to use EC2/ECS + Batch

---

## Phase 5: Frontend Deployment

### 5.1 Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 5.2 Deploy to S3
```bash
aws s3 sync dist/ s3://microbiome-frontend-prod
```

### 5.3 CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name microbiome-frontend-prod.s3.amazonaws.com \
  --default-root-object index.html
```

### 5.4 Update Frontend API URL
Edit `frontend/src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.yourdomain.com'
  : 'http://localhost:8000';
```

---

## Phase 6: Monitoring & Logging

- [ ] CloudWatch Logs for backend
- [ ] CloudWatch Logs for Batch jobs
- [ ] Set up alarms for errors
- [ ] Configure log retention policies
- [ ] Enable X-Ray tracing (optional)

---

## Phase 7: Domain & SSL

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --domain-name api.yourdomain.com \
  --validation-method DNS

# Configure Route 53
# Point api.yourdomain.com -> EC2/ALB
# Point yourdomain.com -> CloudFront
```

---

## Cost Estimates (Monthly)

### Minimal Setup (~$50-100/month):
- EC2 t3.medium (1 instance): ~$30
- RDS db.t4g.micro: ~$15
- S3 (50GB): ~$1
- Data transfer: ~$5-20
- Batch compute (pay per use): ~$10-30

### With Auto-scaling (~$100-300/month):
- ECS with 2-4 tasks
- RDS db.t4g.small
- More Batch usage

---

## Testing Checklist

- [ ] Backend health check: `https://api.yourdomain.com/health/`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] File upload to S3 works
- [ ] Batch job submission successful
- [ ] Batch job completion triggers callback
- [ ] Results accessible via API
- [ ] Email notifications work
- [ ] Error handling works

---

## Rollback Plan

1. Keep previous Docker images tagged
2. Database backups daily (RDS automated)
3. S3 versioning enabled
4. Can redeploy previous version via ECR tags

---

## Next Steps

1. **Start with Phase 1** - make code changes locally
2. **Test locally** with docker-compose
3. **Set up AWS infrastructure** (Phase 2-3)
4. **Deploy backend** (Phase 4)
5. **Deploy frontend** (Phase 5)
6. **Test end-to-end**
7. **Set up monitoring**
8. **Configure domain & SSL**
