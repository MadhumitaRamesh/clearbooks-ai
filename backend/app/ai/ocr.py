"""
ocr_image(image_bytes: bytes) -> str

Uses Gemini 2.0 Flash to extract raw text from a photo of a
handwritten/printed shop record (replacing Google Cloud Vision to avoid GCP billing issues).

Env vars required:
  GEMINI_API_KEY
"""

import os
import sys

import google.generativeai as genai

MODEL_NAME = "gemini-2.5-flash"

def ocr_image(image_bytes: bytes) -> str:
    """Extract raw text from image bytes using Gemini 2.0 Flash."""
    if not image_bytes:
        return ""

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL_NAME)
    
    prompt = "Extract all text from this image exactly as written. Do not summarize or format. Just output the raw text."
    
    response = model.generate_content([
        prompt,
        {"mime_type": "image/jpeg", "data": image_bytes}
    ])
    
    return response.text.strip()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ocr.py <path-to-image-file>")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        img_bytes = f.read()

    text = ocr_image(img_bytes)
    print("Extracted raw text:\n")
    print(text)
