# Microbiome Data Analysis

<p align="center">
  <img src="./img/poster.png" alt="Logo" width="500">
</p>

It's web-based application that allows users to upload microbiome sequencing data (such as 16S rRNA gene sequencing), perform basic data analysis, and generate visualizations of the microbiome diversity.

Microbiome analysis using 16S rRNA sequencing identifies which bacteria are present in your sample by reading a specific genetic "barcode" that all bacteria have. The sequencing machine reads millions of these DNA barcodes, and specialized software groups them into different bacterial species and measures how abundant each one is. This tells you the diversity of your microbial community - which bacteria are present, how many different types there are, and which ones dominate.

## Tech Stack

**Backend:**

🦎 Django • Python 3.12 • Django REST Framework • SQLite

**Bioinformatics:**

🧬 Nextflow 25.10.2 • nf-core/ampliseq • DADA2 • Cutadapt • Conda/Mamba

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


### In the cloud

```bash
┌─────────────┐
│   Frontend  │ (S3 + CloudFront)
│   React     │
└──────┬──────┘
       │ HTTP POST /api/jobs/upload/
       ▼
┌─────────────────┐
│  API Gateway +  │ ← Handle uploads, create jobs
│  Lambda         │   (Django API in Lambda container)
└──────┬──────────┘
       │ Trigger
       ▼
┌─────────────────┐
│   AWS Batch     │ ← Run Nextflow pipeline
│   (or ECS)      │   (Docker image with Nextflow + nf-core)
└──────┬──────────┘
       │ Write results
       ▼
┌─────────────────┐
│   S3 Bucket     │ ← Store FASTQ inputs + results
└─────────────────┘
       ▲
       │ Poll for status
┌──────┴──────────┐
│   RDS/DynamoDB  │ ← Job metadata, status
└─────────────────┘
```

**AWS Setup**


Set enviroment variables via .env file
```bash
# On AWS, copy the AWS template
cp .env.aws.example .env
# Edit with actual AWS paths and secrets
vim .env
docker-compose up -d
```


1. Push Docker Images to ECR

```bash
# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name microbiome-django
aws ecr create-repository --repository-name microbiome-nextflow

# Build and push
docker tag microbiome-django <account-id>.dkr.ecr.us-east-1.amazonaws.com/microbiome-django:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/microbiome-django:latest
```

2. Create S3 Buckets
```bash
# Input files
aws s3 mb s3://microbiome-uploads

# Results
aws s3 mb s3://microbiome-results
```

3. Setup RDS Database
```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier microbiome-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password <password>
```

4. Deploy:
```bash
sam build
sam deploy --guided
```

5. Setup AWS Batch


Create Compute Environment:
```bash
aws batch create-compute-environment \
  --compute-environment-name microbiome-compute \
  --type MANAGED \
  --state ENABLED \
  --compute-resources type=EC2,minvCpus=0,maxvCpus=4,instanceTypes=optimal
```

Create Job Queue:
```bash
aws batch create-job-queue \
  --job-queue-name microbiome-queue \
  --state ENABLED \
  --priority 1 \
  --compute-environment-order order=1,computeEnvironment=microbiome-compute
```

Create Job Definition:
```bash
aws batch register-job-definition \
  --job-definition-name nextflow-ampliseq \
  --type container \
  --container-properties '{
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/microbiome-nextflow:latest",
    "vcpus": 2,
    "memory": 4096,
    "jobRoleArn": "arn:aws:iam::<account-id>:role/BatchJobRole"
  }'
```


6. Update Django to Trigger Batch


7. Create Batch Job Completion Handler

Connect with EventBridge:
```bash
aws events put-rule \
  --name batch-job-state-change \
  --event-pattern '{"source":["aws.batch"],"detail-type":["Batch Job State Change"]}'

aws events put-targets \
  --rule batch-job-state-change \
  --targets "Id"="1","Arn"="arn:aws:lambda:...:function:batch-handler"
```


8. Frontend Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to S3 + CloudFront
aws s3 sync dist/ s3://microbiome-frontend
aws cloudfront create-distribution --origin-domain-name microbiome-frontend.s3.amazonaws.com
```



----

Notes:

Lovable: https://lovable.dev/projects/d97b168e-ebbe-4151-84f8-11e62661fc2a
https://github.com/katwre/microbiome-insights-builder

A concrete OpenAPI definition that clearly documents how the frontend and backend communicate, and that the backend actually follows.

A practical data flow
- Django/SQLite: receives upload, creates job_id, stores metadata
- n8n: orchestration glue (webhooks, retries, notifications)
- MCP: a thin “tool façade” that exposes Run Nextflow pipeline as a callable tool
- Nextflow: executes the actual bioinformatics workflow in containers and writes outputs
- DuckDB: stores analysis-ready tables derived from Nextflow outputs
- Django: queries DuckDB and serves plots


DuckDB competes mainly with Pandas + ad-hoc CSV parsing, not with core genomics formats