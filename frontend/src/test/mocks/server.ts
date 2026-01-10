import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { API_ENDPOINTS } from '@/lib/api'

// Mock job data
export const mockJob = {
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  project_name: 'Test Project',
  email: 'test@example.com',
  data_type: 'paired-end',
  status: 'completed',
  send_email: true,
  is_test_data: true,
  created_at: '2024-01-10T12:00:00Z',
  updated_at: '2024-01-10T12:15:00Z',
  completed_at: '2024-01-10T12:15:00Z',
  error_message: null,
  files: [
    {
      file_name: 'test_R1.fastq.gz',
      file_size: 1048576,
      uploaded_at: '2024-01-10T12:00:00Z',
    },
  ],
  result: {
    report_html: 'http://localhost:8000/media/results/report.html',
    taxonomy_plot: 'http://localhost:8000/media/results/bacteria.png',
    alpha_diversity_plot: 'http://localhost:8000/media/results/alpha.png',
    beta_diversity_plot: 'http://localhost:8000/media/results/beta.png',
    generated_at: '2024-01-10T12:15:00Z',
  },
}

export const mockBacteriaData = {
  bacteria: [
    {
      genus: 'Pseudomonas',
      family: 'Pseudomonadaceae',
      phylum: 'Proteobacteria',
      total_reads: 12450,
    },
    {
      genus: 'Streptomyces',
      family: 'Streptomycetaceae',
      phylum: 'Actinobacteria',
      total_reads: 8920,
    },
    {
      genus: 'Bacillus',
      family: 'Bacillaceae',
      phylum: 'Firmicutes',
      total_reads: 7105,
    },
  ],
  total_count: 3,
}

// MSW handlers
export const handlers = [
  // Upload job
  http.post(API_ENDPOINTS.JOBS_UPLOAD, async () => {
    return HttpResponse.json({
      ...mockJob,
      status: 'pending',
      completed_at: null,
    })
  }),

  // Get job details
  http.get(API_ENDPOINTS.JOB_DETAIL(':jobId'), () => {
    return HttpResponse.json(mockJob)
  }),

  // Get job status
  http.get(API_ENDPOINTS.JOB_STATUS(':jobId'), () => {
    return HttpResponse.json({
      job_id: mockJob.job_id,
      status: mockJob.status,
      created_at: mockJob.created_at,
      updated_at: mockJob.updated_at,
      completed_at: mockJob.completed_at,
      error_message: mockJob.error_message,
    })
  }),

  // Get bacteria data
  http.get(API_ENDPOINTS.JOB_BACTERIA(':jobId'), () => {
    return HttpResponse.json(mockBacteriaData)
  }),
]

// Create and export the server
export const server = setupServer(...handlers)
