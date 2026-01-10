# n8n Workflows for Microbiome Analysis

## Workflow 1: AWS Batch Job Completion Handler

**Trigger:** Webhook from AWS EventBridge
**Steps:**
1. Webhook receives Batch job completion event
2. Extract job_id and status from payload
3. Call Django API to update job status: `POST /api/jobs/{job_id}/complete/`
4. If successful:
   - Send email notification to user
   - Log to monitoring system
5. If failed:
   - Check retry count
   - Resubmit job if < 3 attempts
   - Send failure notification if max retries reached

**n8n Nodes:**
- Webhook
- HTTP Request (Django API)
- Switch (success/failure)
- Send Email (Gmail/SMTP)
- HTTP Request (Resubmit job)

---

## Workflow 2: Job Monitoring & Alerts

**Trigger:** Schedule (every 5 minutes)
**Steps:**
1. Query Django API for "running" jobs older than 30 minutes
2. For each stuck job:
   - Check AWS Batch status
   - If Batch says failed but DB says running:
     - Update DB status to failed
     - Send alert email
3. Query for jobs older than 2 hours
   - Send warning to admin

---

## Workflow 3: Welcome Email & Onboarding

**Trigger:** Webhook on new job creation
**Steps:**
1. Receive webhook from Django when user uploads first job
2. Send welcome email with:
   - Job tracking link
   - Expected completion time
   - Documentation links
3. Wait for job completion (sub-workflow)
4. Send results email with:
   - Download links
   - Visualization previews
   - Next steps

---

## Workflow 4: Weekly Usage Reports

**Trigger:** Schedule (weekly)
**Steps:**
1. Query Django API for jobs from last week
2. Aggregate statistics:
   - Total jobs run
   - Success/failure rate
   - Average processing time
   - Most active users
3. Generate report
4. Send to admin email

---

## Setup Instructions

### 1. Deploy n8n with Docker Compose

Add to your `docker-compose.yml`:
```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=n8n.yourdomain.com
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - app-network

volumes:
  n8n_data:
```

### 2. Configure AWS EventBridge to n8n

```bash
# Create EventBridge rule for Batch job state changes
aws events put-rule \
  --name batch-to-n8n \
  --event-pattern '{
    "source": ["aws.batch"],
    "detail-type": ["Batch Job State Change"],
    "detail": {
      "status": ["SUCCEEDED", "FAILED"]
    }
  }'

# Target n8n webhook
aws events put-targets \
  --rule batch-to-n8n \
  --targets "Id"="1","Arn"="arn:aws:events:us-east-1:xxx:api-destination/n8n-webhook","HttpParameters"={
    "HeaderParameters": {
      "Authorization": "Bearer YOUR_N8N_WEBHOOK_TOKEN"
    }
  }
```

### 3. Create Django Webhook Endpoint

Add to Django views:
```python
@api_view(['POST'])
@permission_classes([AllowAny])  # Secure with API key in production
def batch_completion_webhook(request):
    """Webhook for n8n to update job status"""
    job_id = request.data.get('job_id')
    status = request.data.get('status')
    
    job = AnalysisJob.objects.get(job_id=job_id)
    job.status = status
    job.save()
    
    # Trigger any additional processing
    if status == 'completed':
        process_results(job)
    
    return Response({'message': 'Job updated'})
```

### 4. n8n Credentials Setup

In n8n UI, add credentials for:
- **Django API**: HTTP Basic Auth or API Key
- **AWS SDK**: Access Key + Secret
- **SMTP**: Gmail/SendGrid for emails
- **Slack/Discord** (optional): For notifications

---

## Cost Estimate

**Self-hosted on EC2:**
- Runs alongside Django backend
- No additional cost (uses same t3.medium)

**n8n Cloud:**
- Starter: $20/month
- Pro: $50/month (team features)

---

## Benefits vs. Pure Django/Lambda

| Feature | Django Only | n8n Added |
|---------|-------------|-----------|
| Job monitoring | Manual polling | Event-driven |
| Email notifications | Celery/cron needed | Built-in |
| Retry logic | Custom code | Visual config |
| External integrations | Code for each | 400+ pre-built |
| Debugging workflows | Logs + code review | Visual execution |
| Non-tech admin | Can't modify | Can build workflows |

---

## When to Use n8n

✅ **Use n8n if:**
- You want email notifications without Celery
- Need retry logic and monitoring
- Want non-developers to modify workflows
- Planning external integrations (Slack, Discord, webhooks)
- Want visual workflow debugging

❌ **Skip n8n if:**
- Very simple app with no notifications
- You already have Celery/background task system
- Team is comfortable with pure Python
- Minimizing infrastructure is priority
