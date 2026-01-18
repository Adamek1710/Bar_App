from .__init__ import socketio, db
from .models import InventoryEntry
from datetime import datetime, timezone
from flask import request
from flask_socketio import emit

#Připojení uživatele
@socketio.on('connect')
def handle_connect():
    print(f"Klient se připojil: {request.sid}")

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