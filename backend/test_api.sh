#!/bin/bash
# Test script for the Microbiome Analysis API

echo "=== Testing API Endpoints ==="
echo ""

# Test 1: List all jobs
echo "1. GET /api/jobs/ - List all jobs"
curl -s http://localhost:8000/api/jobs/ | python -m json.tool | head -20
echo ""
echo ""

# Test 2: Create a test file for upload
echo "2. Creating test file..."
echo -e "SampleID\tFeature1\tFeature2\n001\t100\t200" > /tmp/test_data.tsv
echo "Test file created: /tmp/test_data.tsv"
echo ""

# Test 3: Upload file and create job
echo "3. POST /api/jobs/upload/ - Upload file"
RESPONSE=$(curl -s -X POST http://localhost:8000/api/jobs/upload/ \
  -F "project_name=Test Project" \
  -F "email=test@example.com" \
  -F "data_type=tsv" \
  -F "send_email=true" \
  -F "files=@/tmp/test_data.tsv")

echo "$RESPONSE" | python -m json.tool
JOB_ID=$(echo "$RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['job_id'])" 2>/dev/null)
echo ""
echo ""

if [ ! -z "$JOB_ID" ]; then
  # Test 4: Check job status
  echo "4. GET /api/jobs/${JOB_ID}/status/ - Check status"
  curl -s http://localhost:8000/api/jobs/${JOB_ID}/status/ | python -m json.tool
  echo ""
  echo ""
  
  # Test 5: Get job details
  echo "5. GET /api/jobs/${JOB_ID}/ - Get job details"
  curl -s http://localhost:8000/api/jobs/${JOB_ID}/ | python -m json.tool
  echo ""
fi

echo ""
echo "=== API Tests Complete ==="
