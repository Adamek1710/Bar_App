#!/usr/bin/env python3
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.__init__ import create_app, socketio

# Vytvoření aplikace
app = create_app()

if __name__ == '__main__':
    print("Flask SocketIO Server spuštěn na http://127.0.0.1:5000")
    socketio.run(app, host='127.0.0.1', port=5000, debug=False)
