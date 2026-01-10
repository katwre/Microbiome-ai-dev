# Deployment Guide

## Architecture

- **Backend**: Django + Nextflow with Conda/Mamba
- **Frontend**: Vite React application  
- **Pipeline**: nf-core/ampliseq running via Conda profile
- **Storage**: Docker volumes (local) or EFS (AWS)

## Local Development

### Setup
```bash
cd docker
cp .env.example .env
docker-compose up --build
```

### Configuration (.env)
```bash
MEDIA_HOST_PATH=./media  # Or absolute path
SECRET_KEY=your-secret-key
DEBUG=True
```

Optional volume customization:
```bash
NEXTFLOW_CACHE_PATH=/path/to/nextflow-assets
CONDA_ENVS_PATH=/path/to/conda-envs
```

### First Run
First pipeline execution takes 10-15 minutes as Conda creates tool environments. Subsequent runs are fast (environments are cached).

### Data Locations
- **Uploaded files**: `./media/uploads/`
- **Pipeline results**: `./media/analysis/{job_id}/`
- **Nextflow cache**: Docker volume `nextflow-assets`
- **Conda environments**: Docker volume `conda-envs`

## AWS Deployment

### Prerequisites
1. EC2 instance (t3.large or larger recommended)
2. EFS filesystem for persistent storage
3. Security groups allowing ports 80, 443, 8000

### Mount EFS
```bash
sudo mkdir -p /mnt/efs
sudo mount -t nfs4 fs-xxxxxxxx.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

Add to `/etc/fstab`:
```
fs-xxxxxxxx.efs.us-east-1.amazonaws.com:/ /mnt/efs nfs4 defaults,_netdev 0 0
```

### Configure Environment
```bash
cd docker
cp .env.aws.example .env
```

Edit `.env`:
```bash
MEDIA_HOST_PATH=/mnt/efs/media
NEXTFLOW_CACHE_PATH=/mnt/efs/nextflow-assets
CONDA_ENVS_PATH=/mnt/efs/conda-envs
SECRET_KEY=your-production-secret-key
DEBUG=False
NXF_OPTS=-Xms1G -Xmx8G  # Adjust based on instance size
```

### Deploy
```bash
# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy
cd /home/ec2-user/Microbiome-ai-dev/docker
docker-compose up --build -d
```

### Monitoring
```bash
# Check logs
docker-compose logs -f

# Check resource usage
docker stats

# Check EFS usage
df -h /mnt/efs
```

## Scaling Considerations

### Storage
- **First pipeline run**: ~2-3 GB for conda environments
- **Per analysis**: 100-500 MB depending on input size
- **EFS**: Provision minimum 5 GB, autoscales as needed

### Compute
- **t3.medium**: Suitable for testing (2 vCPU, 4 GB RAM)
- **t3.large**: Good for light production (2 vCPU, 8 GB RAM)
- **t3.xlarge**: Recommended for production (4 vCPU, 16 GB RAM)
- **c5.2xlarge**: High-performance option (8 vCPU, 16 GB RAM)

### Memory Configuration
Set `NXF_OPTS` based on instance:
- t3.medium: `-Xms512M -Xmx3G`
- t3.large: `-Xms1G -Xmx6G`
- t3.xlarge: `-Xms2G -Xmx12G`
- c5.2xlarge: `-Xms2G -Xmx14G`

## Conda vs Docker-in-Docker

**Why Conda?**
- ✅ Simpler configuration (no socket mounting)
- ✅ Identical behavior on local and AWS
- ✅ No permission issues
- ✅ Standard bioinformatics approach

**Trade-offs:**
- First run slower (~10-15 min for env creation)
- More disk space (~2-3 GB for tools)
- Subsequent runs use cached environments

## Troubleshooting

### Pipeline Fails
```bash
# Check Nextflow version
docker-compose exec backend nextflow -version

# Check conda
docker-compose exec backend conda --version
docker-compose exec backend mamba --version

# View full pipeline logs
docker-compose exec backend bash
cd /app/media/analysis/{job_id}
cat .nextflow.log
```

### Out of Memory
Increase `NXF_OPTS` memory limits in `.env` or use larger instance.

### EFS Not Mounted
```bash
# Check mount
df -h | grep efs

# Remount
sudo mount -a
```

### Slow Performance
First run creates conda environments. Check:
```bash
ls -lh /mnt/efs/conda-envs  # AWS
docker volume inspect conda-envs  # Local
```

## Security

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Change `SECRET_KEY` to random value
- [ ] Configure firewall/security groups
- [ ] Enable HTTPS (add nginx/Let's Encrypt)
- [ ] Restrict EFS security group to instance
- [ ] Regular backups of EFS
- [ ] Monitor logs for errors

### Generate Secret Key
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```
