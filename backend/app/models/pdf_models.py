from pydantic import BaseModel, Field
from typing import List, Optional, Union
from enum import Enum

class PDFOperationType(str, Enum):
    """Enum for PDF operation types."""
    MERGE = "merge"
    SPLIT = "split"
    REMOVE_PAGES = "remove_pages"
    EXTRACT_PAGES = "extract_pages"
    ORGANIZE_PAGES = "organize_pages"
    ROTATE = "rotate"
    ADD_PAGE_NUMBERS = "add_page_numbers"
    ADD_WATERMARK = "add_watermark"
    CROP = "crop"
    EDIT = "edit"
    UNLOCK = "unlock"
    PROTECT = "protect"
    SIGN = "sign"
    REDACT = "redact"
    COMPRESS = "compress"
    REPAIR = "repair"
    OCR = "ocr"
    SCAN_TO_PDF = "scan_to_pdf"
    COMPARE = "compare"
    CONVERT_TO_PDF = "convert_to_pdf"
    CONVERT_FROM_PDF = "convert_from_pdf"

class PageRange(BaseModel):
    """Model for page range selection."""
    start: int = Field(..., description="Start page number (1-indexed)")
    end: int = Field(..., description="End page number (1-indexed)")

class PDFResponse(BaseModel):
    """Generic response model for PDF operations."""
    success: bool
    message: str
    file_path: Optional[str] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
