"""
Run server with Eventlet for WebSocket support
"""
import eventlet
eventlet.monkey_patch()

from app import app, socketio

if __name__ == "__main__":
    # Run the application with eventlet
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)