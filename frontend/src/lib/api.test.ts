import { describe, it, expect } from 'vitest'
import { API_ENDPOINTS, API_BASE_URL } from './api'

describe('API Configuration', () => {
  it('should have correct base URL', () => {
    expect(API_BASE_URL).toBeDefined()
    expect(typeof API_BASE_URL).toBe('string')
  })

  it('should construct correct endpoint URLs', () => {
    expect(API_ENDPOINTS.JOBS_UPLOAD).toBe(`${API_BASE_URL}/api/jobs/upload/`)
    
    const testJobId = '123e4567-e89b-12d3-a456-426614174000'
    expect(API_ENDPOINTS.JOB_DETAIL(testJobId)).toBe(
      `${API_BASE_URL}/api/jobs/${testJobId}/`
    )
    expect(API_ENDPOINTS.JOB_STATUS(testJobId)).toBe(
      `${API_BASE_URL}/api/jobs/${testJobId}/status/`
    )
    expect(API_ENDPOINTS.JOB_RESULTS(testJobId)).toBe(
      `${API_BASE_URL}/api/jobs/${testJobId}/results/`
    )
    expect(API_ENDPOINTS.JOB_BACTERIA(testJobId)).toBe(
      `${API_BASE_URL}/api/jobs/${testJobId}/bacteria/`
    )
  })
})
