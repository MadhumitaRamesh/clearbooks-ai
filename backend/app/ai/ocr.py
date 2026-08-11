"""
ocr_image(image_bytes: bytes) -> str

Uses Google Cloud Vision API to extract raw text from a photo of a
handwritten/printed shop record.

Env vars required:
  GOOGLE_APPLICATION_CREDENTIALS  (path to a service-account JSON key file)
"""

import os
import sys

from google.cloud import vision


def _get_client() -> vision.ImageAnnotatorClient:
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set "
            "(should point to a service-account JSON key file)"
        )
    return vision.ImageAnnotatorClient()


def ocr_image(image_bytes: bytes) -> str:
    """Extract raw text from image bytes using Google Cloud Vision's
    document text detection (better than plain text_detection for
    dense handwritten/printed receipts and ledger pages)."""
    if not image_bytes:
        return ""

    client = _get_client()
    image = vision.Image(content=image_bytes)

    response = client.document_text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Google Vision API error: {response.error.message}")

    return response.full_text_annotation.text.strip()


if __name__ == "__main__":
    # Test with a sample image file: python ocr.py path/to/sample.jpg
    if len(sys.argv) < 2:
        print("Usage: python ocr.py <path-to-image-file>")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        img_bytes = f.read()

    text = ocr_image(img_bytes)
    print("Extracted raw text:\n")
    print(text)
