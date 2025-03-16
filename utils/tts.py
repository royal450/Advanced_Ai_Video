import os
import asyncio
import edge_tts
import uuid
import logging

logger = logging.getLogger(__name__)

async def generate_speech_async(text, voice="en-US-AriaNeural"):
    """
    Generate speech from text using Edge TTS
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs("static/audio", exist_ok=True)
        
        # Generate unique filename
        filename = f"speech_{uuid.uuid4()}.mp3"
        output_path = os.path.join("static/audio", filename)
        
        # Configure Edge TTS
        communicate = edge_tts.Communicate(text, voice)
        
        # Generate speech
        await communicate.save(output_path)
        
        return output_path
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        raise

def generate_speech(text, voice="en-US-AriaNeural"):
    """
    Synchronous wrapper for the async speech generation function
    """
    return asyncio.run(generate_speech_async(text, voice))

def list_available_voices():
    """
    List all available voices from Edge TTS
    """
    try:
        voices = asyncio.run(edge_tts.list_voices())
        return voices
    except Exception as e:
        logger.error(f"Error listing voices: {e}")
        raise
