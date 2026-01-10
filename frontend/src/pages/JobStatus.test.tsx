import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { BrowserRouter, useParams } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import JobStatus from './JobStatus'
import { server, mockJob } from '../test/mocks/server'
import { API_ENDPOINTS } from '@/lib/api'

// Mock the useParams hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ jobId: '550e8400-e29b-41d4-a716-446655440000' }),
  }
})

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter })
}

describe('JobStatus Page', () => {
  it('should render loading state initially', () => {
    renderWithRouter(<JobStatus />)
    // The loading spinner is an SVG with animate-spin class, not a text element
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should display job details after loading', async () => {
    renderWithRouter(<JobStatus />)

    await waitFor(() => {
      expect(screen.getByText(mockJob.project_name)).toBeInTheDocument()
    })

    expect(screen.getByText(mockJob.email)).toBeInTheDocument()
    expect(screen.getByText(/Completed/i)).toBeInTheDocument()
  })

  it('should display download buttons for completed jobs', async () => {
    renderWithRouter(<JobStatus />)

    await waitFor(() => {
      expect(screen.getByText(/Download Full Report/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Download Bacteria Plot/i)).toBeInTheDocument()
  })

  it('should show uploaded files', async () => {
    renderWithRouter(<JobStatus />)

    await waitFor(() => {
      expect(screen.getByText('test_R1.fastq.gz')).toBeInTheDocument()
    })
  })

  it('should handle job not found', async () => {
    server.use(
      http.get(API_ENDPOINTS.JOB_DETAIL(':jobId'), () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    renderWithRouter(<JobStatus />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Job Not Found/i })).toBeInTheDocument()
    })
  })
})
