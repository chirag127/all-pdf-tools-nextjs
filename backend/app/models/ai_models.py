from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class GeminiModel(BaseModel):
    """Model for Gemini API model information."""
    name: str
    description: str = "N/A"
    input_token_limit: Any = "N/A"
    output_token_limit: Any = "N/A"

class GeminiModelsResponse(BaseModel):
    """Response model for listing Gemini models."""
    models: List[GeminiModel]

class AIFeatureType(str, Enum):
    """Enum for AI feature types."""
    CHAT = "chat"
    SUMMARIZE = "summarize"
    TRANSLATE = "translate"
    GENERATE_QUESTIONS = "generate_questions"

class ChatRequest(BaseModel):
    """Request model for chat with PDF."""
    question: str = Field(..., description="User's question about the PDF content")
    pdf_id: Optional[str] = Field(None, description="ID of previously processed PDF")
    context: Optional[str] = Field(None, description="Additional context for the question")

class ChatResponse(BaseModel):
    """Response model for chat with PDF."""
    answer: str
    source_pages: Optional[List[int]] = None

class SummarizeRequest(BaseModel):
    """Request model for PDF summarization."""
    pdf_id: Optional[str] = Field(None, description="ID of previously processed PDF")
    length: Optional[str] = Field("medium", description="Desired summary length (short, medium, long)")

class SummarizeResponse(BaseModel):
    """Response model for PDF summarization."""
    summary: str

class TranslateRequest(BaseModel):
    """Request model for PDF translation."""
    pdf_id: Optional[str] = Field(None, description="ID of previously processed PDF")
    target_language: str = Field(..., description="Target language for translation")

class TranslateResponse(BaseModel):
    """Response model for PDF translation."""
    translated_text: str
    source_language: Optional[str] = None

class GenerateQuestionsRequest(BaseModel):
    """Request model for generating questions from PDF."""
    pdf_id: Optional[str] = Field(None, description="ID of previously processed PDF")
    count: Optional[int] = Field(5, description="Number of questions to generate")

class GenerateQuestionsResponse(BaseModel):
    """Response model for generating questions from PDF."""
    questions: List[str]
