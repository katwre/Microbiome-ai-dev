"""
Comprehensive tests for microbiome analysis API

Test Coverage:
- Model creation and validation
- API endpoints (upload, status, results, bacteria)
- File upload and validation
- Background job processing
- Error handling
"""

from django.test import TestCase, TransactionTestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from pathlib import Path
import tempfile
import shutil
import uuid
import json

from .models import AnalysisJob, UploadedFile, AnalysisResult
from .views import run_nextflow_analysis


class AnalysisJobModelTest(TestCase):
    """Test AnalysisJob model"""
    
    def setUp(self):
        self.job_data = {
            'project_name': 'Test Project',
            'email': 'test@example.com',
            'data_type': 'paired-end',
            'status': 'pending',
        }
    
    def test_create_job(self):
        """Test creating a new analysis job"""
        job = AnalysisJob.objects.create(**self.job_data)
        
        self.assertIsNotNone(job.job_id)
        self.assertEqual(job.project_name, 'Test Project')
        self.assertEqual(job.email, 'test@example.com')
        self.assertEqual(job.status, 'pending')
        self.assertIsNotNone(job.created_at)
        self.assertIsNone(job.completed_at)
    
    def test_job_id_is_uuid(self):
        """Test that job_id is a valid UUID"""
        job = AnalysisJob.objects.create(**self.job_data)
        
        self.assertIsInstance(job.job_id, uuid.UUID)
    
    def test_job_ordering(self):
        """Test jobs are ordered by creation date (newest first)"""
        job1 = AnalysisJob.objects.create(**self.job_data)
        job2 = AnalysisJob.objects.create(**self.job_data)
        
        jobs = AnalysisJob.objects.all()
        self.assertEqual(jobs[0].job_id, job2.job_id)
        self.assertEqual(jobs[1].job_id, job1.job_id)
    
    def test_job_status_choices(self):
        """Test valid status values"""
        valid_statuses = ['pending', 'processing', 'completed', 'failed']
        
        for status_value in valid_statuses:
            job = AnalysisJob.objects.create(
                **{**self.job_data, 'status': status_value}
            )
            self.assertEqual(job.status, status_value)


class UploadedFileModelTest(TestCase):
    """Test UploadedFile model"""
    
    def setUp(self):
        self.job = AnalysisJob.objects.create(
            project_name='Test Project',
            email='test@example.com',
            data_type='single-end',
        )
    
    def test_create_uploaded_file(self):
        """Test creating an uploaded file record"""
        uploaded_file = UploadedFile.objects.create(
            job=self.job,
            file='uploads/test.fastq.gz',
            file_name='test.fastq.gz',
            file_size=1024,
        )
        
        self.assertEqual(uploaded_file.job, self.job)
        self.assertEqual(uploaded_file.file_name, 'test.fastq.gz')
        self.assertEqual(uploaded_file.file_size, 1024)
    
    def test_file_deletion_cascades(self):
        """Test that deleting job deletes associated files"""
        UploadedFile.objects.create(
            job=self.job,
            file='uploads/test.fastq.gz',
            file_name='test.fastq.gz',
            file_size=1024,
        )
        
        self.assertEqual(UploadedFile.objects.count(), 1)
        self.job.delete()
        self.assertEqual(UploadedFile.objects.count(), 0)


class AnalysisResultModelTest(TestCase):
    """Test AnalysisResult model"""
    
    def setUp(self):
        self.job = AnalysisJob.objects.create(
            project_name='Test Project',
            email='test@example.com',
            data_type='paired-end',
            status='completed',
        )
    
    def test_create_result(self):
        """Test creating analysis result"""
        result = AnalysisResult.objects.create(
            job=self.job,
            execution_time=120.5,
        )
        
        self.assertEqual(result.job, self.job)
        self.assertEqual(result.execution_time, 120.5)
        self.assertIsNotNone(result.created_at)
    
    def test_one_to_one_relationship(self):
        """Test that only one result can exist per job"""
        AnalysisResult.objects.create(job=self.job)
        
        with self.assertRaises(Exception):
            AnalysisResult.objects.create(job=self.job)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class JobUploadAPITest(TestCase):
    """Test job upload API endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.upload_url = '/api/jobs/upload/'
    
    def tearDown(self):
        # Clean up test media directory
        if hasattr(self, 'temp_dir'):
            shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_upload_with_test_data(self):
        """Test creating job with test data"""
        data = {
            'project_name': 'Test Project',
            'email': 'test@example.com',
            'data_type': 'paired-end',
            'use_test_data': True,
            'send_email': False,
        }
        
        response = self.client.post(self.upload_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('job_id', response.data)
        self.assertEqual(response.data['project_name'], 'Test Project')
        self.assertEqual(response.data['status'], 'pending')
        # Check the database directly for is_test_data
        job = AnalysisJob.objects.get(job_id=response.data['job_id'])
        self.assertTrue(job.is_test_data)
    
    def test_upload_missing_fields(self):
        """Test upload with missing required fields"""
        data = {
            'project_name': 'Test Project',
            # Missing email and data_type
        }
        
        response = self.client.post(self.upload_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_invalid_email(self):
        """Test upload with invalid email"""
        data = {
            'project_name': 'Test Project',
            'email': 'invalid-email',
            'data_type': 'paired-end',
            'use_test_data': True,
        }
        
        response = self.client.post(self.upload_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_invalid_data_type(self):
        """Test upload with invalid data type"""
        data = {
            'project_name': 'Test Project',
            'email': 'test@example.com',
            'data_type': 'invalid-type',
            'use_test_data': True,
        }
        
        response = self.client.post(self.upload_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JobStatusAPITest(TestCase):
    """Test job status API endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.job = AnalysisJob.objects.create(
            project_name='Test Project',
            email='test@example.com',
            data_type='paired-end',
            status='processing',
        )
        self.status_url = f'/api/jobs/{self.job.job_id}/status/'
    
    def test_get_job_status(self):
        """Test retrieving job status"""
        response = self.client.get(self.status_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['job_id'], str(self.job.job_id))
        self.assertEqual(response.data['status'], 'processing')
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)
    
    def test_get_nonexistent_job_status(self):
        """Test retrieving status for non-existent job"""
        fake_uuid = uuid.uuid4()
        response = self.client.get(f'/api/jobs/{fake_uuid}/status/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_completed_job_status(self):
        """Test status for completed job"""
        self.job.status = 'completed'
        self.job.completed_at = timezone.now()
        self.job.save()
        
        response = self.client.get(self.status_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')
        self.assertIsNotNone(response.data['completed_at'])
    
    def test_failed_job_status(self):
        """Test status for failed job"""
        self.job.status = 'failed'
        self.job.error_message = 'Pipeline failed'
        self.job.save()
        
        response = self.client.get(self.status_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'failed')
        self.assertEqual(response.data['error_message'], 'Pipeline failed')


class JobDetailAPITest(TestCase):
    """Test job detail API endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.job = AnalysisJob.objects.create(
            project_name='Test Project',
            email='test@example.com',
            data_type='paired-end',
        )
        
        # Add uploaded files
        UploadedFile.objects.create(
            job=self.job,
            file='uploads/test_R1.fastq.gz',
            file_name='test_R1.fastq.gz',
            file_size=1024,
        )
        UploadedFile.objects.create(
            job=self.job,
            file='uploads/test_R2.fastq.gz',
            file_name='test_R2.fastq.gz',
            file_size=1024,
        )
        
        self.detail_url = f'/api/jobs/{self.job.job_id}/'
    
    def test_get_job_detail(self):
        """Test retrieving complete job details"""
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_name'], 'Test Project')
        self.assertEqual(len(response.data['files']), 2)
        self.assertIn('file_name', response.data['files'][0])
    
    def test_get_nonexistent_job(self):
        """Test retrieving non-existent job"""
        fake_uuid = uuid.uuid4()
        response = self.client.get(f'/api/jobs/{fake_uuid}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class JobResultsAPITest(TestCase):
    """Test job results API endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.job = AnalysisJob.objects.create(
            project_name='Test Project',
            email='test@example.com',
            data_type='paired-end',
            status='completed',
        )
        self.result = AnalysisResult.objects.create(
            job=self.job,
            execution_time=120.0,
        )
        self.results_url = f'/api/jobs/{self.job.job_id}/results/'
    
    def test_get_results_for_completed_job(self):
        """Test retrieving results for completed job"""
        response = self.client.get(self.results_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('report_html', response.data)
        self.assertIn('taxonomy_plot', response.data)
    
    def test_get_results_for_pending_job(self):
        """Test retrieving results for non-completed job"""
        self.job.status = 'pending'
        self.job.save()
        
        response = self.client.get(self.results_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_results_no_result_object(self):
        """Test retrieving results when result doesn't exist"""
        self.result.delete()
        
        response = self.client.get(self.results_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class BacteriaAPITest(TransactionTestCase):
    """Test bacteria composition API endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.job = AnalysisJob.objects.create(
            project_name='Test Project',
            email='test@example.com',
            data_type='paired-end',
            status='completed',
        )
        self.result = AnalysisResult.objects.create(
            job=self.job,
        )
        self.bacteria_url = f'/api/jobs/{self.job.job_id}/bacteria/'
    
    def test_bacteria_endpoint_not_completed(self):
        """Test bacteria endpoint for non-completed job"""
        self.job.status = 'processing'
        self.job.save()
        
        response = self.client.get(self.bacteria_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_bacteria_endpoint_no_data(self):
        """Test bacteria endpoint when no taxonomy data exists"""
        response = self.client.get(self.bacteria_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)


class APIIntegrationTest(TestCase):
    """Integration tests for complete workflow"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_complete_workflow_with_test_data(self):
        """Test complete workflow: upload -> check status -> get results"""
        # Step 1: Upload job with test data
        upload_data = {
            'project_name': 'Integration Test',
            'email': 'integration@example.com',
            'data_type': 'paired-end',
            'use_test_data': True,
            'send_email': False,
        }
        
        response = self.client.post('/api/jobs/upload/', upload_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        job_id = response.data['job_id']
        
        # Step 2: Check job status
        response = self.client.get(f'/api/jobs/{job_id}/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'pending')
        
        # Step 3: Get job details
        response = self.client.get(f'/api/jobs/{job_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_name'], 'Integration Test')
    
    def test_multiple_jobs_isolation(self):
        """Test that multiple jobs don't interfere with each other"""
        # Create two jobs
        job1_data = {
            'project_name': 'Job 1',
            'email': 'job1@example.com',
            'data_type': 'single-end',
            'use_test_data': True,
        }
        job2_data = {
            'project_name': 'Job 2',
            'email': 'job2@example.com',
            'data_type': 'paired-end',
            'use_test_data': True,
        }
        
        response1 = self.client.post('/api/jobs/upload/', job1_data, format='json')
        response2 = self.client.post('/api/jobs/upload/', job2_data, format='json')
        
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        job1_id = response1.data['job_id']
        job2_id = response2.data['job_id']
        
        # Verify they're different
        self.assertNotEqual(job1_id, job2_id)
        
        # Verify each has correct data
        detail1 = self.client.get(f'/api/jobs/{job1_id}/')
        detail2 = self.client.get(f'/api/jobs/{job2_id}/')
        
        self.assertEqual(detail1.data['project_name'], 'Job 1')
        self.assertEqual(detail2.data['project_name'], 'Job 2')

