"""
transcribe_audio(audio_bytes: bytes) -> str

Uses Sarvam AI's Speech-to-Text REST API to transcribe a voice note (owner
describing sales) into text. Uses the saaras:v3 model with mode="transcribe",
which handles Indian languages and code-mixed Hinglish speech.

API docs: https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe
Note: REST endpoint is synchronous and meant for audio under ~30s. For longer
voice notes, switch to Sarvam's Batch API (same auth, different endpoint).

Env vars required:
  SARVAM_API_KEY
"""

import os
import sys
import io

import requests

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.m4a", mime_type: str = "audio/m4a") -> str:
    """Transcribe audio bytes to text using Sarvam AI (saaras:v3, transcribe mode).

    `filename` just needs a recognizable extension (wav/mp3/m4a/ogg/etc.) so
    Sarvam can infer the content type — it doesn't need to be a real path.
    """
    if not audio_bytes:
        return ""

    api_key = os.environ.get("SARVAM_API_KEY")
    if not api_key:
        raise RuntimeError("SARVAM_API_KEY environment variable is not set")

    headers = {"api-subscription-key": api_key}
    files = {"file": (filename, io.BytesIO(audio_bytes), mime_type)}
    data = {
        "model": "saaras:v3",
        "mode": "transcribe",       # plain transcription (not translate/verbatim/translit)
        "language_code": "unknown",  # auto-detect; handles Hinglish/code-mixed speech
    }

    response = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=60)

    if response.status_code != 200:
        raise RuntimeError(f"Sarvam STT API error {response.status_code}: {response.text}")

    result = response.json()
    return (result.get("transcript") or "").strip()


if __name__ == "__main__":
    # Test with a sample audio file: python speech.py path/to/sample.wav
    if len(sys.argv) < 2:
        print("Usage: python speech.py <path-to-audio-file>")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "rb") as f:
        audio = f.read()

    transcript = transcribe_audio(audio, filename=os.path.basename(path))
    print("Transcript:\n")
    print(transcript)
