from django.db import models
import uuid


class AnalysisJob(models.Model):
    """Track microbiome analysis jobs"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_name = models.CharField(max_length=255)
    email = models.EmailField()
    data_type = models.CharField(max_length=20, choices=[('single-end', 'Single-end'), ('paired-end', 'Paired-end')])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    send_email = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.project_name} ({self.job_id})"
    
    class Meta:
        ordering = ['-created_at']


class UploadedFile(models.Model):
    """Store uploaded microbiome data files"""
    
    job = models.ForeignKey(AnalysisJob, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  # Size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.file_name} - {self.job.project_name}"
    
    class Meta:
        ordering = ['uploaded_at']


class AnalysisResult(models.Model):
    """Store analysis results and output files"""
    
    job = models.OneToOneField(AnalysisJob, on_delete=models.CASCADE, related_name='result')
    
    # Result files
    report_html = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    alpha_diversity_plot = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    beta_diversity_plot = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    taxonomy_plot = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    
    # Raw data files (optional - for advanced users)
    alpha_diversity_data = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    beta_diversity_data = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    taxonomy_data = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    
    # Nextflow execution details
    nextflow_log = models.TextField(blank=True, null=True)
    execution_time = models.FloatField(null=True, blank=True)  # seconds
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Results for {self.job.project_name}"
    
    class Meta:
        ordering = ['-created_at']
