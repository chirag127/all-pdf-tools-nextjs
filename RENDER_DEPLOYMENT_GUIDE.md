# Deploying All PDF Tools on Render.com

This guide provides step-by-step instructions for deploying the All PDF Tools application on Render.com.

## Prerequisites

- A GitHub account with the All PDF Tools repository forked or cloned
- A Render.com account (free tier is sufficient)

## Deploying the Backend (FastAPI)

1. Log in to your Render.com account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service with the following settings:
   - **Name**: `all-pdf-tools-api` (or your preferred name)
   - **Environment**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave blank (uses repository root)
   - **Branch**: `main` (or your preferred branch)
   - **Region**: Choose the region closest to your users
   - **Plan**: Free (or select a paid plan if needed)

5. Under "Advanced" settings, add the following environment variables:
   - `PYTHON_ENV`: `production`
   - `CORS_ORIGINS`: The URL of your frontend deployment (add this after deploying the frontend)

6. Click "Create Web Service"

## Deploying the Frontend (Next.js)

1. In your Render.com dashboard, click on "New" and select "Static Site"
2. Connect your GitHub repository
3. Configure the service with the following settings:
   - **Name**: `all-pdf-tools` (or your preferred name)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/out`
   - **Root Directory**: Leave blank (uses repository root)
   - **Branch**: `main` (or your preferred branch)
   - **Region**: Choose the region closest to your users

4. Under "Advanced" settings, add the following environment variables:
   - `NEXT_PUBLIC_BACKEND_API_URL`: The URL of your backend service + `/api/v1` (e.g., `https://all-pdf-tools-api.onrender.com/api/v1`)

5. Click "Create Static Site"

## Connecting Frontend and Backend

After both services are deployed:

1. Go to your backend service settings in Render.com
2. Add/update the `CORS_ORIGINS` environment variable with your frontend URL (e.g., `https://all-pdf-tools.onrender.com`)
3. Click "Save Changes" and wait for the service to redeploy

## Troubleshooting

### Build Failures

If you encounter build failures:

1. Check the build logs in Render.com for specific error messages
2. Common issues include:
   - ESLint errors: Fixed by using the `--no-lint` flag in the build command (already configured)
   - Missing dependencies: Ensure all dependencies are properly listed in `package.json` and `requirements.txt`
   - Environment variable issues: Verify all required environment variables are set correctly

### API Connection Issues

If the frontend cannot connect to the backend:

1. Verify the `NEXT_PUBLIC_BACKEND_API_URL` is set correctly in the frontend environment variables
2. Check that the `CORS_ORIGINS` in the backend includes your frontend URL
3. Ensure both services are running (check the Render.com dashboard)

## Maintenance

### Updating the Application

When you push changes to your GitHub repository, Render.com will automatically rebuild and deploy your services.

### Monitoring

Render.com provides logs for each service:

1. Go to your service in the Render.com dashboard
2. Click on "Logs" to view real-time logs
3. Use these logs to diagnose any issues that occur in production

## Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
