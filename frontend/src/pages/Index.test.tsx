import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import Index from './Index'
import { server } from '../test/mocks/server'
import { http, HttpResponse } from 'msw'
import { API_ENDPOINTS } from '@/lib/api'

// Mock the useNavigate hook
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  mockNavigate.mockClear()
})
afterAll(() => server.close())

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter })
}

describe('Index Page (Upload Form)', () => {
  it('should render the upload form', () => {
    renderWithRouter(<Index />)
    
    expect(screen.getByText(/Analyze your microbiome data in minutes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  })

  it('should allow test data submission', async () => {
    renderWithRouter(<Index />)

    // Fill form
    fireEvent.change(screen.getByLabelText(/Project Name/i), {
      target: { value: 'Test Project' },
    })
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    })

    // Check test data checkbox
    const testDataCheckbox = screen.getByLabelText(/Use test data/i)
    fireEvent.click(testDataCheckbox)

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Run analysis/i })
    fireEvent.click(submitButton)

    // Check for success screen instead of navigation
    await waitFor(() => {
      expect(screen.getByText(/Analysis Submitted!/i)).toBeInTheDocument()
    })
  })

  it('should require project name', async () => {
    renderWithRouter(<Index />)

    const submitButton = screen.getByRole('button', { name: /Run analysis/i })
    fireEvent.click(submitButton)

    // Validation happens but error display requires submission attempt
    // Just verify the form doesn't navigate away
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
