# Hosting Guide for All PDF Tools

This guide provides instructions on how to host the All PDF Tools application, which consists of a Next.js frontend and a FastAPI backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment Options](#frontend-deployment-options)
   - [Vercel (Recommended)](#vercel-recommended)
   - [Netlify](#netlify)
   - [GitHub Pages](#github-pages)
   - [Traditional Web Hosting](#traditional-web-hosting)
3. [Backend Deployment Options](#backend-deployment-options)
   - [Render](#render)
   - [Railway](#railway)
   - [Heroku](#heroku)
   - [AWS Lambda](#aws-lambda)
   - [Self-hosted Server](#self-hosted-server)
4. [Environment Configuration](#environment-configuration)
5. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have:

- Git installed
- Node.js (v18 or later) installed
- Python (v3.9 or later) installed
- Access to the All PDF Tools repository

## Frontend Deployment Options

The frontend is built with Next.js and can be deployed to various platforms.

### Vercel (Recommended)

Vercel is the platform created by the team behind Next.js and offers the best integration.

1. Sign up for a [Vercel account](https://vercel.com/signup)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
4. Deploy to Vercel:
   ```bash
   vercel
   ```
5. Follow the prompts to complete the deployment

For production deployment:
```bash
vercel --prod
```

### Netlify

1. Sign up for a [Netlify account](https://app.netlify.com/signup)
2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
3. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Deploy to Netlify:
   ```bash
   netlify deploy
   ```

For production deployment:
```bash
netlify deploy --prod
```

### GitHub Pages

1. In the frontend directory, modify the `next.config.ts` file:
   ```typescript
   const nextConfig: NextConfig = {
     output: "export",
     basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
     images: {
       unoptimized: true,
     },
     trailingSlash: true,
   };
   ```

2. Create a `.env.production` file with:
   ```
   NEXT_PUBLIC_BASE_PATH=/all-pdf-tools-nextjs
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to GitHub Pages using the GitHub Actions workflow in the repository or manually:
   ```bash
   npx gh-pages -d out
   ```

### Traditional Web Hosting

1. Build the project:
   ```bash
   cd frontend
   npm run build
   ```

2. Copy the contents of the `out` directory to your web server's public directory (e.g., `/var/www/html`)

## Backend Deployment Options

The backend is built with FastAPI and can be deployed to various platforms.

### Render

1. Sign up for a [Render account](https://render.com/signup)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables as needed
6. Deploy the service

### Railway

1. Sign up for a [Railway account](https://railway.app/)
2. Create a new project
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables as needed
6. Deploy the service

### Heroku

1. Sign up for a [Heroku account](https://signup.heroku.com/)
2. Install the Heroku CLI:
   ```bash
   npm install -g heroku
   ```
3. Login to Heroku:
   ```bash
   heroku login
   ```
4. Create a new Heroku app:
   ```bash
   heroku create all-pdf-tools-api
   ```
5. Add a `Procfile` in the backend directory:
   ```
   web: cd backend && uvicorn main:app --host=0.0.0.0 --port=$PORT
   ```
6. Deploy to Heroku:
   ```bash
   git subtree push --prefix backend heroku main
   ```

### AWS Lambda

1. Install the Serverless Framework:
   ```bash
   npm install -g serverless
   ```
2. Create a `serverless.yml` file in the backend directory
3. Configure the serverless.yml for FastAPI deployment
4. Deploy to AWS Lambda:
   ```bash
   serverless deploy
   ```

### Self-hosted Server

1. Set up a server with Python installed
2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/all-pdf-tools-nextjs.git
   ```
3. Install dependencies:
   ```bash
   cd all-pdf-tools-nextjs/backend
   pip install -r requirements.txt
   ```
4. Set up a production ASGI server (e.g., Gunicorn with Uvicorn workers):
   ```bash
   pip install gunicorn uvicorn
   ```
5. Create a systemd service or use a process manager like PM2 to run:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

## Environment Configuration

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

For production, create a `.env.production` file with the same variables.

### Backend Environment Variables

Set the following environment variables on your backend hosting platform:

```
CORS_ORIGINS=https://your-frontend-url.com
SECRET_KEY=your-secret-key
```

## Connecting Frontend to Backend

After deploying both the frontend and backend, update the frontend's environment variables to point to the backend URL:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Troubleshooting

### CORS Issues

If you encounter CORS issues, ensure the backend's CORS settings include your frontend domain:

```python
# In the backend/main.py file
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGINS", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Issues

If the frontend cannot connect to the backend:

1. Check that the `NEXT_PUBLIC_API_URL` is correctly set
2. Verify that the backend is running and accessible
3. Check for any network restrictions or firewall issues

### Build Errors

If you encounter build errors:

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```
2. Clear the Next.js cache:
   ```bash
   rm -rf .next
   ```
3. Rebuild the project:
   ```bash
   npm run build
   ```

---

For additional help, please refer to the [Next.js deployment documentation](https://nextjs.org/docs/deployment) and [FastAPI deployment documentation](https://fastapi.tiangolo.com/deployment/).
