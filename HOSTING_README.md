# All PDF Tools: Hosting Documentation

This repository contains comprehensive guides for hosting the All PDF Tools application using various deployment options. These guides will help you deploy both the Next.js frontend and FastAPI backend components of the application.

## Table of Contents

1. [Overview](#overview)
2. [Hosting Options](#hosting-options)
3. [Choosing the Right Option](#choosing-the-right-option)
4. [Getting Started](#getting-started)
5. [Troubleshooting](#troubleshooting)
6. [Contributing](#contributing)

## Overview

All PDF Tools is a web application that provides various PDF manipulation tools. It consists of:

-   **Frontend**: A Next.js application that provides the user interface
-   **Backend**: A FastAPI application that handles PDF processing

To deploy the application, you need to host both components, either on the same server or on separate platforms.

## Hosting Options

We provide detailed guides for several hosting options:

### [General Hosting Guide](HOSTING_GUIDE.md)

An overview of all hosting options with basic instructions for each.

### [GitHub Pages + Render](GITHUB_PAGES_HOSTING.md)

Deploy the frontend on GitHub Pages (free) and the backend on Render (free tier available).

**Pros**: Free, simple deployment, good for personal projects
**Cons**: Limited scalability, Render free tier has sleep time

### [Vercel + Render](VERCEL_RENDER_HOSTING.md)

Deploy the frontend on Vercel (optimized for Next.js) and the backend on Render.

**Pros**: Excellent developer experience, automatic preview deployments, free tier available
**Cons**: Potential costs for high traffic, Render free tier has sleep time

### [Self-Hosted VPS](SELF_HOSTING_GUIDE.md)

Deploy both frontend and backend on a Virtual Private Server (VPS) like DigitalOcean, Linode, or AWS EC2.

**Pros**: Complete control, fixed monthly cost, no sleep time
**Cons**: Requires server management knowledge, manual maintenance

### [Hosting Options Comparison](HOSTING_OPTIONS_COMPARISON.md)

A detailed comparison of all hosting options to help you choose the best one for your needs.

## Choosing the Right Option

To choose the right hosting option, consider the following factors:

1. **Budget**: How much are you willing to spend?

    - Free: GitHub Pages + Render (Free Tier)
    - Low cost: Vercel + Render or small VPS
    - Flexible: AWS (pay-per-use)

2. **Technical Expertise**: What is your comfort level with server management?

    - Beginner: GitHub Pages + Render or Vercel + Render
    - Intermediate: Docker + VPS
    - Advanced: Self-hosted VPS or Kubernetes

3. **Traffic Volume**: How many users will access your application?

    - Low (<1,000 users/month): Any option
    - Medium (1,000-10,000 users/month): Vercel + Render (Paid Tier) or VPS
    - High (>10,000 users/month): Self-hosted VPS, Docker + VPS, or cloud services

4. **Scalability Needs**: Do you expect rapid growth?
    - Low: GitHub Pages + Render or Self-hosted VPS
    - Medium: Vercel + Render
    - High: AWS services or Kubernetes

For a detailed comparison, refer to the [Hosting Options Comparison](HOSTING_OPTIONS_COMPARISON.md) document.

## Getting Started

### Prerequisites

Before deploying the application, ensure you have:

-   Git installed
-   Node.js (v18 or later) installed
-   Python (v3.9 or later) installed
-   Access to the All PDF Tools repository

### Basic Deployment Steps

Regardless of the hosting option you choose, the basic deployment process involves:

1. **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/all-pdf-tools-nextjs.git
    cd all-pdf-tools-nextjs
    ```

2. **Set up the frontend**:

    ```bash
    cd frontend
    npm install
    npm run build
    ```

3. **Set up the backend**:

    ```bash
    cd ../backend
    pip install -r requirements.txt
    ```

4. **Configure environment variables**:

    - Frontend: Create a `.env.local` or `.env.production` file with `NEXT_PUBLIC_API_URL`
    - Backend: Set `CORS_ORIGINS` to allow requests from your frontend domain

5. **Deploy according to your chosen hosting option**:
    - Follow the specific guide for your chosen hosting option

## Troubleshooting

### Common Issues

#### CORS Errors

If you see CORS errors in the browser console:

1. Check that the backend's `CORS_ORIGINS` setting includes your frontend domain
2. Ensure the frontend is making requests to the correct backend URL
3. Verify that the backend is running and accessible

#### Build Errors

If the frontend build fails:

1. Check for syntax errors in your code
2. Ensure all dependencies are installed
3. Verify that your Next.js configuration is correct

#### Backend Errors

If the backend fails to start:

1. Check for syntax errors in your code
2. Ensure all dependencies are installed
3. Verify that the required environment variables are set
4. Check if the port is already in use

### Getting Help

If you encounter issues not covered in these guides:

1. Check the error logs for specific error messages
2. Search for the error message online
3. Consult the documentation for the specific hosting platform
4. Ask for help in the project's issue tracker

## Contributing

We welcome contributions to improve these hosting guides:

1. Fork the repository
2. Make your changes
3. Submit a pull request

Please ensure your contributions are clear, accurate, and follow the existing style of the guides.

---

These guides were last updated on May 20, 2025. The deployment instructions are compatible with All PDF Tools version 1.0.0 and later.
