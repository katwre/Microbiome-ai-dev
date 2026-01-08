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