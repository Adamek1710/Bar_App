from flask import Blueprint, jsonify, request, send_file
import pandas as pd
from .__init__ import db, socketio
from .models import Item, LiquidItem, InventorySession, InventoryEntry, PublicMenuItem
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from io import BytesIO
import traceback

api_bp = Blueprint('api', __name__)

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
        api_bp.logger.error(traceback.format_exc())
        return "An internal error occured.", 500

@api_bp.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = db.session.get(Item, item_id)
    if not item:
        return jsonify({'message': 'Položka nenalezena.'}), 404

    data = request.json
    try:
        if 'name' in data: item.name = data['name']
        if 'unit_type' in data: item.unit_type = data['unit_type']
        if 'selling_price' in data: item.selling_price = float(data['selling_price'])
        if 'current_stock' in data: item.current_stock = float(data['current_stock'])

        if isinstance(item, LiquidItem):
            if 'full_bottle_weight' in data: item.full_bottle_weight = float(data['full_bottle_weight'])
            if 'empty_bottle_weight' in data: item.empty_bottle_weight = float(data['empty_bottle_weight'])
            if 'shot_weight' in data: item.shot_weight = float(data['shot_weight'])
            if 'shot_volume' in data: item.shot_volume = float(data['shot_volume'])
            if 'current_weight' in data: item.current_weight = float(data['current_weight'])

        db.session.commit()
        return jsonify(item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        api_bp.logger.error(traceback.format_exc())
        return "An internal error occured.", 500

@api_bp.route('/items', methods=['POST'])
def add_item():
    data = request.json
    try:
        if data.get('unit_type') == 'litry':
            new_item = LiquidItem(
                name=data['name'],
                unit_type='litry',
                selling_price=float(data.get('selling_price', 0)),
                full_bottle_weight=float(data.get('full_bottle_weight', 0)),
                empty_bottle_weight=float(data.get('empty_bottle_weight', 0)),
                shot_weight=float(data.get('shot_weight', 0)),
                shot_volume=float(data.get('shot_volume', 0)),
                current_weight=float(data.get('full_bottle_weight', 0)) 
            )
        else:
            new_item = Item(
                name=data['name'],
                unit_type='kusy',
                selling_price=float(data.get('selling_price', 0))
            )
        
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        api_bp.logger.error(traceback.format_exc())
        return "An internal error occured.", 400


@api_bp.route('/items', methods=['GET'])
def get_all_items():
    items = Item.query.all()
    return jsonify([item.to_dict() for item in items]), 200

@api_bp.route('/stock', methods=['GET'])
def get_current_stock():
    items = Item.query.all()
    return jsonify({'stock': [item.to_dict() for item in items]}), 200

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
    
    for item in all_items:
        entry = InventoryEntry(
        session_id=new_session.id,
        item_id=item.id,
        original_stock=item.current_stock,
        original_weight=item.current_weight if hasattr(item, 'current_weight') else 0,
        counted_quantity=item.current_stock,
        counted_weight=item.current_weight if hasattr(item, 'current_weight') else 0,
        last_updated_by_client_id=client_id
        )
        db.session.add(entry)

    db.session.commit()
    
    entries = InventoryEntry.query.filter_by(session_id=new_session.id).all()
    entries_list = [entry.to_dict() for entry in entries]

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
    entries = InventoryEntry.query.filter_by(session_id=session_id).all()
    
    for entry in entries:
        item = Item.query.get(entry.item_id)
        if item:
            item.current_stock = entry.counted_quantity
            
            if isinstance(item, LiquidItem):
                item.current_weight = entry.counted_weight

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
    
    inventory_data = [entry.to_dict() for entry in entries]

    return jsonify({
        'session': session.to_dict(), 
        'is_running': True,
        'entries': inventory_data
    })

@api_bp.route('/inventory/upload', methods=['POST'])
def upload_inventory():
    if 'file' not in request.files:
        return "No file", 400
    
    file = request.files['file']
    
    try:
        df = pd.read_excel(file, header=0)

        df = df.iloc[:, [0, 1, 4]] 
        df.columns = ['name', 'stock', 'price']

        items_processed = 0
        for _, row in df.iterrows():
            name = str(row['name']).strip()
            stock = float(row['stock']) if pd.notnull(row['stock']) else 0.0
            price = float(row['price']) if pd.notnull(row['price']) else 0.0

            if name and name != 'nan':
                upsert_item_in_db(name, stock, price)
                items_processed += 1

        return jsonify({"status": "success", "processed": items_processed}), 200

    except Exception as e:
        api_bp.logger.error(traceback.format_exc())
        return "Internal error with import", 500

def upsert_item_in_db(name, stock, price):
    existing = Item.query.filter_by(name=name).first()
    if existing:
        existing.current_stock = stock
        existing.selling_price = price
    else:
        new_item = Item(name=name, current_stock=stock, selling_price=price, unit_type='litry')
        db.session.add(new_item)
    db.session.commit()

@api_bp.route('/inventory/export', methods=['GET'])
def export_inventory():
    try:
        items = Item.query.all()
        
        # 2. Převedení na seznam slovníků
        data = []
        for i in items:
            data.append({
                'Název': i.name,
                'Sklad (l/ks)': i.current_stock,
                'Jednotka': i.unit_type,
                'Prodejní cena (Kč)': i.selling_price
            })
        
        # 3. Vytvoření Excelu přes Pandas
        df = pd.DataFrame(data)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Aktuální sklad')
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='sklad_export.xlsx'
        )
    except Exception as e:
        api_bp.logger(traceback.format_exc())
        return "An Internal error occured!", 500