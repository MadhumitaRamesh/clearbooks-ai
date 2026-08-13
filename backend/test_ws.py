import asyncio
import websockets
import sys
import json

async def test_stream(audio_path):
    uri = "ws://localhost:8000/api/v1/records/audio/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Background task to listen for Sarvam's JSON responses
            async def listen():
                try:
                    while True:
                        msg = await websocket.recv()
                        print(f"[Sarvam]: {msg}")
                except websockets.exceptions.ConnectionClosed:
                    print("[Proxy closed the connection]")
            
            listener_task = asyncio.create_task(listen())
            
            print(f"Reading {audio_path}...")
            with open(audio_path, "rb") as f:
                # Read chunks of 4096 bytes and stream them with a tiny delay
                while True:
                    chunk = f.read(4096)
                    if not chunk:
                        break
                    await websocket.send(chunk)
                    await asyncio.sleep(0.05) # Simulate real-time streaming
            
            print("Finished sending audio. Waiting for final transcript...")
            await asyncio.sleep(3)
            
            # Close the websocket nicely
            await websocket.close()
            await listener_task
            
    except Exception as e:
        print(f"Client Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_ws.py <wav_file>")
        sys.exit(1)
    asyncio.run(test_stream(sys.argv[1]))
