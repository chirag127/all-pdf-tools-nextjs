import google.generativeai as genai
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

def list_gemini_models(api_key: str) -> Optional[List[Dict[str, Any]]]:
    """Lists available Gemini models for the given API key.

    Args:
        api_key: The Gemini API key provided by the user

    Returns:
        A list of available models or None if an error occurs
    """
    try:
        genai.configure(api_key=api_key)
        models_list = []
        for model in genai.list_models():
            # Ensure the model is one that supports generateContent, e.g., 'gemini-pro'
            if 'generateContent' in model.supported_generation_methods:
                models_list.append({
                    "name": model.name,
                    "description": getattr(model, 'description', 'N/A'),
                    "input_token_limit": getattr(model, 'input_token_limit', 'N/A'),
                    "output_token_limit": getattr(model, 'output_token_limit', 'N/A')
                })
        return models_list
    except Exception as e:
        logger.error(f"Error listing Gemini models: {e}")
        return None

def chat_with_pdf(api_key: str, model_name: str, pdf_text: str, question: str) -> Optional[str]:
    """Chat with a PDF using Gemini API.

    Args:
        api_key: The Gemini API key provided by the user
        model_name: The name of the Gemini model to use
        pdf_text: The extracted text from the PDF
        question: The user's question about the PDF

    Returns:
        The AI-generated answer or None if an error occurs
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

        # Create a prompt that includes the PDF content and the user's question
        prompt = f"""
        I'm going to provide you with the content of a PDF document, followed by a question about it.
        Please answer the question based only on the information in the document.

        PDF CONTENT:
        {pdf_text}

        QUESTION:
        {question}

        ANSWER:
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error in chat with PDF: {e}")
        return None

def summarize_pdf(api_key: str, model_name: str, pdf_text: str, length: str = "medium") -> Optional[str]:
    """Summarize a PDF using Gemini API.

    Args:
        api_key: The Gemini API key provided by the user
        model_name: The name of the Gemini model to use
        pdf_text: The extracted text from the PDF
        length: The desired summary length (short, medium, long)

    Returns:
        The AI-generated summary or None if an error occurs
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

        # Determine summary length instruction
        length_instruction = {
            "short": "Create a brief summary in 2-3 paragraphs.",
            "medium": "Create a comprehensive summary covering the main points.",
            "long": "Create a detailed summary that covers all significant aspects of the document."
        }.get(length.lower(), "Create a comprehensive summary covering the main points.")

        # Create a prompt for summarization
        prompt = f"""
        I'm going to provide you with the content of a PDF document.
        Please summarize this document.
        {length_instruction}

        PDF CONTENT:
        {pdf_text}

        SUMMARY:
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error in summarize PDF: {e}")
        return None

def translate_pdf(api_key: str, model_name: str, pdf_text: str, target_language: str) -> Optional[str]:
    """Translate a PDF using Gemini API.

    Args:
        api_key: The Gemini API key provided by the user
        model_name: The name of the Gemini model to use
        pdf_text: The extracted text from the PDF
        target_language: The target language for translation

    Returns:
        The AI-generated translation or None if an error occurs
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

        # Create a prompt for translation
        prompt = f"""
        I'm going to provide you with the content of a PDF document.
        Please translate this document into {target_language}.
        Maintain the original formatting and structure as much as possible.

        PDF CONTENT:
        {pdf_text}

        TRANSLATION ({target_language}):
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error in translate PDF: {e}")
        return None

def generate_questions(api_key: str, model_name: str, pdf_text: str, count: int = 5) -> Optional[List[str]]:
    """Generate questions from a PDF using Gemini API.

    Args:
        api_key: The Gemini API key provided by the user
        model_name: The name of the Gemini model to use
        pdf_text: The extracted text from the PDF
        count: The number of questions to generate

    Returns:
        A list of AI-generated questions or None if an error occurs
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

        # Create a prompt for question generation
        prompt = f"""
        I'm going to provide you with the content of a PDF document.
        Please generate {count} insightful questions that could be asked about this document.
        The questions should cover key concepts and important information in the document.
        Format the response as a numbered list of questions.

        PDF CONTENT:
        {pdf_text}

        QUESTIONS:
        """

        response = model.generate_content(prompt)

        # Parse the response to extract the questions
        questions_text = response.text.strip()
        questions = []

        # Simple parsing of numbered list (1. Question 1, 2. Question 2, etc.)
        for line in questions_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or (len(line) > 2 and line[0:2].isdigit())):
                # Remove the number and period at the beginning
                question = line.split('.', 1)[-1].strip()
                questions.append(question)

        # If parsing failed or returned no questions, return the raw text
        if not questions:
            return [questions_text]

        return questions[:count]  # Limit to requested count
    except Exception as e:
        logger.error(f"Error in generate questions: {e}")
        return None
