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
    client_id = data.get('client_id')
    
    if not all([entry_id, counted_quantity, client_id]): 
        emit('error', {'message': 'Neúplná data pro submit_count (chybí entry_id).'}, room=request.sid)
        return

    entry = InventoryEntry.query.get(entry_id) 

    if entry:
        try:
            entry.counted_quantity = float(counted_quantity)
            entry.last_updated_by_client_id = client_id
            entry.last_updated_at = datetime.now(timezone.utc)
            db.session.commit()
            
            updated_entry_data = entry.to_dict()
            emit('entry_updated', updated_entry_data, broadcast=True)
            
        except ValueError:
            db.session.rollback()
            emit('error', {'message': 'Neplatný formát množství.'}, room=request.sid)
        except Exception as e:
            db.session.rollback()
            emit('error', {'message': f'Došlo k chybě DB: {str(e)}'}, room=request.sid)
    else:
        emit('error', {'message': f'Záznam inventury s ID {entry_id} nebyl nalezen.'}, room=request.sid)