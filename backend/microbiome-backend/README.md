# Microbiome Analysis Backend

Django REST API for microbiome sequencing data analysis using nf-core/ampliseq pipeline.

## 📁 Project Structure

```
backend/microbiome-backend/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── requirements-prod.txt     # Production dependencies
├── mysite/                   # Django project settings
│   ├── settings.py          # Main settings
│   ├── settings_prod.py     # Production settings
│   ├── urls.py              # URL routing
│   └── wsgi.py              # WSGI application
└── analysis/                 # Analysis app
    ├── models.py            # Database models
    ├── views.py             # API endpoints
    ├── serializers.py       # Data serialization
    ├── urls.py              # App URL routing
    ├── tests.py             # Comprehensive tests
    └── migrations/          # Database migrations
```

## 🗄️ Database Models

### AnalysisJob
Tracks microbiome analysis jobs.

**Fields:**
- `job_id` (UUID, PK) - Unique identifier
- `project_name` (str) - Project name
- `email` (email) - User email
- `data_type` (choice) - 'single-end' or 'paired-end'
- `status` (choice) - 'pending', 'processing', 'completed', 'failed'
- `send_email` (bool) - Email notification flag
- `is_test_data` (bool) - Test data indicator
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp
- `completed_at` (datetime, null) - Completion timestamp
- `error_message` (text, null) - Error details

**Relationships:**
- One-to-many with UploadedFile
- One-to-one with AnalysisResult

### UploadedFile
Stores uploaded FASTQ files.

**Fields:**
- `job` (FK) - Related AnalysisJob
- `file` (file) - File path
- `file_name` (str) - Original filename
- `file_size` (int) - Size in bytes
- `uploaded_at` (datetime) - Upload timestamp

### AnalysisResult
Stores analysis results and output files.

**Fields:**
- `job` (OneToOne) - Related AnalysisJob
- `report_html` (file, null) - HTML report
- `alpha_diversity_plot` (file, null) - Alpha diversity plot
- `beta_diversity_plot` (file, null) - Beta diversity plot
- `taxonomy_plot` (file, null) - Taxonomy barplot
- `alpha_diversity_data` (file, null) - Alpha diversity TSV
- `beta_diversity_data` (file, null) - Beta diversity TSV
- `taxonomy_data` (file, null) - Taxonomy summary TSV
- `nextflow_log` (text, null) - Pipeline logs
- `execution_time` (float, null) - Execution time in seconds
- `created_at` (datetime) - Creation timestamp

## 🔌 API Endpoints

### POST /api/jobs/upload/
Upload files and create analysis job.

**Request:**
```json
{
  "project_name": "My Project",
  "email": "user@example.com",
  "data_type": "paired-end",
  "send_email": true,
  "use_test_data": false,
  "files": [<file1>, <file2>]
}
```

**Response (201):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  ...
}
```

### GET /api/jobs/{job_id}/status/
Check job status.

**Response (200):**
```json
{
  "job_id": "550e8400...",
  "status": "completed",
  "created_at": "2024-01-10T12:00:00Z",
  "updated_at": "2024-01-10T12:15:00Z",
  "completed_at": "2024-01-10T12:15:00Z",
  "error_message": null
}
```

### GET /api/jobs/{job_id}/
Get complete job details.

**Response (200):**
```json
{
  "job_id": "550e8400...",
  "project_name": "My Project",
  "email": "user@example.com",
  "status": "completed",
  "files": [
    {
      "file_name": "sample_R1.fastq.gz",
      "file_size": 1048576,
      "uploaded_at": "2024-01-10T12:00:00Z"
    }
  ],
  "result": { ... }
}
```

### GET /api/jobs/{job_id}/results/
Get analysis results (only for completed jobs).

**Response (200):**
```json
{
  "report_html": "https://api.example.com/media/results/.../report.html",
  "taxonomy_plot": "https://api.example.com/media/.../bacteria.png",
  "alpha_diversity_plot": "https://api.example.com/media/.../alpha.png",
  "beta_diversity_plot": "https://api.example.com/media/.../beta.png",
  "taxonomy_data": "https://api.example.com/media/.../bacteria.tsv",
  ...
}
```

### GET /api/jobs/{job_id}/bacteria/
Get bacteria composition data.

**Response (200):**
```json
{
  "bacteria": [
    {
      "genus": "Pseudomonas",
      "family": "Pseudomonadaceae",
      "phylum": "Proteobacteria",
      "total_reads": 12450
    },
    ...
  ],
  "total_count": 45
}
```

## 🔬 Background Processing

Analysis jobs run in background threads using Nextflow:

**Pipeline Flow:**
1. Job created with status='pending'
2. Background thread starts Nextflow pipeline
3. Status updated to 'processing'
4. Pipeline executes nf-core/ampliseq
5. Results collected and saved
6. Status updated to 'completed' or 'failed'
7. Email notification sent (if enabled)

**Key Function:**
```python
def run_nextflow_analysis(job_id):
    """
    Execute Nextflow ampliseq pipeline in background.
    
    Steps:
    1. Create samplesheet.csv
    2. Execute Nextflow command
    3. Collect results
    4. Update job status
    5. Save result files
    """
```

## 🧪 Testing

### Run Tests
```bash
cd backend/microbiome-backend

# Run all tests
python manage.py test

# Run specific test class
python manage.py test analysis.tests.AnalysisJobModelTest

# Run with verbosity
python manage.py test -v 2

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

### Test Coverage

**Models (100%)**
- Job creation and validation
- File upload tracking
- Result storage
- Cascade deletions

**API Endpoints (100%)**
- Upload validation
- Status checking
- Result retrieval
- Error handling

**Integration Tests**
- Complete workflow
- Multi-job isolation
- Background processing

### Test Organization
```
tests.py
├── AnalysisJobModelTest      # Job model tests
├── UploadedFileModelTest      # File model tests
├── AnalysisResultModelTest    # Result model tests
├── JobUploadAPITest           # Upload endpoint
├── JobStatusAPITest           # Status endpoint
├── JobDetailAPITest           # Detail endpoint
├── JobResultsAPITest          # Results endpoint
├── BacteriaAPITest            # Bacteria endpoint
└── APIIntegrationTest         # Full workflow
```

## 📝 Configuration

### Development Settings (`settings.py`)
```python
DEBUG = True
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3'}}
MEDIA_ROOT = BASE_DIR / 'media'
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

### Production Settings (`settings_prod.py`)
```python
DEBUG = False
DATABASES = {'default': dj_database_url.config()}  # PostgreSQL
STORAGES = {'default': {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage'}}
AWS_STORAGE_BUCKET_NAME = os.environ['AWS_STORAGE_BUCKET_NAME']
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
```

## 🚀 Running the Backend

### Development
```bash
cd backend/microbiome-backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Access at http://localhost:8000/api/
```

### Production
```bash
# Install production dependencies
pip install -r requirements-prod.txt

# Set environment variables
export DJANGO_SETTINGS_MODULE=mysite.settings_prod
export SECRET_KEY="your-secret-key"
export DATABASE_URL="postgresql://..."
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_STORAGE_BUCKET_NAME="..."

# Collect static files
python manage.py collectstatic --noinput

# Run with Gunicorn
gunicorn --bind 0.0.0.0:8000 --workers 3 mysite.wsgi:application
```

### Docker
```bash
# From project root
cd docker
docker-compose up -d

# View logs
docker-compose logs -f backend

# Access at http://localhost:8000/api/
```

## 🔒 Security

### Production Checklist
- ✅ `DEBUG = False`
- ✅ Strong `SECRET_KEY`
- ✅ HTTPS only (`SECURE_SSL_REDIRECT = True`)
- ✅ CSRF protection enabled
- ✅ Restricted `ALLOWED_HOSTS`
- ✅ Database with proper authentication
- ✅ S3 with IAM roles
- ✅ Input validation on all endpoints
- ✅ File type validation
- ✅ Rate limiting (recommended)

### File Upload Validation
- Maximum file size: configurable
- Allowed extensions: `.fastq`, `.fastq.gz`, `.fq`, `.fq.gz`
- Virus scanning: recommended for production

## 📊 Monitoring

### Logging
```python
import logging
logger = logging.getLogger(__name__)

# Log levels used:
logger.info("Job started")       # Normal operations
logger.warning("Low memory")     # Potential issues
logger.error("Pipeline failed")  # Errors
```

### Health Check
```bash
# Check API health
curl http://localhost:8000/api/

# Response: {"jobs": "http://localhost:8000/api/jobs/"}
```

## 🛠️ Development

### Adding New Endpoint
1. Add view method in `views.py`
2. Add serializer in `serializers.py` (if needed)
3. Add tests in `tests.py`
4. Update OpenAPI spec in `docs/openapi.yaml`
5. Run tests: `python manage.py test`

### Database Migrations
```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate

# Show migrations
python manage.py showmigrations
```

## 📚 Dependencies

### Core
- Django 5.1.4 - Web framework
- djangorestframework 3.15.2 - REST API
- gunicorn 23.0.0 - WSGI server

### Storage
- boto3 3.35.91 - AWS SDK
- django-storages 1.14.4 - S3 integration

### Data Processing
- pandas 2.2.3 - Data analysis
- biopython 1.84 - Bioinformatics

### Development
- pytest-django 4.9.0 - Testing
- coverage 7.6.10 - Code coverage

See [requirements.txt](requirements.txt) for complete list.

## 🤝 Contributing

1. Write tests first
2. Follow PEP 8 style guide
3. Add docstrings to functions
4. Update OpenAPI spec
5. Run tests before committing
6. Update documentation

## 📖 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [nf-core/ampliseq](https://nf-co.re/ampliseq)
- [OpenAPI Specification](../docs/openapi.yaml)
- [Frontend README](../../frontend/README.md)
- [Deployment Guide](../../DEPLOYMENT_CHECKLIST.md)
