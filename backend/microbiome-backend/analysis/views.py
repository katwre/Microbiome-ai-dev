from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import AnalysisJob, UploadedFile, AnalysisResult
from .serializers import (
    AnalysisJobSerializer, UploadedFileSerializer,
    AnalysisResultSerializer, UploadRequestSerializer
)


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
        
        # Create the analysis job
        job = AnalysisJob.objects.create(
            project_name=data['project_name'],
            email=data['email'],
            data_type=data['data_type'],
            send_email=data.get('send_email', True),
            status='pending'
        )
        
        # Save uploaded files
        files = request.FILES.getlist('files')
        for file in files:
            UploadedFile.objects.create(
                job=job,
                file=file,
                file_name=file.name,
                file_size=file.size
            )
        
        # TODO: Trigger Nextflow pipeline here
        # For now, just return the job
        
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
