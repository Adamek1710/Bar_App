from .__init__ import socketio, db
from .models import InventoryEntry, User
from datetime import datetime, timezone
from flask import request
from flask_socketio import emit, disconnect
import jwt

#Připojení uživatele
@socketio.on('connect')
def handle_connect():
    # Check for authentication token in query string or headers
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif 'token' in request.args:
        token = request.args['token']
    
    if not token:
        print(f"Neautentizovaný pokus o připojení: {request.sid}")
        disconnect()
        return
    
    try:
        payload = jwt.decode(token, 'your-secret-key-change-in-production', algorithms=['HS256'])
        user_id = payload['user_id']
        user = User.query.get(user_id)
        if not user:
            print(f"Uživatel nenalezen pro připojení: {request.sid}")
            disconnect()
            return
        
        # Store user info in session
        request.current_user = user
        print(f"Uživatel {user.username} se připojil: {request.sid}")
    except jwt.ExpiredSignatureError:
        print(f"Platnost tokenu vypršela pro připojení: {request.sid}")
        disconnect()
        return
    except jwt.InvalidTokenError:
        print(f"Neplatný token pro připojení: {request.sid}")
        disconnect()
        return

#Zadání čísla
@socketio.on('entry_updated')
def handle_submit_count(data):
    entry_id = data.get('entry_id')
    counted_quantity = data.get('counted_quantity')
    counted_weight = data.get('counted_weight')
    client_id = data.get('client_id')
    
    entry = InventoryEntry.query.get(entry_id) 

    if entry:
        try:
            if counted_quantity is not None:
                entry.counted_quantity = float(counted_quantity)
            
            if counted_weight is not None:
                entry.counted_weight = float(counted_weight) 
                
            entry.last_updated_by_client_id = client_id
            entry.last_updated_at = datetime.now(timezone.utc)
            db.session.commit()
            
            emit('entry_updated', entry.to_dict(), broadcast=True)
            
        except Exception as e:
            db.session.rollback()
            emit('error', {'message': str(e)}, room=request.sid)