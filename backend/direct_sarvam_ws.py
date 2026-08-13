import asyncio
import websockets
import sys
import json
import os
from dotenv import load_dotenv

load_dotenv()

async def test_sarvam(audio_path):
    api_key = os.environ.get("SARVAM_API_KEY")
    uri = "wss://api.sarvam.ai/speech-to-text/ws?language_code=hi-IN&model=saaras:v3"
    
    try:
        async with websockets.connect(
            uri,
            additional_headers={"api-subscription-key": api_key}
        ) as websocket:
            print("Connected to Sarvam Legacy API")
            
            async def listen():
                try:
                    while True:
                        msg = await websocket.recv()
                        print(f"[Sarvam]: {msg}")
                except websockets.exceptions.ConnectionClosed as e:
                    print(f"ConnectionClosed: {e}")
            
            listener_task = asyncio.create_task(listen())
            
            import base64
            print(f"Reading {audio_path}...")
            with open(audio_path, "rb") as f:
                while True:
                    chunk = f.read(4096)
                    if not chunk:
                        break
                    
                    b64_chunk = base64.b64encode(chunk).decode('utf-8')
                    payload = json.dumps({
                        "audio": {
                            "data": b64_chunk,
                            "sample_rate": "16000",
                            "encoding": "audio/wav"
                        }
                    })
                    await websocket.send(payload)
                    await asyncio.sleep(0.05)
            
            print("Finished sending audio. Waiting for final transcript...")
            await asyncio.sleep(3)
            await websocket.close()
            await listener_task
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python direct_sarvam_ws.py <wav_file>")
        sys.exit(1)
    asyncio.run(test_sarvam(sys.argv[1]))
