from flask import Blueprint, jsonify, request
from .__init__ import db, socketio
from .models import Item, InventorySession, InventoryEntry, PublicMenuItem
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

api_bp = Blueprint('api', __name__)

# Do api.py
@api_bp.route('/public-menu', methods=['GET'])
def get_menu():
    items = PublicMenuItem.query.all()
    return jsonify([i.to_dict() for i in items])

@api_bp.route('/public-menu', methods=['POST'])
def add_menu_item():
    data = request.json
    new_item = PublicMenuItem(
        category=data['category'],
        name=data['name'],
        volume=data.get('volume', ''),
        price=data['price']
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@api_bp.route('/public-menu/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    item = PublicMenuItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

##############################
#
#    ITEM HANDLING ROUTES      
#
##############################

@api_bp.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'message': f'Položka s ID {item_id} nebyla nalezena.'}), 404
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': f'Položka {item.name} byla úspěšně smazána.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Chyba při mazání položky: {str(e)}'}), 500

@api_bp.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = db.session.get(Item, item_id) # Modernější způsob než Item.query.get
    if not item:
        return jsonify({'message': 'Položka nenalezena.'}), 404

    data = request.json
    try:
        if 'name' in data: item.name = data['name']
        if 'unit_type' in data: item.unit_type = data['unit_type']
        if 'selling_price' in data: item.selling_price = float(data['selling_price'])
        # TATO ČÁST CHYBĚLA:
        if 'current_stock' in data: item.current_stock = float(data['current_stock'])

        db.session.commit()
        return jsonify(item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Chyba: {str(e)}'}), 500

@api_bp.route('/items', methods=['POST'])
def add_item():
    data = request.json
    name = data.get('name')
    unit_type = data.get('unit_type') 
    selling_price = data.get('selling_price', 0.0)
    
    if not name or not unit_type:
        return jsonify({'message': 'Chybí jméno nebo typ jednotky (unit_type)'}), 400
    
    try:
        new_item = Item(name=name, unit_type=unit_type, selling_price=float(selling_price), current_stock=0.0)
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    except IntegrityError:
        return jsonify({'message': f'Položka {name} již existuje.'}), 409
    except ValueError:
        return jsonify({'message': 'Chybný formát prodejní ceny.'}), 400


@api_bp.route('/items', methods=['GET'])
def get_all_items():
    items = Item.query.all()
    return jsonify([item.to_dict() for item in items]), 200

@api_bp.route('/stock', methods=['GET'])
def get_current_stock():
    
    items = Item.query.all()
    
    stock_list = []
    for item in items:
        stock_list.append({
            'id': item.id,
            'name': item.name,
            'unit_type': item.unit_type,
            'current_stock': item.current_stock,
            'selling_price': item.selling_price,
        })
        
    return jsonify({'stock': stock_list}), 200

##############################
#
#     INVENTURNI ROUTES      
#
##############################

@api_bp.route('/inventory/start', methods=['POST'])
def start_inventory():
    data = request.json
    client_id = data.get('client_id') 

    if InventorySession.query.filter_by(status='DRAFT').first():
        return jsonify({'message': 'Inventura již probíhá. Ukončete ji nejdříve.'}), 409
    
    new_session = InventorySession(starter_client_id=client_id, status='DRAFT')
    db.session.add(new_session)
    db.session.commit()

    all_items = Item.query.all()
    entries_list = []
    
    for item in all_items:
        # Vytvoření dočasného záznamu s původní hodnotou
        entry = InventoryEntry(
            session_id=new_session.id,
            item_id=item.id,
            counted_quantity=item.current_stock, 
            original_stock=item.current_stock,
            last_updated_by_client_id=client_id
        )
        db.session.add(entry)

    db.session.commit()
    
    entries = InventoryEntry.query.filter_by(session_id=new_session.id).all()
    entries_list = [entry.to_dict() for entry in entries]

    #Oznámení přes WebSocket (všem klientům)
    socketio.emit('inventory_status_change', {
        'status': 'started', 
        'session_id': new_session.id
    })

    return jsonify({
        'session': new_session.to_dict(), 
        'entries': entries_list
    }), 201

@api_bp.route('/inventory/finish/<int:session_id>', methods=['POST'])
def finish_inventory(session_id):
    session = InventorySession.query.get_or_404(session_id)
    
    if session.status != 'DRAFT':
        return jsonify({'message': 'Sezení již není v draftu.'}), 400


    entries = InventoryEntry.query.filter_by(session_id=session_id).all()
    
    for entry in entries:
        item = Item.query.get(entry.item_id)
        if item:
            item.current_stock = entry.counted_quantity 

    session.status = 'COMPLETED'
    session.end_time = datetime.now(timezone.utc)
    
    db.session.commit()

    #Websocket oznámení
    socketio.emit('inventory_status_change', {
        'status': 'finished', 
        'session_id': session.id
    })

    return jsonify({'message': f'Inventura {session_id} dokončena a stavy aktualizovány.'})

# Zjistí aktuální stav session
@api_bp.route('/inventory/current', methods=['GET'])
def get_current_inventory():
    session = InventorySession.query.filter_by(status='DRAFT').first()
    
    if not session:
        return jsonify({'session': None, 'is_running': False}), 200

    entries = InventoryEntry.query.filter_by(session_id=session.id).all()
    
    inventory_data = []
    for entry in entries:
        item = Item.query.get(entry.item_id)
        data = entry.to_dict()
        data['item_name'] = item.name
        data['unit_type'] = item.unit_type
        data['selling_price'] = item.selling_price
        data['difference_quantity'] = entry.counted_quantity - entry.original_stock
        data['difference_value'] = data['difference_quantity'] * item.selling_price
        
        inventory_data.append(data)

    return jsonify({
        'session': session.to_dict(), 
        'is_running': True,
        'entries': inventory_data
    })