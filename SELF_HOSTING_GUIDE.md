# Self-Hosting All PDF Tools on a VPS

This guide provides detailed instructions for self-hosting the All PDF Tools application on a Virtual Private Server (VPS). Self-hosting gives you complete control over your application and data.

## Prerequisites

- A VPS with at least 1 GB RAM and 25 GB storage (e.g., DigitalOcean Droplet, Linode, AWS EC2, etc.)
- Ubuntu 20.04 or later installed on the VPS
- A domain name (optional but recommended)
- Basic knowledge of Linux command line
- SSH access to your VPS

## Step 1: Initial Server Setup

### Connect to Your Server

```bash
ssh root@your_server_ip
```

### Create a Non-Root User

```bash
adduser pdftools
usermod -aG sudo pdftools
```

### Switch to the New User

```bash
su - pdftools
```

### Update the System

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install Required Software

### Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install Python and Dependencies

```bash
sudo apt install -y python3 python3-pip python3-venv
```

### Install Nginx

```bash
sudo apt install -y nginx
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 3: Clone the Repository

```bash
cd ~
git clone https://github.com/yourusername/all-pdf-tools-nextjs.git
cd all-pdf-tools-nextjs
```

## Step 4: Set Up the Backend

### Create a Python Virtual Environment

```bash
cd ~/all-pdf-tools-nextjs/backend
python3 -m venv venv
source venv/bin/activate
```

### Install Backend Dependencies

```bash
pip install -r requirements.txt
pip install gunicorn
```

### Create Environment Variables

Create a `.env` file in the backend directory:

```bash
nano .env
```

Add the following content:

```
CORS_ORIGINS=http://your_domain_or_ip
SECRET_KEY=your_secure_random_string
```

Save and exit (Ctrl+X, then Y, then Enter).

### Set Up a Systemd Service for the Backend

```bash
sudo nano /etc/systemd/system/pdftools-api.service
```

Add the following content:

```
[Unit]
Description=PDF Tools API
After=network.target

[Service]
User=pdftools
Group=pdftools
WorkingDirectory=/home/pdftools/all-pdf-tools-nextjs/backend
Environment="PATH=/home/pdftools/all-pdf-tools-nextjs/backend/venv/bin"
EnvironmentFile=/home/pdftools/all-pdf-tools-nextjs/backend/.env
ExecStart=/home/pdftools/all-pdf-tools-nextjs/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000 main:app

[Install]
WantedBy=multi-user.target
```

Save and exit.

### Start and Enable the Backend Service

```bash
sudo systemctl start pdftools-api
sudo systemctl enable pdftools-api
sudo systemctl status pdftools-api
```

## Step 5: Set Up the Frontend

### Install Frontend Dependencies

```bash
cd ~/all-pdf-tools-nextjs/frontend
npm install
```

### Create Environment Variables

Create a `.env.production` file:

```bash
nano .env.production
```

Add the following content:

```
NEXT_PUBLIC_API_URL=http://your_domain_or_ip/api
```

Save and exit.

### Build the Frontend

```bash
npm run build
```

### Set Up PM2 to Manage the Frontend

```bash
pm2 start npm --name "pdftools-frontend" -- start
pm2 save
pm2 startup
```

Run the command that PM2 outputs to set up the startup script.

## Step 6: Configure Nginx

### Create an Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/pdftools
```

Add the following content:

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit.

### Enable the Nginx Configuration

```bash
sudo ln -s /etc/nginx/sites-available/pdftools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Set Up SSL with Let's Encrypt (Optional but Recommended)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain an SSL Certificate

```bash
sudo certbot --nginx -d your_domain
```

Follow the prompts to complete the process.

## Step 8: Firewall Configuration

### Configure UFW (Uncomplicated Firewall)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Step 9: Test Your Deployment

Visit your domain or server IP in a web browser to ensure everything is working correctly.

## Maintenance and Updates

### Update the Application

```bash
cd ~/all-pdf-tools-nextjs
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart pdftools-api

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart pdftools-frontend
```

### Monitor Logs

#### Backend Logs

```bash
sudo journalctl -u pdftools-api
```

#### Frontend Logs

```bash
pm2 logs pdftools-frontend
```

#### Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Backend Issues

If the backend service fails to start:

1. Check the logs:
   ```bash
   sudo journalctl -u pdftools-api
   ```

2. Verify the `.env` file:
   ```bash
   cat ~/all-pdf-tools-nextjs/backend/.env
   ```

3. Check if the port is in use:
   ```bash
   sudo lsof -i :8000
   ```

### Frontend Issues

If the frontend doesn't work:

1. Check PM2 status:
   ```bash
   pm2 status
   pm2 logs pdftools-frontend
   ```

2. Verify the build:
   ```bash
   cd ~/all-pdf-tools-nextjs/frontend
   ls -la .next
   ```

### Nginx Issues

If Nginx configuration fails:

1. Check the syntax:
   ```bash
   sudo nginx -t
   ```

2. Check the logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

## Backup Strategy

### Database Backup (if applicable)

If you've added a database to your application:

```bash
# For PostgreSQL
pg_dump -U username database_name > backup.sql

# For MySQL
mysqldump -u username -p database_name > backup.sql
```

### Application Backup

```bash
# Create a backup directory
mkdir -p ~/backups

# Backup the entire application
tar -czf ~/backups/pdftools-backup-$(date +%Y%m%d).tar.gz ~/all-pdf-tools-nextjs
```

## Security Considerations

1. Keep your system updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install and configure fail2ban:
   ```bash
   sudo apt install -y fail2ban
   ```

3. Regularly check for suspicious activities:
   ```bash
   sudo lastb
   sudo last
   ```

4. Consider setting up automatic security updates:
   ```bash
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

## Conclusion

You have now successfully self-hosted the All PDF Tools application on your VPS. This setup gives you complete control over your application and data.

For more information, refer to:
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
