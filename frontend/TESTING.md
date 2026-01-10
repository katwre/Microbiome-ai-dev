# Frontend Testing Guide

## Overview

The frontend includes comprehensive tests using **Vitest**, **React Testing Library**, and **MSW** (Mock Service Worker) for API mocking.

## Test Stack

- **Vitest** - Fast unit test runner (Vite-native)
- **React Testing Library** - Component testing
- **MSW** - API mocking for integration tests
- **jsdom** - DOM simulation for tests

## Running Tests

### All Tests
```bash
npm test
# or
npm run test
```

### Watch Mode (recommended during development)
```bash
npm test -- --watch
```

### UI Mode (interactive)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

View coverage: Open `coverage/index.html` in browser

### Single Test File
```bash
npm test -- src/lib/api.test.ts
```

## Test Organization

```
frontend/src/
├── lib/
│   ├── api.ts              # API configuration
│   ├── api.test.ts         # API tests
│   ├── validation.ts       # Validation utilities
│   └── validation.test.ts  # Validation tests
├── pages/
│   ├── Index.tsx           # Upload form
│   ├── Index.test.tsx      # Upload form tests
│   ├── JobStatus.tsx       # Job status page
│   └── JobStatus.test.tsx  # Job status tests
└── test/
    ├── setup.ts            # Test setup/config
    └── mocks/
        └── server.ts       # MSW server setup
```

## Test Coverage

### Core Functionality Tested

✅ **API Layer** (`lib/api.test.ts`)
- Endpoint URL construction
- Base URL configuration
- API endpoint validation

✅ **Validation** (`lib/validation.test.ts`)
- Email validation
- Project name validation
- File size formatting
- Status color/label mapping

✅ **Upload Form** (`pages/Index.test.tsx`)
- Form rendering
- Test data submission
- Email validation
- Required field validation
- Error handling
- API integration

✅ **Job Status Page** (`pages/JobStatus.test.tsx`)
- Loading states
- Job details display
- Download buttons
- File listing
- Error handling (404, etc.)
- Real-time status updates

## Writing New Tests

### Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import MyComponent from './MyComponent'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter })
}

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithRouter(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    renderWithRouter(<MyComponent />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Result')).toBeInTheDocument()
  })
})
```

### API Test with MSW
```typescript
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'

it('should handle API error', async () => {
  server.use(
    http.get('/api/endpoint', () => {
      return new HttpResponse(null, { status: 500 })
    })
  )

  // Your test code
})
```

## Best Practices

### 1. Test User Behavior, Not Implementation
```typescript
// ✅ Good - tests what user sees
expect(screen.getByText('Submit')).toBeInTheDocument()

// ❌ Avoid - tests implementation details
expect(component.state.isSubmitting).toBe(false)
```

### 2. Use Semantic Queries
```typescript
// ✅ Preferred order
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Welcome')

// ❌ Avoid
screen.getByTestId('submit-button')
screen.getByClassName('btn-primary')
```

### 3. Wait for Async Updates
```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### 4. Clean Up Between Tests
```typescript
afterEach(() => {
  cleanup() // Automatically done in setup.ts
  server.resetHandlers() // Reset MSW handlers
})
```

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook - optional)
- Pull requests (GitHub Actions)
- Before deployment

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### 1. Debug Output
```typescript
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### 2. Query Playground
```typescript
import { logRoles } from '@testing-library/react'

const { container } = render(<Component />)
logRoles(container) // Shows all available roles
```

### 3. VS Code Debugging
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

## Performance

### Fast Tests
- Average: <100ms per test
- Full suite: <5 seconds
- Watch mode: Instant feedback

### Parallel Execution
Vitest runs tests in parallel by default. Disable for debugging:
```bash
npm test -- --no-threads
```

## Coverage Goals

Current coverage targets:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

View detailed coverage:
```bash
npm run test:coverage
open coverage/index.html
```

## Common Issues

### 1. "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Tests timeout
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000) // 10 second timeout
```

### 3. MSW not intercepting requests
```typescript
// Ensure server is started in beforeAll
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
```

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Commands Reference

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# UI mode
npm run test:ui

# Coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint

# Run specific test file
npm test -- path/to/test.ts

# Run tests matching pattern
npm test -- --grep "upload"

# Update snapshots (if using)
npm test -- -u
```

## Getting Help

If tests fail:
1. Read the error message carefully
2. Check test output with `screen.debug()`
3. Verify MSW handlers in `src/test/mocks/server.ts`
4. Check test setup in `src/test/setup.ts`
5. Run with `--reporter=verbose` for more details

For questions or issues, check:
- Project README
- Test file comments
- React Testing Library docs
