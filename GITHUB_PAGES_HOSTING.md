# Hosting All PDF Tools on GitHub Pages

This guide provides detailed instructions for hosting the All PDF Tools application on GitHub Pages. GitHub Pages is a free hosting service that allows you to publish your website directly from your GitHub repository.

## Prerequisites

- GitHub account
- Git installed on your local machine
- Node.js (v18 or later) installed
- Access to the All PDF Tools repository

## Step 1: Fork or Clone the Repository

1. Fork the repository on GitHub or clone it to your local machine:
   ```bash
   git clone https://github.com/yourusername/all-pdf-tools-nextjs.git
   cd all-pdf-tools-nextjs
   ```

## Step 2: Configure the Frontend for GitHub Pages

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Modify the `next.config.ts` file to enable static exports:
   ```typescript
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     output: "export",
     basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
     images: {
       unoptimized: true,
     },
     trailingSlash: true,
   };

   export default nextConfig;
   ```

4. Create a `.env.production` file with the base path matching your repository name:
   ```
   NEXT_PUBLIC_BASE_PATH=/all-pdf-tools-nextjs
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

   Note: Replace `/all-pdf-tools-nextjs` with the name of your repository and set the backend URL to your deployed backend service.

5. Create a `.nojekyll` file in the `public` directory to prevent GitHub Pages from processing the files with Jekyll:
   ```bash
   touch public/.nojekyll
   ```

## Step 3: Build the Frontend

1. Build the Next.js application:
   ```bash
   npm run build
   ```

   This will generate a static export in the `out` directory.

## Step 4: Deploy to GitHub Pages

### Option 1: Manual Deployment

1. Install the `gh-pages` package:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add a deploy script to your `package.json`:
   ```json
   "scripts": {
     "deploy": "gh-pages -d out"
   }
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

### Option 2: GitHub Actions Workflow

1. Create a `.github/workflows` directory in the root of your repository:
   ```bash
   mkdir -p .github/workflows
   ```

2. Create a workflow file named `deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches:
         - main

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'

         - name: Install dependencies
           run: |
             cd frontend
             npm ci

         - name: Create .nojekyll file
           run: touch frontend/public/.nojekyll

         - name: Build
           run: |
             cd frontend
             npm run build
           env:
             NEXT_PUBLIC_BASE_PATH: /all-pdf-tools-nextjs
             NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}

         - name: Deploy
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: frontend/out
             branch: gh-pages
   ```

3. Commit and push the workflow file:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment workflow"
   git push
   ```

4. In your GitHub repository settings, go to "Secrets and variables" > "Actions" and add a secret named `API_URL` with the value of your backend URL.

## Step 5: Configure GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to "Pages" in the sidebar
3. Under "Source", select "Deploy from a branch"
4. Select the `gh-pages` branch and the `/ (root)` folder
5. Click "Save"

GitHub will now build and deploy your site. After a few minutes, your site will be available at `https://yourusername.github.io/all-pdf-tools-nextjs/`.

## Step 6: Deploy the Backend

Since GitHub Pages only hosts static files, you'll need to deploy the backend separately. Here are some options:

### Option 1: Render

1. Sign up for a [Render account](https://render.com/signup)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `CORS_ORIGINS=https://yourusername.github.io`
   - `SECRET_KEY=your-secret-key`
6. Deploy the service

### Option 2: Railway

1. Sign up for a [Railway account](https://railway.app/)
2. Create a new project
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `CORS_ORIGINS=https://yourusername.github.io`
   - `SECRET_KEY=your-secret-key`
6. Deploy the service

## Step 7: Update Frontend Configuration

After deploying the backend, update the `.env.production` file with the correct backend URL:

```
NEXT_PUBLIC_BASE_PATH=/all-pdf-tools-nextjs
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then rebuild and redeploy the frontend.

## Troubleshooting

### 404 Errors on Page Refresh

If you encounter 404 errors when refreshing pages, create a `404.html` file in the `public` directory with a script to redirect to the correct page:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Single Page Apps for GitHub Pages
    // https://github.com/rafgraph/spa-github-pages
    (function(l) {
      if (l.search[1] === '/' ) {
        var decoded = l.search.slice(1).split('&').map(function(s) { 
          return s.replace(/~and~/g, '&')
        }).join('?');
        window.history.replaceState(null, null,
            l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location))
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
```

### CORS Issues

If you encounter CORS issues, ensure the backend's CORS settings include your GitHub Pages domain:

```python
# In the backend/main.py file
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGINS", "https://yourusername.github.io")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Asset Loading Issues

If assets like CSS or JavaScript files fail to load, check that the `basePath` in `next.config.ts` matches your repository name.

## Conclusion

You have now successfully deployed the All PDF Tools application to GitHub Pages. The frontend is hosted on GitHub Pages, and the backend is hosted on a separate service like Render or Railway.

For more information, refer to:
- [Next.js Static Exports](https://nextjs.org/docs/advanced-features/static-html-export)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
