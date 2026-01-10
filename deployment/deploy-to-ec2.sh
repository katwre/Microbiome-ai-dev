#!/bin/bash
# Deploy application to EC2 instance
# Usage: ./deploy-to-ec2.sh <ec2-ip-or-hostname>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <ec2-ip-or-hostname>"
    exit 1
fi

EC2_HOST="ec2-user@$1"
DEPLOY_DIR="/opt/microbiome-ai"

echo "🚀 Deploying to EC2: $1"

# 1. Create deployment directory on EC2
echo "📁 Creating deployment directory..."
ssh $EC2_HOST "sudo mkdir -p $DEPLOY_DIR && sudo chown ec2-user:ec2-user $DEPLOY_DIR"

# 2. Copy files to EC2
echo "📤 Uploading files..."
rsync -avz --exclude 'node_modules' --exclude '*.pyc' --exclude '__pycache__' \
    --exclude '.git' --exclude 'venv' --exclude 'media' \
    ./ $EC2_HOST:$DEPLOY_DIR/

# 3. Copy environment file
echo "🔐 Copying environment configuration..."
scp docker/.env.aws.example $EC2_HOST:$DEPLOY_DIR/docker/.env
echo "⚠️  Remember to edit .env on EC2 with actual values!"

# 4. Build and start containers
echo "🐳 Building and starting Docker containers..."
ssh $EC2_HOST "cd $DEPLOY_DIR/docker && docker-compose build && docker-compose up -d"

# 5. Run migrations
echo "📊 Running database migrations..."
ssh $EC2_HOST "cd $DEPLOY_DIR/docker && docker-compose exec -T backend python manage.py migrate"

# 6. Collect static files
echo "📦 Collecting static files..."
ssh $EC2_HOST "cd $DEPLOY_DIR/docker && docker-compose exec -T backend python manage.py collectstatic --noinput"

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. SSH to EC2: ssh $EC2_HOST"
echo "2. Edit environment: vim $DEPLOY_DIR/docker/.env"
echo "3. Restart: cd $DEPLOY_DIR/docker && docker-compose restart"
echo "4. View logs: docker-compose logs -f"
