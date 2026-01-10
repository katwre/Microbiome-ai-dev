// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : 'http://localhost:8000';

export const API_ENDPOINTS = {
  JOBS_UPLOAD: `${API_BASE_URL}/api/jobs/upload/`,
  JOB_DETAIL: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/`,
  JOB_STATUS: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/status/`,
  JOB_RESULTS: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/results/`,
  JOB_BACTERIA: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/bacteria/`,
};

export { API_BASE_URL };
