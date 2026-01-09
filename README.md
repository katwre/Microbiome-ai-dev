# Microbiome Data Analysis

It's web-based application that allows users to upload microbiome sequencing data (such as 16S rRNA gene sequencing or metagenomic data), perform basic data analysis, and generate visualizations of the microbiome diversity.

**Technologies and System Architecture**:

- Backend: Django (Python) will serve both the frontend and backend, handling the logic for data processing and user management.

- Frontend: vibe-coded using Lovable - Vite, TypeScript, React, shadcn-ui, Tailwind CSS.

- Database: SQLite for lightweight storage (could be switched to PostgreSQL for scalability). DuckDB (optional, analytical storage for derived results).

- Bioinformatics tools: Use QIIME2 or DADA2 for data analysis.

- Containerization: Docker for packaging the application and bioinformatics tools.

- CI/CD: GitHub Actions for continuous integration and deployment.

- Cloud deployment: AWS Lambda and EC2 for hosting the application.

- Workflow & Orchestration: n8n - event-driven workflow automation layer connecting Django, storage, pipelines, and notifications; and MCP (Model Context Protocol) is used as the execution and orchestration layer for bioinformatics and analysis pipelines.


**This project demonstrates:**

- Tool-aware systems
- Automated pipelines
- Context-driven orchestration
- Minimal but realistic infrastructure
- Practical use of MCP servers to discover, run, and document tools



----




--- 


## Backend

**API Contracts**
OpenAPI/Swagger specs for:

- /api/upload/ - File upload
- /api/jobs/{job_id}/status/ - Check analysis status
- /api/jobs/{job_id}/results/ - Get results


**Database Models**

Django models for:

- AnalysisJob (job_id, status, created_at, etc.)
- UploadedData (files, metadata)
- AnalysisResults (diversity metrics, visualizations)


**Bioinformatics Pipeline Integration**

Start with a simple pipeline:

- File validation (check if it's valid TSV/QIIME2 format)
- Basic preprocessing
- Integrate QIIME2 or DADA2 (containerized)

**Status and error handling**
The error handling chain is complete: Nextflow → Backend → Database → API → Frontend UI.

## Deployment


### Quick local test command 

Test via curl:
```bash
curl -X POST http://localhost:8000/api/jobs/upload/ \
  -F "project_name=Test" \
  -F "email=test@test.com" \
  -F "data_type=paired-end" \
  -F "use_test_data=true"
```
Then check status:
```bash
curl http://localhost:8000/api/jobs/<job_id>/status/

curl http://localhost:8000/api/jobs/4343a2c7-e778-47a9-a824-6b20bb41e065/status/


```

### Testing locally via website

Start django server (from the root directory):
```bash
source ./venv/bin/activate
cd ./backend/microbiome-backend
python manage.py runserver
```

Start Frontend:
```bash
cd Microbiome-ai-dev/frontend
npm run dev
```

Open Browser:
```bash
Go to: http://localhost:8080/
```

Upload Test Data:

- Fill in project name: Test Analysis
- Fill in email: your@email.com
- Check the box: "Use test data (nf-core demo files...)"
- Click "Run analysis"

Watch django terminal, monitor progress and check results:

- Once status = completed, click "Download Report" to get the results.




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