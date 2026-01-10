from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
import shutil
import os
import threading
import subprocess
import logging
import csv
from pathlib import Path
from .models import AnalysisJob, UploadedFile, AnalysisResult
from .serializers import (
    AnalysisJobSerializer, UploadedFileSerializer,
    AnalysisResultSerializer, UploadRequestSerializer
)

logger = logging.getLogger(__name__)


def run_nextflow_analysis(job_id):
    """
    Run Nextflow ampliseq pipeline in background
    """
    try:
        # Get the job from database
        job = AnalysisJob.objects.get(job_id=job_id)
        
        logger.info(f"Starting Nextflow analysis for job {job_id}")
        
        # Update status to processing
        job.status = 'processing'
        job.save()
        
        # Get uploaded files
        files = job.files.all()
        job_dir = Path(settings.MEDIA_ROOT) / 'uploads' / str(job_id)
        
        # Create samplesheet.csv (comma-separated, not tab-separated)
        samplesheet_path = job_dir / 'samplesheet.csv'
        with open(samplesheet_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, delimiter=',', lineterminator='\n')
            writer.writerow(['sampleID', 'forwardReads', 'reverseReads', 'run'])
            
            if job.data_type == 'paired-end':
                # Find R1 and R2 files
                file_list = list(files)
                r1_file = None
                r2_file = None
                
                for file_obj in file_list:
                    file_path = Path(settings.MEDIA_ROOT) / file_obj.file.name
                    if '_R1' in file_obj.file_name or '_1' in file_obj.file_name:
                        r1_file = str(file_path)
                    elif '_R2' in file_obj.file_name or '_2' in file_obj.file_name:
                        r2_file = str(file_path)
                
                if r1_file and r2_file:
                    writer.writerow(['sample1', r1_file, r2_file, 'A'])
                else:
                    raise ValueError("Could not find R1 and R2 files")
            else:
                # Single-end
                file_obj = file_list[0]
                file_path = str(Path(settings.MEDIA_ROOT) / file_obj.file.name)
                writer.writerow(['sample1', file_path, '', 'A'])
        
        # Create output directory
        results_dir = job_dir / 'results'
        results_dir.mkdir(exist_ok=True)
        
        # Prepare Nextflow command
        cmd = [
            'nextflow', 'run', 'nf-core/ampliseq',
            '-r', '2.15.0',  # Latest stable version
            '-resume',  # Resume from previous failed runs
            '--input', str(samplesheet_path),
            '--outdir', str(results_dir),
            '--FW_primer', 'GTGYCAGCMGCCGCGGTAA',
            '--RV_primer', 'GGACTACNVGGGTWTCTAAT',
            '--dada_ref_taxonomy', 'gtdb',  # Specify reference database explicitly
        ]
        
        # For test data, skip optional steps to speed up analysis
        if job.is_test_data:
            logger.info(f"Using test data mode - skipping optional analysis steps")
            cmd.extend([
                '--skip_fastqc',  # Skip FastQC - QC reporting
                '--skip_barrnap',  # Skip SSU annotation
                #'--skip_barplot',  # Skip visualization
                '--skip_abundance_tables',  # Skip relative abundance tables
                '--skip_alpha_rarefaction',  # Skip diversity analysis
                '--skip_diversity_indices',  # Skip alpha/beta diversity
                '--skip_ancom',  # Skip differential abundance testing
                '--skip_multiqc',  # Skip summary report
                '--max_cpus', '3',  # Limit CPUs to 3
                '--max_memory', '6.GB',  # Conservative memory limit
            ])
        else:
            logger.info(f"Using real user data mode - running full analysis pipeline")
            # For real user data, run full pipeline with appropriate resources
            cmd.extend([
                '--max_cpus', '8',  # More CPUs for real analysis
                '--max_memory', '16.GB',  # More memory for real analysis
            ])
        
        # Check if running locally (detect by checking available memory)
        # If running on laptop/local machine, add strict memory limits
        try:
            import psutil
            available_gb = psutil.virtual_memory().available / (1024**3)
            if available_gb < 35:  # Less than 35GB = likely local machine
                logger.info(f"Local testing mode detected ({available_gb:.1f}GB available)")
                # Add custom config to limit process memory and CPUs
                config_file = job_dir / 'custom.config'
                with open(config_file, 'w') as f:
                    f.write("""
// Allow overwriting of existing report files
timeline.overwrite = true
report.overwrite = true
trace.overwrite = true
dag.overwrite = true

// Disable Docker and Singularity, use Conda only
docker.enabled = false
singularity.enabled = false
apptainer.enabled = false

// Conda configuration
conda {
    enabled = true
    useMamba = true
}

// Force local execution without containers
process {
    executor = 'local'
    container = null
    withName: 'CUTADAPT_BASIC' {
        memory = 4.GB
        cpus = 4
    }
    withName: 'DADA2_FILTNTRIM' {
        memory = 4.GB
        cpus = 4
    }
    withName: 'DADA2_ERR' {
        memory = 4.GB
        cpus = 4
    }
    withName: 'DADA2_DENOISING' {
        memory = 4.GB
        cpus = 4
    }
    withName: 'DADA2_RMCHIMERA' {
        memory = 4.GB
        cpus = 4
    }
    withName: 'DADA2_MERGE' {
        memory = 4.GB
        cpus = 4
    }
    withName: 'DADA2_TAXONOMY' {
        memory = 5.GB
        cpus = 4
    }
    withName: 'NFCORE_AMPLISEQ:AMPLISEQ:DADA2_TAXONOMY_WF:DADA2_ADDSPECIES' {
        memory = 14.GB
        cpus = 2
    }
}
""")
                cmd.extend(['-c', str(config_file)])
        except ImportError:
            logger.warning("psutil not available, skipping local memory detection")
            pass
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Set environment variables for Nextflow
        env = os.environ.copy()
        env['NXF_ANSI_LOG'] = 'false'  # Disable ANSI colors in logs
        
        # Run Nextflow
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(job_dir),
            env=env,
            timeout=3600  # 1 hour timeout
        )
        
        logger.info(f"Nextflow stdout: {result.stdout}")
        if result.stderr:
            logger.warning(f"Nextflow stderr: {result.stderr}")
        
        if result.returncode == 0:
            logger.info(f"Nextflow completed successfully for job {job_id}")
            
            # Parse and save results
            # Look for key output files
            summary_report = results_dir / 'summary_report' / 'summary_report.html'
            
            # Generate bacteria composition plot
            bacteria_plot_path = None
            try:
                from django.core.files import File
                
                # Run the bacteria composition script
                script_path = Path(settings.BASE_DIR).parent.parent / 'analysis_bioinf' / 'create_bacteria_barplot.py'
                if script_path.exists():
                    logger.info(f"Generating bacteria composition plot...")
                    plot_result = subprocess.run(
                        ['python3', str(script_path), str(results_dir)],
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    if plot_result.returncode == 0:
                        bacteria_plot_path = results_dir / 'bacteria_composition.png'
                        logger.info(f"Bacteria plot generated: {bacteria_plot_path}")
                    else:
                        logger.warning(f"Could not generate bacteria plot: {plot_result.stderr}")
            except Exception as e:
                logger.warning(f"Error generating bacteria plot: {e}")
            
            # Create AnalysisResult record
            result_obj = AnalysisResult.objects.create(job=job)
            
            # Save summary report if exists
            if summary_report.exists():
                with open(summary_report, 'rb') as f:
                    from django.core.files import File
                    result_obj.report_html.save(
                        f'summary_report_{job_id}.html',
                        File(f),
                        save=False
                    )
                logger.info(f"Summary report saved")
            
            # Save bacteria composition plot if generated
            if bacteria_plot_path and bacteria_plot_path.exists():
                with open(bacteria_plot_path, 'rb') as f:
                    from django.core.files import File
                    result_obj.taxonomy_plot.save(
                        f'bacteria_composition_{job_id}.png',
                        File(f),
                        save=False
                    )
                logger.info(f"Bacteria composition plot saved")
            
            # Save execution info
            result_obj.execution_time = result.stdout.count('Completed')  # Simple metric
            result_obj.save()
            
            # Update job status
            job.status = 'completed'
            job.completed_at = timezone.now()
            job.save()
            
            logger.info(f"Results saved for job {job_id}")
            
        else:
            # Pipeline failed
            logger.error(f"Nextflow failed for job {job_id}: {result.stderr}")
            job.status = 'failed'
            job.error_message = f"Nextflow error: {result.stderr[:500]}"
            job.save()
    
    except subprocess.TimeoutExpired:
        logger.error(f"Nextflow timeout for job {job_id}")
        job.status = 'failed'
        job.error_message = "Analysis timed out after 1 hour"
        job.save()
    
    except Exception as e:
        logger.exception(f"Error running Nextflow for job {job_id}: {str(e)}")
        try:
            job = AnalysisJob.objects.get(job_id=job_id)
            job.status = 'failed'
            job.error_message = str(e)[:500]
            job.save()
        except:
            pass


class AnalysisJobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing analysis jobs
    """
    queryset = AnalysisJob.objects.all()
    serializer_class = AnalysisJobSerializer
    lookup_field = 'job_id'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        """
        Upload files and create a new analysis job
        POST /api/jobs/upload/
        """
        serializer = UploadRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        use_test_data = data.get('use_test_data', False)
        
        # Create the analysis job
        job = AnalysisJob.objects.create(
            project_name=data['project_name'],
            email=data['email'],
            data_type=data.get('data_type', 'paired-end'),
            send_email=data.get('send_email', True),
            is_test_data=use_test_data,
            status='pending'
        )
        
        # Handle test data or uploaded files
        if use_test_data:
            # Path to test data - handle both local and Docker paths
            test_data_dir = os.path.join(settings.BASE_DIR, 'analysis_bioinf', 'test_input')
            if not os.path.exists(test_data_dir):
                # Fallback to parent directory structure (local development)
                test_data_dir = os.path.join(settings.BASE_DIR.parent.parent, 'analysis_bioinf', 'test_input')
            
            test_files = [
                '1a_S103_L001_R1_001.fastq.gz',
                '1a_S103_L001_R2_001.fastq.gz'
            ]
            
            logger.info(f"Looking for test data in: {test_data_dir}")
            
            # Create job directory in media
            job_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', str(job.job_id))
            os.makedirs(job_dir, exist_ok=True)
            
            # Copy test files and create UploadedFile records
            for filename in test_files:
                src_path = os.path.join(test_data_dir, filename)
                if os.path.exists(src_path):
                    dest_path = os.path.join(job_dir, filename)
                    shutil.copy2(src_path, dest_path)
                    
                    # Create UploadedFile record with relative path
                    relative_path = os.path.join('uploads', str(job.job_id), filename)
                    file_size = os.path.getsize(src_path)
                    
                    UploadedFile.objects.create(
                        job=job,
                        file=relative_path,
                        file_name=filename,
                        file_size=file_size
                    )
                    logger.info(f"Copied test file: {filename}")
                else:
                    logger.error(f"Test file not found: {src_path}")
        else:
            # Save uploaded files
            files = request.FILES.getlist('files')
            for file in files:
                UploadedFile.objects.create(
                    job=job,
                    file=file,
                    file_name=file.name,
                    file_size=file.size
                )
        
        # Trigger Nextflow pipeline in background thread
        thread = threading.Thread(target=run_nextflow_analysis, args=(job.job_id,))
        thread.daemon = True
        thread.start()
        
        logger.info(f"Started background Nextflow thread for job {job.job_id}")
        
        response_serializer = AnalysisJobSerializer(job)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='status')
    def get_status(self, request, job_id=None):
        """
        Get the status of an analysis job
        GET /api/jobs/{job_id}/status/
        """
        job = self.get_object()
        return Response({
            'job_id': str(job.job_id),
            'status': job.status,
            'created_at': job.created_at,
            'updated_at': job.updated_at,
            'completed_at': job.completed_at,
            'error_message': job.error_message
        })

    @action(detail=True, methods=['get'], url_path='results')
    def get_results(self, request, job_id=None):
        """
        Get the results of a completed analysis job
        GET /api/jobs/{job_id}/results/
        """
        job = self.get_object()
        
        if job.status != 'completed':
            return Response(
                {'error': 'Analysis not completed yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = job.result
            serializer = AnalysisResultSerializer(result)
            return Response(serializer.data)
        except AnalysisResult.DoesNotExist:
            return Response(
                {'error': 'No results found'},
                status=status.HTTP_404_NOT_FOUND
            )
