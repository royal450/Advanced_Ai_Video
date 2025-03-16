import os
import logging
# Configure eventlet for WebSocket support
import eventlet
eventlet.monkey_patch()
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
from utils.tts import generate_speech
from utils.lip_sync import generate_lip_sync
from utils.video_processor import process_video

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/avatar')
def avatar_selection():
    return render_template('avatar.html')

# API endpoints
@app.route('/api/avatars', methods=['GET'])
def get_avatars():
    try:
        with open('static/avatars/avatar-data.json', 'r') as f:
            avatars = json.load(f)
        return jsonify(avatars)
    except Exception as e:
        logger.error(f"Error loading avatars: {e}")
        return jsonify({"error": "Failed to load avatars"}), 500

@app.route('/api/generate-speech', methods=['POST'])
def tts_endpoint():
    try:
        data = request.json
        text = data.get('text', '')
        voice = data.get('voice', 'en-US-AriaNeural')
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        # Generate speech using Edge TTS
        audio_path = generate_speech(text, voice)
        
        return jsonify({
            "success": True,
            "audio_path": audio_path
        })
    except Exception as e:
        logger.error(f"TTS error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-video', methods=['POST'])
def generate_video_endpoint():
    try:
        data = request.json
        text = data.get('text', '')
        avatar_id = data.get('avatar_id', '')
        voice = data.get('voice', 'en-US-AriaNeural')
        
        if not text or not avatar_id:
            return jsonify({"error": "Text and avatar ID are required"}), 400
        
        # Emit starting event via SocketIO
        socketio.emit('processing_update', {'status': 'started', 'message': 'Starting video generation'})
        
        # 1. Generate speech
        socketio.emit('processing_update', {'status': 'in_progress', 'message': 'Generating speech', 'progress': 25})
        audio_path = generate_speech(text, voice)
        
        # 2. Generate lip sync
        socketio.emit('processing_update', {'status': 'in_progress', 'message': 'Synchronizing lips', 'progress': 50})
        lip_sync_result = generate_lip_sync(audio_path, avatar_id)
        
        # 3. Process final video
        socketio.emit('processing_update', {'status': 'in_progress', 'message': 'Finalizing video', 'progress': 75})
        video_path = process_video(lip_sync_result, avatar_id)
        
        # 4. Complete
        socketio.emit('processing_update', {'status': 'completed', 'message': 'Video ready', 'progress': 100, 'video_path': video_path})
        
        return jsonify({
            "success": True,
            "video_path": video_path
        })
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        socketio.emit('processing_update', {'status': 'error', 'message': f'Error: {str(e)}'})
        return jsonify({"error": str(e)}), 500

# SocketIO events
@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")
    emit('connection_response', {'data': 'Connected'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

@socketio.on('preview_request')
def handle_preview_request(data):
    try:
        text = data.get('text', '')
        avatar_id = data.get('avatar_id', '')
        voice = data.get('voice', 'en-US-AriaNeural')
        
        if not text or not avatar_id:
            emit('preview_update', {
                'status': 'error',
                'message': 'Text and avatar ID are required'
            })
            return
        
        # Start processing the preview
        emit('preview_update', {
            'status': 'in_progress',
            'message': 'Generating speech...'
        })
        
        # 1. Generate speech (use shorter version of the text for preview)
        preview_text = text[:100] + ('...' if len(text) > 100 else '')
        audio_path = generate_speech(preview_text, voice)
        
        emit('preview_update', {
            'status': 'in_progress',
            'message': 'Creating preview animation...',
            'progress': 50
        })
        
        # 2. Generate a simplified lip sync for preview
        # This could be a shorter or lower-quality version for faster preview
        lip_sync_path = generate_lip_sync(audio_path, avatar_id)
        
        # 3. Send the completed preview update
        emit('preview_update', {
            'status': 'completed',
            'message': 'Preview ready',
            'preview_data': {
                'avatar_id': avatar_id,
                'text': preview_text,
                'preview_url': lip_sync_path
            }
        })
        
    except Exception as e:
        logger.error(f"Preview generation error: {e}")
        emit('preview_update', {
            'status': 'error',
            'message': f'Error generating preview: {str(e)}'
        })

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=True, log_output=True)
