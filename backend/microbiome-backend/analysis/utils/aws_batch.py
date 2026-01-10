"""
AWS Batch integration for running Nextflow pipelines
"""
import boto3
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class AWSBatchClient:
    """Client for submitting and monitoring AWS Batch jobs"""
    
    def __init__(self):
        self.batch = boto3.client('batch', region_name=settings.AWS_S3_REGION_NAME)
        self.s3 = boto3.client('s3', region_name=settings.AWS_S3_REGION_NAME)
    
    def submit_nextflow_job(self, job_id, input_files, metadata):
        """
        Submit Nextflow pipeline job to AWS Batch
        
        Args:
            job_id: Unique job identifier
            input_files: List of S3 paths to input FASTQ files
            metadata: Dict with project_name, email, data_type, etc.
        
        Returns:
            AWS Batch job ID
        """
        try:
            # Prepare job parameters
            container_overrides = {
                'environment': [
                    {'name': 'JOB_ID', 'value': str(job_id)},
                    {'name': 'PROJECT_NAME', 'value': metadata['project_name']},
                    {'name': 'DATA_TYPE', 'value': metadata['data_type']},
                    {'name': 'INPUT_BUCKET', 'value': settings.AWS_STORAGE_BUCKET_NAME},
                    {'name': 'OUTPUT_BUCKET', 'value': settings.AWS_STORAGE_BUCKET_NAME},
                    {'name': 'CALLBACK_URL', 'value': metadata.get('callback_url', '')},
                ],
                'command': [
                    'nextflow', 'run', 'nf-core/ampliseq',
                    '-profile', 'aws',
                    '--input', f's3://{settings.AWS_STORAGE_BUCKET_NAME}/uploads/{job_id}/',
                    '--outdir', f's3://{settings.AWS_STORAGE_BUCKET_NAME}/results/{job_id}/',
                    '--max_cpus', '4',
                    '--max_memory', '8.GB',
                ]
            }
            
            # Submit job
            response = self.batch.submit_job(
                jobName=f'nextflow-{job_id}',
                jobQueue=settings.AWS_BATCH_JOB_QUEUE,
                jobDefinition=settings.AWS_BATCH_JOB_DEFINITION,
                containerOverrides=container_overrides,
            )
            
            batch_job_id = response['jobId']
            logger.info(f"Submitted AWS Batch job {batch_job_id} for analysis job {job_id}")
            
            return batch_job_id
            
        except Exception as e:
            logger.error(f"Failed to submit Batch job for {job_id}: {e}")
            raise
    
    def get_job_status(self, batch_job_id):
        """
        Get status of AWS Batch job
        
        Returns:
            dict with status, statusReason, etc.
        """
        try:
            response = self.batch.describe_jobs(jobs=[batch_job_id])
            if response['jobs']:
                job = response['jobs'][0]
                return {
                    'status': job['status'],  # SUBMITTED, PENDING, RUNNABLE, RUNNING, SUCCEEDED, FAILED
                    'status_reason': job.get('statusReason', ''),
                    'started_at': job.get('startedAt'),
                    'stopped_at': job.get('stoppedAt'),
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get Batch job status for {batch_job_id}: {e}")
            return None
    
    def cancel_job(self, batch_job_id, reason="Cancelled by user"):
        """Cancel a running Batch job"""
        try:
            self.batch.terminate_job(
                jobId=batch_job_id,
                reason=reason
            )
            logger.info(f"Cancelled Batch job {batch_job_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to cancel Batch job {batch_job_id}: {e}")
            return False


# Singleton instance
batch_client = AWSBatchClient()
