# All PDF Tools: Hosting Guide

This repository contains comprehensive documentation on how to host the All PDF Tools application, a web-based PDF manipulation tool built with Next.js (frontend) and FastAPI (backend).

## Quick Start

If you're looking to quickly deploy All PDF Tools, here are your options:

| Hosting Option | Best For | Guide |
|----------------|----------|-------|
| GitHub Pages + Render | Free hosting, personal projects | [GITHUB_PAGES_HOSTING.md](GITHUB_PAGES_HOSTING.md) |
| Vercel + Render | Next.js apps, great developer experience | [VERCEL_RENDER_HOSTING.md](VERCEL_RENDER_HOSTING.md) |
| Self-hosted VPS | Complete control, fixed monthly cost | [SELF_HOSTING_GUIDE.md](SELF_HOSTING_GUIDE.md) |
| Docker | Consistent environments, easy deployment | [DOCKER_HOSTING_GUIDE.md](DOCKER_HOSTING_GUIDE.md) |
| AWS | Scalability, pay-per-use pricing | [AWS_HOSTING_GUIDE.md](AWS_HOSTING_GUIDE.md) |

For a quick comparison of all options, see [HOSTING_SUMMARY.md](HOSTING_SUMMARY.md).

## Documentation Structure

- [HOSTING_README.md](HOSTING_README.md) - Main documentation hub with overview of all options
- [HOSTING_SUMMARY.md](HOSTING_SUMMARY.md) - Quick comparison of all hosting options
- [HOSTING_OPTIONS_COMPARISON.md](HOSTING_OPTIONS_COMPARISON.md) - Detailed comparison with pros/cons
- Individual guides for each hosting option (see table above)

## About All PDF Tools

All PDF Tools is a comprehensive web application that provides various PDF manipulation tools, including:

- **Document Organization**: Merge PDFs, Split PDFs, Extract Pages, Organize Pages, Rotate PDFs
- **Conversion**: Convert to/from PDF, OCR PDF, Scan to PDF
- **Editing**: Add Page Numbers, Add Watermark, Crop PDF
- **Security**: Protect PDF, Unlock PDF, Sign PDF, Redact PDF
- **Enhancement**: Compress PDF, Repair PDF
- **AI Features**: Compare PDFs and more

The application consists of:
- **Frontend**: A Next.js application that provides the user interface
- **Backend**: A FastAPI application that handles PDF processing

## Choosing the Right Hosting Option

Consider these factors when choosing a hosting option:

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

## Basic Deployment Steps

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

## Common Issues and Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check that the backend's `CORS_ORIGINS` setting includes your frontend domain
2. Ensure the frontend is making requests to the correct backend URL
3. Verify that the backend is running and accessible

### Build Errors

If the frontend build fails:

1. Check for syntax errors in your code
2. Ensure all dependencies are installed
3. Verify that your Next.js configuration is correct

### Backend Errors

If the backend fails to start:

1. Check for syntax errors in your code
2. Ensure all dependencies are installed
3. Verify that the required environment variables are set
4. Check if the port is already in use

For more detailed troubleshooting, refer to the specific hosting guide for your chosen option.

## Contributing

We welcome contributions to improve these hosting guides:

1. Fork the repository
2. Make your changes
3. Submit a pull request

Please ensure your contributions are clear, accurate, and follow the existing style of the guides.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Last updated: May 20, 2025
