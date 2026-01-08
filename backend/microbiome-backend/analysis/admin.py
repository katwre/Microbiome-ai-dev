from django.contrib import admin
from .models import AnalysisJob, UploadedFile, AnalysisResult


@admin.register(AnalysisJob)
class AnalysisJobAdmin(admin.ModelAdmin):
    list_display = ['job_id', 'project_name', 'email', 'status', 'data_type', 'created_at']
    list_filter = ['status', 'data_type', 'created_at']
    search_fields = ['project_name', 'email', 'job_id']
    readonly_fields = ['job_id', 'created_at', 'updated_at']


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'job', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['file_name', 'job__project_name']


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['job', 'execution_time', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job__project_name']
    readonly_fields = ['created_at']
