from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Optional, Dict, Any
import os
import uuid
import shutil
from app.services import pdf_service
from app.models.pdf_models import PDFOperationType, PageRange, PDFResponse
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

@router.post("/merge", response_model=PDFResponse)
async def merge_pdfs(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    """Merge multiple PDFs into a single PDF."""
    temp_files = []

    try:
        # Save uploaded files
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="All files must be PDFs")

            temp_file_path = await save_upload_file(file)
            temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Merge PDFs
        pdf_service.merge_pdfs(temp_files, output_path)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDFs merged successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error merging PDFs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/split", response_model=PDFResponse)
async def split_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    ranges: List[str] = Form(...),  # Format: "1-5,6-10,11-15"
):
    """Split a PDF into multiple PDFs based on page ranges."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Parse page ranges
        page_ranges = []
        for range_str in ranges:
            parts = range_str.split('-')
            if len(parts) != 2:
                raise HTTPException(status_code=400, detail=f"Invalid page range format: {range_str}")

            try:
                start = int(parts[0])
                end = int(parts[1])
                if start < 1 or end < start:
                    raise HTTPException(status_code=400, detail=f"Invalid page range: {range_str}")

                page_ranges.append((start, end))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid page range format: {range_str}")

        # Create output directory
        output_dir_id = str(uuid.uuid4())
        output_dir = os.path.join(settings.TEMP_FILE_DIR, output_dir_id)
        os.makedirs(output_dir, exist_ok=True)

        # Split PDF
        output_paths = pdf_service.split_pdf(temp_file_path, output_dir, page_ranges)

        # Schedule cleanup of temporary files (excluding the output files)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URLs
        return PDFResponse(
            success=True,
            message=f"PDF split into {len(output_paths)} files",
            file_path=output_dir,
            download_url=f"/api/v1/pdf/download-zip/{output_dir_id}"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error splitting PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-pages", response_model=PDFResponse)
async def extract_pages(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pages: List[int] = Form(...),
):
    """Extract specific pages from a PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Extract pages
        pdf_service.extract_pages(temp_file_path, output_path, pages)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="Pages extracted successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error extracting pages from PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rotate", response_model=PDFResponse)
async def rotate_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    rotation: int = Form(...),  # 90, 180, or 270 degrees
    pages: Optional[List[int]] = Form(None),  # Optional list of pages to rotate
):
    """Rotate pages in a PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Validate rotation angle
        if rotation not in [90, 180, 270]:
            raise HTTPException(status_code=400, detail="Rotation must be 90, 180, or 270 degrees")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Rotate PDF
        pdf_service.rotate_pdf(temp_file_path, output_path, rotation, pages)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDF rotated successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error rotating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-page-numbers", response_model=PDFResponse)
async def add_page_numbers(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    position: str = Form("bottom-center"),
    start_number: int = Form(1),
    format_str: str = Form("Page {page_num}"),
):
    """Add page numbers to a PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Validate position
        valid_positions = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]
        if position not in valid_positions:
            raise HTTPException(status_code=400, detail=f"Position must be one of: {', '.join(valid_positions)}")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Add page numbers
        pdf_service.add_page_numbers(temp_file_path, output_path, position, start_number, format_str)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="Page numbers added successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error adding page numbers to PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-watermark", response_model=PDFResponse)
async def add_watermark(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    watermark_text: Optional[str] = Form(None),
    watermark_image: Optional[UploadFile] = File(None),
    opacity: float = Form(0.3),
    position: str = Form("center"),
    rotation: int = Form(0),
):
    """Add a text or image watermark to a PDF."""
    temp_files = []
    watermark_image_path = None

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Validate that either watermark_text or watermark_image is provided
        if watermark_text is None and watermark_image is None:
            raise HTTPException(status_code=400, detail="Either watermark_text or watermark_image must be provided")

        # Validate position
        valid_positions = ["center", "tiled"]
        if position not in valid_positions:
            raise HTTPException(status_code=400, detail=f"Position must be one of: {', '.join(valid_positions)}")

        # Save uploaded PDF file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Save watermark image if provided
        if watermark_image:
            watermark_image_path = await save_upload_file(watermark_image)
            temp_files.append(watermark_image_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Add watermark
        pdf_service.add_watermark(
            temp_file_path,
            output_path,
            watermark_text,
            watermark_image_path,
            opacity,
            position,
            rotation
        )

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="Watermark added successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error adding watermark to PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crop", response_model=PDFResponse)
async def crop_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    left: float = Form(0),
    bottom: float = Form(0),
    right: float = Form(0),
    top: float = Form(0),
    pages: Optional[List[int]] = Form(None),
):
    """Crop a PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Crop PDF
        pdf_service.crop_pdf(temp_file_path, output_path, left, bottom, right, top, pages)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDF cropped successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error cropping PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/protect", response_model=PDFResponse)
async def protect_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_password: Optional[str] = Form(None),
    owner_password: Optional[str] = Form(None),
    allow_print: bool = Form(True),
    allow_copy: bool = Form(True),
    allow_modify: bool = Form(True),
):
    """Add password protection to a PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Validate that at least one password is provided
        if user_password is None and owner_password is None:
            raise HTTPException(status_code=400, detail="At least one of user_password or owner_password must be provided")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Create permissions dictionary
        permissions = {
            "print": allow_print,
            "copy": allow_copy,
            "modify": allow_modify,
        }

        # Protect PDF
        pdf_service.protect_pdf(temp_file_path, output_path, user_password, owner_password, permissions)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDF protected successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error protecting PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unlock", response_model=PDFResponse)
async def unlock_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...),
):
    """Remove password protection from a PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Unlock PDF
        try:
            pdf_service.unlock_pdf(temp_file_path, output_path, password)
        except ValueError as ve:
            # Handle incorrect password
            raise HTTPException(status_code=400, detail=str(ve))

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDF unlocked successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error unlocking PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compress", response_model=PDFResponse)
async def compress_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: str = Form("medium"),  # low, medium, high
):
    """Compress a PDF to reduce file size."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Validate quality
        valid_qualities = ["low", "medium", "high"]
        if quality not in valid_qualities:
            raise HTTPException(status_code=400, detail=f"Quality must be one of: {', '.join(valid_qualities)}")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Compress PDF
        pdf_service.compress_pdf(temp_file_path, output_path, quality)

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDF compressed successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error compressing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/repair", response_model=PDFResponse)
async def repair_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Attempt to repair a corrupted PDF."""
    temp_files = []

    try:
        # Validate file is a PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Save uploaded file
        temp_file_path = await save_upload_file(file)
        temp_files.append(temp_file_path)

        # Create output file path
        output_file_id = str(uuid.uuid4())
        output_path = os.path.join(settings.TEMP_FILE_DIR, f"{output_file_id}.pdf")

        # Repair PDF
        try:
            pdf_service.repair_pdf(temp_file_path, output_path)
        except Exception as repair_error:
            raise HTTPException(status_code=400, detail=f"Could not repair PDF: {str(repair_error)}")

        # Schedule cleanup of temporary files (excluding the output file)
        background_tasks.add_task(cleanup_temp_files, temp_files)

        # Return response with download URL
        return PDFResponse(
            success=True,
            message="PDF repaired successfully",
            file_path=output_path,
            download_url=f"/api/v1/pdf/download/{output_file_id}.pdf"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up all temporary files in case of error
        all_temp_files = temp_files + [os.path.join(settings.TEMP_FILE_DIR, f"{str(uuid.uuid4())}.pdf")]
        background_tasks.add_task(cleanup_temp_files, all_temp_files)

        logger.error(f"Error repairing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{file_name}")
async def download_file(
    file_name: str,
    background_tasks: BackgroundTasks,
):
    """Download a processed PDF file."""
    file_path = os.path.join(settings.TEMP_FILE_DIR, file_name)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Schedule file cleanup after a delay (e.g., 1 hour)
    # This allows the user to download the file multiple times if needed
    def delayed_cleanup():
        import time
        time.sleep(3600)  # 1 hour
        if os.path.exists(file_path):
            os.remove(file_path)

    background_tasks.add_task(delayed_cleanup)

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/pdf",
        background=background_tasks
    )

@router.get("/download-zip/{dir_id}")
async def download_zip(
    dir_id: str,
    background_tasks: BackgroundTasks,
):
    """Download a zip file containing multiple processed PDFs."""
    import zipfile
    from io import BytesIO

    dir_path = os.path.join(settings.TEMP_FILE_DIR, dir_id)

    if not os.path.exists(dir_path) or not os.path.isdir(dir_path):
        raise HTTPException(status_code=404, detail="Directory not found")

    # Create a zip file in memory
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_name in os.listdir(dir_path):
            file_path = os.path.join(dir_path, file_name)
            if os.path.isfile(file_path):
                zip_file.write(file_path, arcname=file_name)

    # Schedule directory cleanup after a delay (e.g., 1 hour)
    def delayed_cleanup():
        import time
        import shutil
        time.sleep(3600)  # 1 hour
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)

    background_tasks.add_task(delayed_cleanup)

    # Reset buffer position
    zip_buffer.seek(0)

    # Return the zip file
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=pdf_files_{dir_id}.zip"}
    )
