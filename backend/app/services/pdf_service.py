import os
import uuid
import logging
from typing import List, Optional, Tuple, Dict, Any
import PyPDF2
from PyPDF2 import PdfReader, PdfWriter
import pikepdf
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from app.core.config import settings

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file.

    Args:
        file_path: Path to the PDF file

    Returns:
        Extracted text from the PDF
    """
    try:
        text = ""
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise

def get_pdf_info(file_path: str) -> Dict[str, Any]:
    """Get information about a PDF file.

    Args:
        file_path: Path to the PDF file

    Returns:
        Dictionary containing PDF information
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            info = {
                "num_pages": len(reader.pages),
                "metadata": reader.metadata,
                "is_encrypted": reader.is_encrypted
            }
        return info
    except Exception as e:
        logger.error(f"Error getting PDF info: {e}")
        raise

def merge_pdfs(file_paths: List[str], output_path: str) -> str:
    """Merge multiple PDFs into a single PDF.

    Args:
        file_paths: List of paths to the PDF files to merge
        output_path: Path to save the merged PDF

    Returns:
        Path to the merged PDF
    """
    try:
        merger = PyPDF2.PdfMerger()

        for path in file_paths:
            merger.append(path)

        merger.write(output_path)
        merger.close()

        return output_path
    except Exception as e:
        logger.error(f"Error merging PDFs: {e}")
        raise

def split_pdf(file_path: str, output_dir: str, ranges: List[Tuple[int, int]]) -> List[str]:
    """Split a PDF into multiple PDFs based on page ranges.

    Args:
        file_path: Path to the PDF file to split
        output_dir: Directory to save the split PDFs
        ranges: List of tuples containing start and end page numbers (1-indexed)

    Returns:
        List of paths to the split PDFs
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            total_pages = len(reader.pages)

            output_paths = []

            for i, (start, end) in enumerate(ranges):
                # Adjust for 0-indexing
                start_idx = start - 1
                end_idx = min(end, total_pages) - 1

                if start_idx < 0 or start_idx > end_idx or end_idx >= total_pages:
                    continue

                writer = PdfWriter()

                for page_num in range(start_idx, end_idx + 1):
                    writer.add_page(reader.pages[page_num])

                output_file = os.path.join(output_dir, f"split_{i+1}.pdf")
                with open(output_file, 'wb') as output:
                    writer.write(output)

                output_paths.append(output_file)

            return output_paths
    except Exception as e:
        logger.error(f"Error splitting PDF: {e}")
        raise

def extract_pages(file_path: str, output_path: str, pages: List[int]) -> str:
    """Extract specific pages from a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the extracted pages
        pages: List of page numbers to extract (1-indexed)

    Returns:
        Path to the PDF with extracted pages
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            writer = PdfWriter()

            for page_num in pages:
                # Adjust for 0-indexing
                idx = page_num - 1
                if 0 <= idx < len(reader.pages):
                    writer.add_page(reader.pages[idx])

            with open(output_path, 'wb') as output:
                writer.write(output)

            return output_path
    except Exception as e:
        logger.error(f"Error extracting pages from PDF: {e}")
        raise

def rotate_pdf(file_path: str, output_path: str, rotation: int, pages: Optional[List[int]] = None) -> str:
    """Rotate pages in a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the rotated PDF
        rotation: Rotation angle in degrees (90, 180, 270)
        pages: List of page numbers to rotate (1-indexed), or None to rotate all pages

    Returns:
        Path to the rotated PDF
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            writer = PdfWriter()

            for i, page in enumerate(reader.pages):
                # If pages is None, rotate all pages
                # Otherwise, only rotate specified pages
                if pages is None or (i + 1) in pages:
                    page.rotate(rotation)
                writer.add_page(page)

            with open(output_path, 'wb') as output:
                writer.write(output)

            return output_path
    except Exception as e:
        logger.error(f"Error rotating PDF: {e}")
        raise

def add_page_numbers(file_path: str, output_path: str, position: str = "bottom-center",
                    start_number: int = 1, format_str: str = "Page {page_num}") -> str:
    """Add page numbers to a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the PDF with page numbers
        position: Position of the page numbers (top-left, top-center, top-right,
                 bottom-left, bottom-center, bottom-right)
        start_number: Starting page number
        format_str: Format string for page numbers (use {page_num} and {total_pages})

    Returns:
        Path to the PDF with page numbers
    """
    try:
        # First, get the total number of pages
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            total_pages = len(reader.pages)

        # Create a temporary PDF with just the page numbers
        temp_path = os.path.join(os.path.dirname(output_path), f"temp_{uuid.uuid4()}.pdf")

        # Position mapping
        positions = {
            "top-left": (50, 800),
            "top-center": (300, 800),
            "top-right": (550, 800),
            "bottom-left": (50, 50),
            "bottom-center": (300, 50),
            "bottom-right": (550, 50)
        }

        x, y = positions.get(position, positions["bottom-center"])

        # Create a PDF with page numbers
        c = canvas.Canvas(temp_path, pagesize=letter)

        for i in range(total_pages):
            c.drawString(x, y, format_str.format(page_num=start_number + i, total_pages=total_pages))
            c.showPage()

        c.save()

        # Merge the original PDF with the page numbers
        with open(file_path, 'rb') as original_file, open(temp_path, 'rb') as overlay_file:
            original_pdf = PdfReader(original_file)
            overlay_pdf = PdfReader(overlay_file)

            writer = PdfWriter()

            for i, page in enumerate(original_pdf.pages):
                page.merge_page(overlay_pdf.pages[i])
                writer.add_page(page)

            with open(output_path, 'wb') as output:
                writer.write(output)

        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return output_path
    except Exception as e:
        logger.error(f"Error adding page numbers to PDF: {e}")
        raise

def add_watermark(file_path: str, output_path: str, watermark_text: Optional[str] = None,
                 watermark_image: Optional[str] = None, opacity: float = 0.3,
                 position: str = "center", rotation: int = 0) -> str:
    """Add a text or image watermark to a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the watermarked PDF
        watermark_text: Text to use as watermark (if None, watermark_image must be provided)
        watermark_image: Path to image to use as watermark (if None, watermark_text must be provided)
        opacity: Opacity of the watermark (0.0 to 1.0)
        position: Position of the watermark (center, tiled)
        rotation: Rotation angle of the watermark in degrees

    Returns:
        Path to the watermarked PDF
    """
    try:
        if watermark_text is None and watermark_image is None:
            raise ValueError("Either watermark_text or watermark_image must be provided")

        # Create a temporary PDF with just the watermark
        temp_path = os.path.join(os.path.dirname(output_path), f"temp_{uuid.uuid4()}.pdf")

        # Get the dimensions of the original PDF
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            total_pages = len(reader.pages)
            # Assuming all pages have the same size as the first page
            if total_pages > 0:
                page = reader.pages[0]
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
            else:
                # Default to letter size if no pages
                width, height = letter

        # Create a PDF with the watermark
        c = canvas.Canvas(temp_path, pagesize=(width, height))

        # Set opacity
        c.setFillAlpha(opacity)

        # Position mapping
        if position == "center":
            positions = [(width / 2, height / 2)]
        elif position == "tiled":
            # Create a grid of positions
            x_step, y_step = 200, 200
            positions = [(x, y) for x in range(0, int(width), x_step)
                        for y in range(0, int(height), y_step)]
        else:
            # Default to center
            positions = [(width / 2, height / 2)]

        # Apply watermark to each page
        for _ in range(total_pages):
            c.saveState()

            # Apply rotation
            if rotation != 0:
                c.translate(width / 2, height / 2)
                c.rotate(rotation)
                c.translate(-width / 2, -height / 2)

            # Draw watermark at each position
            for x, y in positions:
                if watermark_text:
                    # Text watermark
                    c.setFont("Helvetica", 60)
                    c.setFillColorRGB(0.5, 0.5, 0.5)  # Gray color
                    c.drawCentredString(x, y, watermark_text)
                elif watermark_image:
                    # Image watermark
                    # Adjust position to center the image
                    c.drawImage(watermark_image, x - 100, y - 100, 200, 200, mask='auto')

            c.restoreState()
            c.showPage()

        c.save()

        # Merge the original PDF with the watermark
        with open(file_path, 'rb') as original_file, open(temp_path, 'rb') as watermark_file:
            original_pdf = PdfReader(original_file)
            watermark_pdf = PdfReader(watermark_file)

            writer = PdfWriter()

            for i, page in enumerate(original_pdf.pages):
                page.merge_page(watermark_pdf.pages[i])
                writer.add_page(page)

            with open(output_path, 'wb') as output:
                writer.write(output)

        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return output_path
    except Exception as e:
        logger.error(f"Error adding watermark to PDF: {e}")
        raise

def crop_pdf(file_path: str, output_path: str, left: float, bottom: float, right: float, top: float,
            pages: Optional[List[int]] = None) -> str:
    """Crop a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the cropped PDF
        left: Left margin to crop (in points)
        bottom: Bottom margin to crop (in points)
        right: Right margin to crop (in points)
        top: Top margin to crop (in points)
        pages: List of page numbers to crop (1-indexed), or None to crop all pages

    Returns:
        Path to the cropped PDF
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            writer = PdfWriter()

            for i, page in enumerate(reader.pages):
                # If pages is None, crop all pages
                # Otherwise, only crop specified pages
                if pages is None or (i + 1) in pages:
                    # Get the original page dimensions
                    original_left = float(page.mediabox.left)
                    original_bottom = float(page.mediabox.bottom)
                    original_right = float(page.mediabox.right)
                    original_top = float(page.mediabox.top)

                    # Calculate new dimensions
                    new_left = original_left + left
                    new_bottom = original_bottom + bottom
                    new_right = original_right - right
                    new_top = original_top - top

                    # Ensure valid dimensions
                    if new_left >= new_right or new_bottom >= new_top:
                        # Invalid crop, keep original dimensions
                        writer.add_page(page)
                    else:
                        # Set new crop box
                        page.mediabox.left = new_left
                        page.mediabox.bottom = new_bottom
                        page.mediabox.right = new_right
                        page.mediabox.top = new_top
                        writer.add_page(page)
                else:
                    # Add page without cropping
                    writer.add_page(page)

            with open(output_path, 'wb') as output:
                writer.write(output)

            return output_path
    except Exception as e:
        logger.error(f"Error cropping PDF: {e}")
        raise

def protect_pdf(file_path: str, output_path: str, user_password: Optional[str] = None,
               owner_password: Optional[str] = None, permissions: Optional[Dict[str, bool]] = None) -> str:
    """Add password protection to a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the protected PDF
        user_password: Password required to open the PDF (if None, no password required to open)
        owner_password: Password required to change permissions (if None, same as user_password)
        permissions: Dictionary of permissions (print, copy, modify, etc.)

    Returns:
        Path to the protected PDF
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            writer = PdfWriter()

            # Add all pages to the writer
            for page in reader.pages:
                writer.add_page(page)

            # Default permissions (allow everything)
            default_permissions = {
                "print": True,
                "modify": True,
                "copy": True,
                "annotate": True,
                "form": True,
                "extract": True,
                "assemble": True,
                "print_high_quality": True
            }

            # Use provided permissions or defaults
            perms = permissions or default_permissions

            # If owner_password is not provided, use user_password
            if owner_password is None and user_password is not None:
                owner_password = user_password

            # Encrypt the PDF
            writer.encrypt(
                user_password=user_password,
                owner_password=owner_password,
                use_128bit=True,
                permissions_flag=0
            )

            with open(output_path, 'wb') as output:
                writer.write(output)

            return output_path
    except Exception as e:
        logger.error(f"Error protecting PDF: {e}")
        raise

def unlock_pdf(file_path: str, output_path: str, password: str) -> str:
    """Remove password protection from a PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the unlocked PDF
        password: Password to unlock the PDF

    Returns:
        Path to the unlocked PDF
    """
    try:
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)

            # Check if the PDF is encrypted
            if reader.is_encrypted:
                # Try to decrypt with the provided password
                if reader.decrypt(password) != 1:
                    raise ValueError("Incorrect password")

            writer = PdfWriter()

            # Add all pages to the writer
            for page in reader.pages:
                writer.add_page(page)

            # Write the unlocked PDF
            with open(output_path, 'wb') as output:
                writer.write(output)

            return output_path
    except Exception as e:
        logger.error(f"Error unlocking PDF: {e}")
        raise

def compress_pdf(file_path: str, output_path: str, quality: str = "medium") -> str:
    """Compress a PDF to reduce file size.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the compressed PDF
        quality: Compression quality (low, medium, high)

    Returns:
        Path to the compressed PDF
    """
    try:
        # Quality settings
        quality_settings = {
            "low": {
                "image_quality": 30,  # Low image quality (0-100)
                "compress_images": True,
                "remove_metadata": True
            },
            "medium": {
                "image_quality": 60,  # Medium image quality
                "compress_images": True,
                "remove_metadata": False
            },
            "high": {
                "image_quality": 90,  # High image quality
                "compress_images": True,
                "remove_metadata": False
            }
        }

        settings = quality_settings.get(quality.lower(), quality_settings["medium"])

        # Use pikepdf for compression
        with pikepdf.open(file_path) as pdf:
            # Remove metadata if specified
            if settings["remove_metadata"]:
                with pdf.open_metadata() as meta:
                    meta.clear()

            # Save with compression settings
            pdf.save(output_path,
                    compress_streams=True,
                    preserve_pdfa=False,
                    object_stream_mode=pikepdf.ObjectStreamMode.generate)

        return output_path
    except Exception as e:
        logger.error(f"Error compressing PDF: {e}")
        raise

def repair_pdf(file_path: str, output_path: str) -> str:
    """Attempt to repair a corrupted PDF.

    Args:
        file_path: Path to the PDF file
        output_path: Path to save the repaired PDF

    Returns:
        Path to the repaired PDF
    """
    try:
        # Use pikepdf for repair
        with pikepdf.open(file_path, allow_overwriting_input=True) as pdf:
            pdf.save(output_path)

        return output_path
    except Exception as e:
        logger.error(f"Error repairing PDF: {e}")
        raise
