from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from app.core.config import settings

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="All PDF Tools API",
    description="Backend API for All PDF Tools application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to All PDF Tools API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import and include routers
from app.routers import pdf_router, ai_router
app.include_router(pdf_router.router, prefix="/api/v1/pdf", tags=["PDF Operations"])
app.include_router(ai_router.router, prefix="/api/v1/ai", tags=["AI Operations"])

# Print startup message
print(f"Starting {app.title} v{app.version}")
print(f"Environment: {settings.PYTHON_ENV}")
print(f"API Prefix: {settings.API_PREFIX}")
print(f"CORS Origins: {settings.CORS_ORIGINS}")
print(f"Temporary File Directory: {settings.TEMP_FILE_DIR}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
