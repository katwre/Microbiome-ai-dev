from rest_framework import serializers
from .models import AnalysisJob, UploadedFile, AnalysisResult


class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ['id', 'file_name', 'file_size', 'uploaded_at']


class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = [
            'report_html', 'alpha_diversity_plot', 'beta_diversity_plot',
            'taxonomy_plot', 'alpha_diversity_data', 'beta_diversity_data',
            'taxonomy_data', 'execution_time', 'created_at'
        ]


class AnalysisJobSerializer(serializers.ModelSerializer):
    files = UploadedFileSerializer(many=True, read_only=True)
    result = AnalysisResultSerializer(read_only=True)
    
    class Meta:
        model = AnalysisJob
        fields = [
            'job_id', 'project_name', 'email', 'data_type', 'status',
            'send_email', 'created_at', 'updated_at', 'completed_at',
            'error_message', 'files', 'result'
        ]
        read_only_fields = ['job_id', 'status', 'created_at', 'updated_at', 'completed_at']


class UploadRequestSerializer(serializers.Serializer):
    """Serializer for file upload request"""
    project_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    data_type = serializers.ChoiceField(choices=['single-end', 'paired-end'])
    send_email = serializers.BooleanField(default=True)
    files = serializers.ListField(
        child=serializers.FileField(),
        allow_empty=False
    )
