# Hosting All PDF Tools on Vercel and Render

This guide provides detailed instructions for hosting the All PDF Tools application using Vercel for the frontend and Render for the backend. This combination offers a robust, scalable, and mostly free hosting solution.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)
- Git installed on your local machine
- Node.js (v18 or later) installed
- Python (v3.9 or later) installed
- Access to the All PDF Tools repository

## Part 1: Deploying the Frontend to Vercel

Vercel is the platform created by the team behind Next.js and offers the best integration for Next.js applications.

### Step 1: Prepare Your Repository

1. Fork the repository on GitHub or clone it to your local machine:
   ```bash
   git clone https://github.com/yourusername/all-pdf-tools-nextjs.git
   cd all-pdf-tools-nextjs
   ```

2. If you want to deploy from a local repository, push it to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/all-pdf-tools-nextjs.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

#### Option 1: Using the Vercel Dashboard

1. Sign up or log in to [Vercel](https://vercel.com/)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: The URL of your backend API (you'll set this after deploying the backend)
6. Click "Deploy"

#### Option 2: Using the Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy to Vercel:
   ```bash
   vercel
   ```

5. Follow the prompts to complete the deployment

6. For production deployment:
   ```bash
   vercel --prod
   ```

### Step 3: Configure Environment Variables

After deploying the backend (in Part 2), you'll need to set the API URL environment variable:

1. Go to your project on the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add a new variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: Your backend URL (e.g., `https://all-pdf-tools-api.onrender.com`)
4. Select "Production" environment
5. Click "Save"
6. Redeploy your project for the changes to take effect

## Part 2: Deploying the Backend to Render

Render is a unified cloud platform that offers free hosting for web services, making it ideal for FastAPI applications.

### Step 1: Prepare Your Backend

1. Make sure your backend code is in the `backend` directory of your repository
2. Ensure you have a `requirements.txt` file with all the necessary dependencies
3. Create a `runtime.txt` file in the backend directory with the Python version:
   ```
   python-3.9
   ```

### Step 2: Deploy to Render

1. Sign up or log in to [Render](https://render.com/)
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `all-pdf-tools-api`
   - Root Directory: `backend`
   - Runtime: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Select the plan (Free tier is sufficient for testing)
6. Add environment variables:
   - `CORS_ORIGINS`: Your frontend URL (e.g., `https://all-pdf-tools.vercel.app`)
   - `SECRET_KEY`: A secure random string for encryption
7. Click "Create Web Service"

Render will automatically build and deploy your backend. This process may take a few minutes.

### Step 3: Configure CORS

Ensure your backend allows requests from your frontend domain:

```python
# In the backend/main.py file
from fastapi.middleware.cors import CORSMiddleware
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGINS", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Part 3: Connecting Frontend and Backend

### Step 1: Update Frontend Configuration

After deploying the backend, update the frontend's environment variables:

1. Go to your project on the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Update the `NEXT_PUBLIC_API_URL` variable with your Render backend URL
4. Redeploy your project

### Step 2: Test the Connection

1. Visit your deployed frontend application
2. Test the PDF tools to ensure they can communicate with the backend
3. Check the browser console for any CORS or connection errors

## Part 4: Custom Domain Setup (Optional)

### Vercel Custom Domain

1. Go to your project on the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your domain and follow the instructions to configure DNS settings

### Render Custom Domain

1. Go to your web service on the Render dashboard
2. Navigate to "Settings" > "Custom Domains"
3. Add your domain and follow the instructions to configure DNS settings

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Check that the `CORS_ORIGINS` environment variable on Render is set correctly
2. Ensure the backend CORS middleware is configured properly
3. Verify that the frontend is making requests to the correct backend URL

### Deployment Failures

#### Vercel Deployment Issues

1. Check the build logs for errors
2. Ensure your Next.js application is in the correct directory
3. Verify that all dependencies are listed in `package.json`

#### Render Deployment Issues

1. Check the build logs for errors
2. Ensure your FastAPI application is in the correct directory
3. Verify that all dependencies are listed in `requirements.txt`
4. Check that the start command is correct

### Connection Issues

If the frontend cannot connect to the backend:

1. Verify that the `NEXT_PUBLIC_API_URL` environment variable is set correctly
2. Check that the backend is running and accessible
3. Test the backend API directly using a tool like Postman or curl

## Scaling Considerations

### Vercel Scaling

Vercel's free tier includes:
- 100 GB bandwidth per month
- Automatic scaling for serverless functions
- Up to 6,000 minutes of serverless function execution per month

For higher traffic, consider upgrading to a paid plan.

### Render Scaling

Render's free tier includes:
- 750 hours of runtime per month
- Automatic sleep after 15 minutes of inactivity
- 100 GB bandwidth per month

For production use, consider upgrading to a paid plan to avoid the automatic sleep feature and get more resources.

## Conclusion

You have now successfully deployed the All PDF Tools application using Vercel for the frontend and Render for the backend. This setup provides a robust, scalable, and mostly free hosting solution for your application.

For more information, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [FastAPI Deployment Documentation](https://fastapi.tiangolo.com/deployment/)
