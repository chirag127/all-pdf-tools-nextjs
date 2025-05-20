# Hosting All PDF Tools with Docker

This guide provides detailed instructions for deploying the All PDF Tools application using Docker and Docker Compose. Docker containerization offers consistency across environments, simplified deployment, and easier scaling.

## Prerequisites

- Docker and Docker Compose installed on your host machine
- Git installed
- A server or VPS with at least 2GB RAM (e.g., DigitalOcean, Linode, AWS EC2)
- Basic knowledge of Docker and command line
- A domain name (optional but recommended)

## Step 1: Prepare Your Server

### Connect to Your Server

```bash
ssh root@your_server_ip
```

### Install Docker and Docker Compose

```bash
# Update package index
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Update package index again
sudo apt update

# Install Docker
sudo apt install -y docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group (optional, for non-root usage)
sudo usermod -aG docker $USER
```

Log out and log back in for the group changes to take effect.

## Step 2: Clone the Repository

```bash
git clone https://github.com/yourusername/all-pdf-tools-nextjs.git
cd all-pdf-tools-nextjs
```

## Step 3: Create Docker Configuration Files

### Create a Dockerfile for the Frontend

Create a file named `Dockerfile.frontend` in the project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Create a Dockerfile for the Backend

Create a file named `Dockerfile.backend` in the project root:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn uvicorn

# Copy application code
COPY backend .

# Expose port
EXPOSE 8000

# Run the application
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "main:app"]
```

### Create a Docker Compose File

Create a file named `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://your_domain_or_ip/api
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      - CORS_ORIGINS=http://your_domain_or_ip
      - SECRET_KEY=your_secure_random_string
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/data/certbot/conf:/etc/letsencrypt
      - ./nginx/data/certbot/www:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - app-network

  certbot:
    image: certbot/certbot
    restart: unless-stopped
    volumes:
      - ./nginx/data/certbot/conf:/etc/letsencrypt
      - ./nginx/data/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  app-network:
    driver: bridge
```

### Create Nginx Configuration

Create the Nginx configuration directory and file:

```bash
mkdir -p nginx/conf.d
```

Create a file named `nginx/conf.d/app.conf`:

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your_domain_or_ip;
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/your_domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `your_domain_or_ip` with your actual domain name or server IP.

## Step 4: Configure Next.js for Docker

Update the `next.config.ts` file in the frontend directory:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

## Step 5: Set Up SSL with Let's Encrypt

Create the required directories:

```bash
mkdir -p nginx/data/certbot/conf
mkdir -p nginx/data/certbot/www
```

Create a script to obtain SSL certificates:

```bash
nano init-letsencrypt.sh
```

Add the following content:

```bash
#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

domains=(your_domain)
rsa_key_size=4096
data_path="./nginx/data/certbot"
email="your_email@example.com" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
  read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### Creating dummy certificate for $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
docker-compose up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $domains ..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for $domains ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker-compose exec nginx nginx -s reload
```

Replace `your_domain` with your actual domain name and `your_email@example.com` with your email address.

Make the script executable:

```bash
chmod +x init-letsencrypt.sh
```

## Step 6: Deploy the Application

### Build and Start the Containers

```bash
# Start the application
docker-compose up -d

# Initialize SSL certificates
./init-letsencrypt.sh
```

### Check the Status

```bash
docker-compose ps
```

## Step 7: Updating the Application

To update the application when changes are made:

```bash
# Pull the latest changes
git pull

# Rebuild and restart the containers
docker-compose up -d --build
```

## Troubleshooting

### Container Logs

To view logs for a specific container:

```bash
# Frontend logs
docker-compose logs frontend

# Backend logs
docker-compose logs backend

# Nginx logs
docker-compose logs nginx
```

### Common Issues

#### Frontend Container Fails to Start

Check the logs:

```bash
docker-compose logs frontend
```

Common issues include:
- Missing environment variables
- Build errors in the Next.js application
- Port conflicts

#### Backend Container Fails to Start

Check the logs:

```bash
docker-compose logs backend
```

Common issues include:
- Missing dependencies
- Configuration errors
- Port conflicts

#### Nginx SSL Configuration Issues

If you encounter SSL certificate issues:

1. Check that your domain is correctly configured to point to your server
2. Ensure the `init-letsencrypt.sh` script has been run successfully
3. Verify the Nginx configuration

## Scaling and Production Considerations

### Docker Swarm or Kubernetes

For production environments with high traffic, consider using Docker Swarm or Kubernetes for orchestration:

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy as a stack
docker stack deploy -c docker-compose.yml pdftools
```

### Database Integration

If your application requires a database, add it to the `docker-compose.yml` file:

```yaml
services:
  # ... existing services ...
  
  postgres:
    image: postgres:14
    restart: always
    environment:
      - POSTGRES_USER=pdftools
      - POSTGRES_PASSWORD=your_secure_password
      - POSTGRES_DB=pdftools
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres-data:
```

### Backup Strategy

Set up regular backups for your application data:

```bash
# Create a backup script
nano backup.sh
```

Add the following content:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm -v pdftools_postgres-data:/source -v $BACKUP_DIR:/backup alpine tar -czf /backup/postgres_$TIMESTAMP.tar.gz -C /source .

# Backup configuration files
tar -czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz docker-compose.yml Dockerfile.frontend Dockerfile.backend nginx/

# Keep only the last 7 backups
find $BACKUP_DIR -name "postgres_*.tar.gz" -type f -mtime +7 -delete
find $BACKUP_DIR -name "config_*.tar.gz" -type f -mtime +7 -delete
```

Make the script executable and set up a cron job:

```bash
chmod +x backup.sh
crontab -e
```

Add the following line to run the backup daily at 2 AM:

```
0 2 * * * /path/to/backup.sh
```

## Conclusion

You have now successfully deployed the All PDF Tools application using Docker and Docker Compose. This setup provides a consistent, scalable, and maintainable environment for your application.

For more information, refer to:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
