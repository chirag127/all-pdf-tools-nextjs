# Hosting All PDF Tools on GitHub Pages

This guide explains how to host the All PDF Tools frontend on GitHub Pages.

## Overview

GitHub Pages is a free hosting service provided by GitHub that allows you to host static websites directly from your GitHub repository. Since our Next.js frontend can be exported as static HTML/CSS/JS files, it's a perfect candidate for GitHub Pages hosting.

## Prerequisites

1. A GitHub account
2. Your All PDF Tools repository pushed to GitHub
3. Backend API deployed on Render.com or another hosting service

## Configuration Steps

### 1. Configure Next.js for Static Export

We've already configured Next.js for static export in `frontend/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  // Disable server-side features since we're exporting to static HTML
  trailingSlash: true,
};

export default nextConfig;
```

This configuration:
- Sets `output: 'export'` to generate static HTML files
- Uses `basePath` to handle GitHub Pages subdirectory paths
- Disables image optimization (not available in static exports)
- Adds trailing slashes for better compatibility

### 2. Environment Variables

Create a `.env.production` file in the `frontend` directory with:

```
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-url.onrender.com/api/v1
NEXT_PUBLIC_BASE_PATH=/your-repo-name
```

Replace:
- `your-backend-url.onrender.com` with your actual backend URL
- `your-repo-name` with your GitHub repository name

### 3. GitHub Actions Workflow

We've set up a GitHub Actions workflow in `.github/workflows/deploy-gh-pages.yml` that:

1. Triggers on pushes to the main branch
2. Sets up Node.js
3. Installs dependencies
4. Builds the Next.js app with the correct environment variables
5. Adds a `.nojekyll` file (required for Next.js on GitHub Pages)
6. Deploys to the `gh-pages` branch

### 4. GitHub Repository Settings

After pushing your code with the workflow file:

1. Go to your GitHub repository
2. Navigate to Settings > Pages
3. Under "Source", select "Deploy from a branch"
4. Select the `gh-pages` branch and the `/ (root)` folder
5. Click "Save"

GitHub will provide you with a URL where your site is published (typically `https://username.github.io/repo-name/`).

### 5. GitHub Secrets

For the workflow to access your backend URL, add it as a secret:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `NEXT_PUBLIC_BACKEND_API_URL`
5. Value: `https://your-backend-url.onrender.com/api/v1`
6. Click "Add secret"

## Manual Deployment

If you prefer to deploy manually:

1. Install the `gh-pages` package:
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

2. Add deployment scripts to `package.json`:
   ```json
   "scripts": {
     "export": "next build",
     "deploy": "npm run export && touch out/.nojekyll && gh-pages -d out -t true"
   }
   ```

3. Run the deploy script:
   ```bash
   npm run deploy
   ```

## Troubleshooting

### 404 Errors on Page Refresh

If you encounter 404 errors when refreshing pages, make sure:
- `trailingSlash: true` is set in `next.config.ts`
- You're using `Link` components from Next.js for internal navigation

### Assets Not Loading

If assets (CSS, JS, images) aren't loading:
- Check that `basePath` is correctly set in `next.config.ts`
- Verify that all asset URLs in your code use relative paths

### API Connection Issues

If the frontend can't connect to the backend:
- Ensure CORS is properly configured on your backend
- Verify the `NEXT_PUBLIC_BACKEND_API_URL` is correct
- Check browser console for any network errors

## Limitations

When hosting on GitHub Pages:
- No server-side rendering (SSR) or API routes
- All pages must be statically generated at build time
- Backend must be hosted separately

## Conclusion

GitHub Pages provides a free and easy way to host the frontend of All PDF Tools. By following this guide, you can have your application up and running with automated deployments whenever you push changes to your repository.
