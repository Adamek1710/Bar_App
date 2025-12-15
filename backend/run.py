from .__init__ import create_app, socketio

# Vytvoření aplikace
app = create_app()

if __name__ == '__main__':
    # Spustíme SocketIO server
    print("Flask SocketIO Server spuštěn na http://127.0.0.1:5000")
    socketio.run(app, debug=True)