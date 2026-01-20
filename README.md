# Microbiome Data Analysis

![CI Status](https://github.com/katwre/Microbiome-ai-dev/actions/workflows/ci.yml/badge.svg)


<figure>
<p align="center">
  <img src="./img/MicrobiomeReportBuilderApp.gif" alt="Logo" width="900">
</p>
  <figcaption align="center"><b>Figure.</b> A preview of the application interface.</figcaption>
</figure>

It's a web-based application that allows users to upload microbiome sequencing data (such as 16S rRNA gene sequencing), perform basic data analysis, and generate visualizations of the microbiome diversity.

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

☁️ Render

**CI/CD:**

🔄 GitHub Actions

**Frontend:** 

✨ Vibe-coded with Lovable: React 18 • TypeScript • Vite • shadcn-ui • Tailwind CSS

---

## Features

- 🧬 **16S rRNA Sequencing Analysis** - Upload FASTQ files for bacterial identification
- 🧪 **Test Data Mode** - Try the pipeline with built-in sample data
- 📊 **Interactive Visualizations** - View taxonomy composition and diversity metrics
- 🔄 **Real-time Status Updates** - Track analysis progress live
- 📈 **Comprehensive Reports** - Get detailed HTML reports with all results
- 🐳 **Dockerized Deployment** - Easy local development and production deployment
- ✅ **Automated Testing** - 42 tests (25 backend + 17 frontend) with CI/CD
- ☁️ **Cloud-Ready** - Deploy to AWS, Render, or Railway

---

## Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/katwre/Microbiome-ai-dev.git
cd Microbiome-ai-dev

# Start with Docker Compose
cd docker
docker-compose up -d

# Access application
# Frontend: http://localhost
# Backend API: http://localhost:8000/api/
```

**Try it out locally:**

1. Open http://localhost
2. Click "Start New Analysis"
3. Fill in project details
4. Check "Use sample data for testing"
5. Click "Run Analysis"
6. Wait ~5-10 minutes for results


### Cloud Deployment

🌐 **Live Demo:** [**https://microbiome-frontend.onrender.com**](https://microbiome-frontend.onrender.com)

> **⚠️ Note:** The live demo runs on Render's free tier and may be temporarily offline due to inactivity (15min sleep) or resource limitations. Alternatively, please run it locally using Docker.

---

## Documentation

### Architecture

**Backend** - [Backend Documentation](backend/microbiome-backend/README.md)
- REST API with Django & Django REST Framework
- PostgreSQL (production) / SQLite (development)
- Comprehensive test suite (25 tests)

**Frontend** - [Frontend Documentation](frontend/README.md)
- React SPA with TypeScript
- Component library: shadcn-ui
- Testing with Vitest (17 tests)

**Bioinformatics Pipeline**
- Nextflow workflow engine
- nf-core/ampliseq v2.15.0
- DADA2 for ASV calling
- GTDB taxonomic classification

**Testing** - [Testing Guide](backend/microbiome-backend/TESTING.md)
- 42 total tests (100% passing)
- Unit tests for models and API
- Integration tests for workflows
- CI pipeline with GitHub Actions

**Deployment**
- [Render Deployment Guide](deployment/RENDER_DEPLOYMENT.md) - Quick cloud deployment
- [CI/CD Documentation](ci_cd/README.md) - Automated testing and deployment

---

## API Reference

### Endpoints

**Create Analysis Job**
```http
POST /api/jobs/upload/
Content-Type: multipart/form-data

Parameters:
- project_name: string (required)
- email: string (required)
- data_type: "paired-end" | "single-end" (required)
- files: File[] (optional if use_test_data=true)
- use_test_data: boolean (default: false)
- send_email: boolean (default: true)

Response:
{
  "job_id": "uuid",
  "status": "pending",
  "message": "Job created successfully"
}
```

**Get Job Status**
```http
GET /api/jobs/{job_id}/status/

Response:
{
  "job_id": "uuid",
  "status": "pending" | "processing" | "completed" | "failed",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "completed_at": "timestamp | null",
  "error_message": "string | null"
}
```

**Get Job Details**
```http
GET /api/jobs/{job_id}/

Response:
{
  "job_id": "uuid",
  "project_name": "string",
  "email": "string",
  "status": "string",
  "files": [...],
  "result": {...}
}
```

**Get Analysis Results**
```http
GET /api/jobs/{job_id}/results/

Response:
{
  "report_html": "url",
  "taxonomy_plot": "url",
  "alpha_diversity_plot": "url",
  "beta_diversity_plot": "url",
  "execution_time": number
}
```

**Get Bacteria Composition**
```http
GET /api/jobs/{job_id}/bacteria/

Response:
[
  {
    "genus": "Lactobacillus",
    "family": "Lactobacillaceae",
    "phylum": "Firmicutes",
    "total_reads": 15234
  },
  ...
]
```

---

## Development

### Project Structure

```
Microbiome-ai-dev/
├── backend/microbiome-backend/     # Django backend
│   ├── analysis/                   # Analysis app
│   ├── mysite/                     # Django settings
│   ├── tests.py                    # Test suite
│   └── README.md                   # Backend docs
├── frontend/                       # React frontend
│   ├── src/                        # Source code
│   ├── tests/                      # Test files
│   └── README.md                   # Frontend docs
├── docker/                         # Docker configs
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── .github/workflows/              # CI/CD pipeline
│   └── ci.yml                      # GitHub Actions
├── deployment/                     # Deployment guides
└── ci_cd/                          # CI/CD documentation
```

### Running Tests

**Backend Tests (25 tests)**
```bash
cd backend/microbiome-backend
python manage.py test
```

**Frontend Tests (17 tests)**
```bash
cd frontend
bun test
```

**All Tests in CI**
```bash
# Automatically run on every push
# View results: GitHub Actions tab
```

### Local Development Workflow

1. **Make changes** to backend or frontend code
2. **Run tests locally** to verify
3. **Commit and push** to GitHub
4. **CI runs automatically** - tests must pass
5. **Deploy** (manual via Render dashboard or automatic with CD)

---

## Deployment Options

### Option 1: Render (Recommended for Quick Deploy)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

- Free tier available
- PostgreSQL included
- Auto-deploy from GitHub
- [Full Guide](deployment/RENDER_DEPLOYMENT.md)

### Option 2: Docker (Local/Self-Hosted)

```bash
cd docker
docker-compose up -d
```

- Complete control
- No external dependencies
- Perfect for testing

### Option 3: AWS (Production-Grade)

- EC2 for backend
- S3 for storage
- Batch for pipeline execution
- See detailed AWS guide in README

---

## Testing

### Test Coverage

- ✅ **Backend:** 25 tests (Models, API, Integration)
- ✅ **Frontend:** 17 tests (Components, Pages, Utils)
- ✅ **Total:** 42 tests, 100% passing

### Test Types

**Unit Tests**
- Model creation and validation
- API endpoint functionality
- Utility functions

**Integration Tests**
- Complete workflow: upload → process → results
- Database interactions
- Job isolation and concurrency

**CI Pipeline**
- Runs on every push
- Must pass before merge
- [View CI Status](https://github.com/katwre/Microbiome-ai-dev/actions)

---

## Bioinformatics Pipeline

### Workflow Steps

1. **Quality Control** - FastQC on raw reads
2. **Primer Trimming** - Cutadapt removes primers
3. **Denoising** - DADA2 infers ASVs
4. **Chimera Removal** - Filter chimeric sequences
5. **Taxonomy Assignment** - GTDB database classification
6. **Diversity Analysis** - Alpha & beta diversity metrics
7. **Visualization** - Generate plots and reports

### Pipeline Parameters

- Default: Paired-end Illumina data
- Customizable via Nextflow config
- Supports single-end mode
- Configurable quality thresholds

### Output Files

- `ASV_table.tsv` - Abundance matrix
- `ASV_tax.gtdb.tsv` - Taxonomic assignments
- `report.html` - MultiQC summary
- Diversity plots (PNG/PDF)

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

---

## License

This project is open source and available under the MIT License.

---

## Acknowledgments

- **nf-core/ampliseq** - Nextflow pipeline
- **DADA2** - ASV inference algorithm
- **GTDB** - Taxonomic database
- **Lovable** - Frontend scaffolding

---

## Contact

For questions or support, please open an issue on GitHub.

---

## Links

- [Live Demo](https://microbiome-frontend.onrender.com) (if deployed)
- [Backend API Docs](backend/microbiome-backend/README.md)
- [Frontend Docs](frontend/README.md)
- [Testing Guide](backend/microbiome-backend/TESTING.md)
- [Deployment Guide](deployment/RENDER_DEPLOYMENT.md)
- [CI/CD Documentation](ci_cd/README.md)

