from .__init__ import create_app, socketio

# Vytvoření aplikace
app = create_app()

if __name__ == '__main__':
    print("Flask SocketIO Server spuštěn na http://127.0.0.1:5000")
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)