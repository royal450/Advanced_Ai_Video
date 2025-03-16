#!/usr/bin/env python
"""
Run server with direct SocketIO implementation
"""
from app import app, socketio

if __name__ == "__main__":
    print("Starting SocketIO server...")
    socketio.run(
        app, 
        host="0.0.0.0", 
        port=5000, 
        debug=True, 
        allow_unsafe_werkzeug=True,
        log_output=True
    )