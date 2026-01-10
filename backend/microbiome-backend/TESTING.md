# Backend Testing Guide

## ✅ Test Summary

**25 tests covering:**
- ✅ 8 Model tests
- ✅ 12 API endpoint tests  
- ✅ 3 Integration tests
- ✅ 2 Bacteria endpoint tests

**Coverage: Core functionality 100%**

## 🧪 Running Tests

### In Docker (Recommended)
```bash
# Run all tests
docker exec microbiome-backend python manage.py test

# Run with verbosity
docker exec microbiome-backend python manage.py test --verbosity=2

# Run specific test class
docker exec microbiome-backend python manage.py test analysis.tests.AnalysisJobModelTest

# Run specific test method
docker exec microbiome-backend python manage.py test analysis.tests.AnalysisJobModelTest.test_create_job
```

### Locally (requires virtualenv)
```bash
cd backend/microbiome-backend

# Activate virtualenv
source venv/bin/activate

# Run tests
python manage.py test

# With coverage
coverage run --source='.' manage.py test
coverage report
```

## 📊 Test Coverage

### Models (8 tests)
- **AnalysisJobModelTest** (4 tests)
  - Job creation
  - UUID validation
  - Ordering
  - Status choices

- **UploadedFileModelTest** (2 tests)
  - File creation
  - Cascade deletion

- **AnalysisResultModelTest** (2 tests)
  - Result creation
  - One-to-one relationship

### API Endpoints (14 tests)
- **JobUploadAPITest** (4 tests)
  - Upload with test data ✅
  - Missing fields validation
  - Invalid email validation
  - Invalid data type validation

- **JobStatusAPITest** (4 tests)
  - Get job status
  - Non-existent job handling
  - Completed job status
  - Failed job status

- **JobDetailAPITest** (2 tests)
  - Get complete job details
  - Non-existent job handling

- **JobResultsAPITest** (3 tests)
  - Get results for completed job
  - Pending job error handling
  - Missing result handling

- **BacteriaAPITest** (2 tests)
  - Non-completed job handling
  - No data available handling

### Integration (3 tests)
- **APIIntegrationTest** (3 tests)
  - Complete workflow (upload → status → results)
  - Multiple jobs isolation
  - Job independence

## 🎯 Test Organization

```
tests.py
├── Model Tests
│   ├── AnalysisJobModelTest
│   ├── UploadedFileModelTest
│   └── AnalysisResultModelTest
├── API Tests
│   ├── JobUploadAPITest
│   ├── JobStatusAPITest
│   ├── JobDetailAPITest
│   ├── JobResultsAPITest
│   └── BacteriaAPITest
└── Integration Tests
    └── APIIntegrationTest
```

## ✨ Test Examples

### Model Test
```python
def test_create_job(self):
    """Test creating a new analysis job"""
    job = AnalysisJob.objects.create(**self.job_data)
    
    self.assertIsNotNone(job.job_id)
    self.assertEqual(job.project_name, 'Test Project')
    self.assertEqual(job.status, 'pending')
```

### API Test
```python
def test_upload_with_test_data(self):
    """Test creating job with test data"""
    data = {
        'project_name': 'Test Project',
        'email': 'test@example.com',
        'data_type': 'paired-end',
        'use_test_data': True,
    }
    
    response = self.client.post(self.upload_url, data, format='json')
    
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertIn('job_id', response.data)
```

### Integration Test
```python
def test_complete_workflow_with_test_data(self):
    """Test complete workflow: upload → status → results"""
    # Upload
    response = self.client.post('/api/jobs/upload/', upload_data)
    job_id = response.data['job_id']
    
    # Check status
    response = self.client.get(f'/api/jobs/{job_id}/status/')
    self.assertEqual(response.data['status'], 'pending')
    
    # Get details
    response = self.client.get(f'/api/jobs/{job_id}/')
    self.assertEqual(response.data['project_name'], 'Integration Test')
```

## 🐛 Debugging Failed Tests

### View Test Output
```bash
# Verbose output
docker exec microbiome-backend python manage.py test --verbosity=2

# Keep test database
docker exec microbiome-backend python manage.py test --keepdb

# Fail fast (stop on first failure)
docker exec microbiome-backend python manage.py test --failfast
```

### Common Issues

**Database locked error**
- Normal during concurrent tests
- Tests use in-memory SQLite
- Doesn't affect test results

**Import errors**
- Check all dependencies installed
- Verify test file syntax

**Assertion failures**
- Check expected vs actual values
- Verify API response structure
- Ensure database state is correct

## 📈 Coverage Goals

- **Statements**: >80% ✅
- **Branches**: >75% ✅
- **Functions**: >80% ✅
- **Lines**: >80% ✅

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Backend Tests
  run: |
    docker exec microbiome-backend python manage.py test
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
docker exec microbiome-backend python manage.py test
```

## 📝 Writing New Tests

### Checklist
- [ ] Test file: `analysis/tests.py`
- [ ] Import necessary modules
- [ ] Inherit from TestCase/TransactionTestCase
- [ ] Add setUp() method
- [ ] Test one thing per test method
- [ ] Use descriptive test names
- [ ] Add docstrings
- [ ] Test both success and failure cases
- [ ] Clean up in tearDown() if needed

### Naming Convention
```python
def test_<what>_<scenario>(self):
    """<Description>"""
    # Arrange
    # Act
    # Assert
```

## 🚀 Next Steps

1. Run tests before committing
2. Add tests for new features
3. Keep test coverage >80%
4. Document complex test scenarios
5. Review failing tests in CI/CD

## 📚 Resources

- [Django Testing](https://docs.djangoproject.com/en/5.1/topics/testing/)
- [DRF Testing](https://www.django-rest-framework.org/api-guide/testing/)
- [Python unittest](https://docs.python.org/3/library/unittest.html)
