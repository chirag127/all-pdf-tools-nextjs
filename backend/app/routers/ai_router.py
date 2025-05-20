from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Header, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import os
import uuid
import shutil
from app.services import gemini_service, pdf_service
from app.models.ai_models import (
    GeminiModel, GeminiModelsResponse, AIFeatureType,
    ChatRequest, ChatResponse, SummarizeRequest, SummarizeResponse,
    TranslateRequest, TranslateResponse, GenerateQuestionsRequest, GenerateQuestionsResponse
)
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Helper function to save uploaded file
async def save_upload_file(upload_file: UploadFile) -> str:
    """Save an uploaded file to a temporary location.

    Args:
        upload_file: The uploaded file

    Returns:
        Path to the saved file
    """
    # Create a unique filename
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(upload_file.filename)[1]
    temp_file_path = os.path.join(settings.TEMP_FILE_DIR, f"{file_id}{file_extension}")

    # Save the file
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return temp_file_path

# Helper function to clean up temporary files
def cleanup_temp_files(file_paths: List[str]):
    """Clean up temporary files.

    Args:
        file_paths: List of file paths to clean up
    """
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.error(f"Error cleaning up temporary file {path}: {e}")

@router.get("/models", response_model=GeminiModelsResponse)
async def get_models(x_gemini_api_key: str = Header(...)):
    """List available Gemini models."""
    try:
        models = gemini_service.list_gemini_models(x_gemini_api_key)
        if models is None:
            raise HTTPException(status_code=500, detail="Could not fetch models from Gemini API")

        return GeminiModelsResponse(models=[GeminiModel(**model) for model in models])
    except Exception as e:
        logger.error(f"Error listing Gemini models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat_with_pdf(
    background_tasks: BackgroundTasks,
    request: ChatRequest,
    file: Optional[UploadFile] = File(None),
    x_gemini_api_key: str = Header(...),
    model_name: str = Query("models/gemini-1.5-pro"),
):
    """Chat with a PDF using Gemini API."""
    temp_files = []

    try:
        # Validate that either file or pdf_id is provided
        if file is None and request.pdf_id is None:
            raise HTTPException(status_code=400, detail="Either file or pdf_id must be provided")

        # Process file if provided
        if file:
            # Validate file is a PDF
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="File must be a PDF")

            # Save uploaded file
            temp_file_path = await save_upload_file(file)
            temp_files.append(temp_file_path)

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(temp_file_path)
        else:
            # Use pdf_id to get the file
            pdf_path = os.path.join(settings.TEMP_FILE_DIR, f"{request.pdf_id}.pdf")
            if not os.path.exists(pdf_path):
                raise HTTPException(status_code=404, detail="PDF file not found")

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(pdf_path)

        # Chat with PDF using Gemini API
        answer = gemini_service.chat_with_pdf(x_gemini_api_key, model_name, pdf_text, request.question)
        if answer is None:
            raise HTTPException(status_code=500, detail="Failed to generate response from Gemini API")

        # Schedule cleanup of temporary files
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response
        return ChatResponse(
            answer=answer,
            source_pages=None  # We don't track source pages in this implementation
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up all temporary files in case of error
        background_tasks.add_task(cleanup_temp_files, temp_files)

        logger.error(f"Error in chat with PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_pdf(
    background_tasks: BackgroundTasks,
    request: SummarizeRequest = None,
    file: Optional[UploadFile] = File(None),
    length: str = Form("medium"),
    x_gemini_api_key: str = Header(...),
    model_name: str = Query("models/gemini-1.5-pro"),
):
    """Summarize a PDF using Gemini API."""
    temp_files = []

    try:
        # Validate that either file or pdf_id is provided
        if file is None and (request is None or request.pdf_id is None):
            raise HTTPException(status_code=400, detail="Either file or pdf_id must be provided")

        # Process file if provided
        if file:
            # Validate file is a PDF
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="File must be a PDF")

            # Save uploaded file
            temp_file_path = await save_upload_file(file)
            temp_files.append(temp_file_path)

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(temp_file_path)
        else:
            # Use pdf_id to get the file
            pdf_id = request.pdf_id
            pdf_path = os.path.join(settings.TEMP_FILE_DIR, f"{pdf_id}.pdf")
            if not os.path.exists(pdf_path):
                raise HTTPException(status_code=404, detail="PDF file not found")

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(pdf_path)

        # Use length from request if provided, otherwise use the form value
        summary_length = request.length if request and request.length else length

        # Summarize PDF using Gemini API
        summary = gemini_service.summarize_pdf(x_gemini_api_key, model_name, pdf_text, summary_length)
        if summary is None:
            raise HTTPException(status_code=500, detail="Failed to generate summary from Gemini API")

        # Schedule cleanup of temporary files
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response
        return SummarizeResponse(summary=summary)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up all temporary files in case of error
        background_tasks.add_task(cleanup_temp_files, temp_files)

        logger.error(f"Error summarizing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate", response_model=TranslateResponse)
async def translate_pdf(
    background_tasks: BackgroundTasks,
    request: TranslateRequest = None,
    file: Optional[UploadFile] = File(None),
    target_language: str = Form(...),
    x_gemini_api_key: str = Header(...),
    model_name: str = Query("models/gemini-1.5-pro"),
):
    """Translate a PDF using Gemini API."""
    temp_files = []

    try:
        # Validate that either file or pdf_id is provided
        if file is None and (request is None or request.pdf_id is None):
            raise HTTPException(status_code=400, detail="Either file or pdf_id must be provided")

        # Process file if provided
        if file:
            # Validate file is a PDF
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="File must be a PDF")

            # Save uploaded file
            temp_file_path = await save_upload_file(file)
            temp_files.append(temp_file_path)

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(temp_file_path)
        else:
            # Use pdf_id to get the file
            pdf_id = request.pdf_id
            pdf_path = os.path.join(settings.TEMP_FILE_DIR, f"{pdf_id}.pdf")
            if not os.path.exists(pdf_path):
                raise HTTPException(status_code=404, detail="PDF file not found")

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(pdf_path)

        # Use target_language from request if provided, otherwise use the form value
        target_lang = request.target_language if request and request.target_language else target_language

        # Translate PDF using Gemini API
        translated_text = gemini_service.translate_pdf(x_gemini_api_key, model_name, pdf_text, target_lang)
        if translated_text is None:
            raise HTTPException(status_code=500, detail="Failed to generate translation from Gemini API")

        # Schedule cleanup of temporary files
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response
        return TranslateResponse(
            translated_text=translated_text,
            source_language="auto-detected"  # We don't explicitly detect the source language
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up all temporary files in case of error
        background_tasks.add_task(cleanup_temp_files, temp_files)

        logger.error(f"Error translating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(
    background_tasks: BackgroundTasks,
    request: GenerateQuestionsRequest = None,
    file: Optional[UploadFile] = File(None),
    count: int = Form(5),
    x_gemini_api_key: str = Header(...),
    model_name: str = Query("models/gemini-1.5-pro"),
):
    """Generate questions from a PDF using Gemini API."""
    temp_files = []

    try:
        # Validate that either file or pdf_id is provided
        if file is None and (request is None or request.pdf_id is None):
            raise HTTPException(status_code=400, detail="Either file or pdf_id must be provided")

        # Process file if provided
        if file:
            # Validate file is a PDF
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="File must be a PDF")

            # Save uploaded file
            temp_file_path = await save_upload_file(file)
            temp_files.append(temp_file_path)

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(temp_file_path)
        else:
            # Use pdf_id to get the file
            pdf_id = request.pdf_id
            pdf_path = os.path.join(settings.TEMP_FILE_DIR, f"{pdf_id}.pdf")
            if not os.path.exists(pdf_path):
                raise HTTPException(status_code=404, detail="PDF file not found")

            # Extract text from PDF
            pdf_text = pdf_service.extract_text_from_pdf(pdf_path)

        # Use count from request if provided, otherwise use the form value
        question_count = request.count if request and request.count else count

        # Generate questions using Gemini API
        questions = gemini_service.generate_questions(x_gemini_api_key, model_name, pdf_text, question_count)
        if questions is None:
            raise HTTPException(status_code=500, detail="Failed to generate questions from Gemini API")

        # Schedule cleanup of temporary files
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response
        return GenerateQuestionsResponse(questions=questions)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up all temporary files in case of error
        background_tasks.add_task(cleanup_temp_files, temp_files)

        logger.error(f"Error generating questions from PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
