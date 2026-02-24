from datetime import datetime, timezone
from sqlalchemy import UniqueConstraint
from werkzeug.security import generate_password_hash, check_password_hash
from .__init__ import db

#User Authentication Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='employee')  # 'owner' or 'employee'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = db.Column(db.Boolean, default=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }

class AuthSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    user = db.relationship('User', backref=db.backref('auth_sessions', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active
        }

#Menu
class PublicMenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    volume = db.Column(db.String(20))
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'name': self.name,
            'volume': self.volume,
            'price': self.price
        }

#Položka na skladě
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    unit_type = db.Column(db.String(20), nullable=False)
    current_stock = db.Column(db.Float, default=0.0)
    selling_price = db.Column(db.Float, default=0.0)

    __mapper_args__ = {
        'polymorphic_on': unit_type,
        'polymorphic_identity': 'kusy'
    }
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'unit_type': self.unit_type,
            'current_stock': self.current_stock,
            'selling_price': self.selling_price
        }
    
class LiquidItem(Item):
    full_bottle_weight = db.Column(db.Float, nullable=True)
    empty_bottle_weight = db.Column(db.Float, nullable=True)
    shot_weight = db.Column(db.Float, nullable=True)
    shot_volume = db.Column(db.Float, nullable=True)
    current_weight = db.Column(db.Float, default=0.0)

    __mapper_args__ = {
        'polymorphic_identity': 'litry'
    }

    def to_dict(self):
        data = super().to_dict()
        data.update({
            'full_bottle_weight': self.full_bottle_weight,
            'empty_bottle_weight': self.empty_bottle_weight,
            'shot_weight': self.shot_weight,
            'shot_volume': self.shot_volume,
            'current_weight': self.current_weight
        })
        return data


#Záznam inventury
class InventorySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='DRAFT') 
    starter_client_id = db.Column(db.String(50), nullable=True) 
    
    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'starter_client_id': self.starter_client_id
        }

#Dočasný záznam při inventuře
class InventoryEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id', ondelete='CASCADE'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('inventory_session.id'), nullable=False)

    counted_quantity = db.Column(db.Float, default=0.0)
    counted_weight = db.Column(db.Float, nullable=True)

    original_stock = db.Column(db.Float, default=0.0) 
    original_weight = db.Column(db.Float, default=0.0)

    last_updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                                onupdate=lambda: datetime.now(timezone.utc))
    last_updated_by_client_id = db.Column(db.String(50), nullable=True) 

    item = db.relationship('Item', backref=db.backref('entries', cascade='all, delete-orphan', lazy=True))
    session = db.relationship('InventorySession', backref=db.backref('entries', lazy=True))

    __table_args__ = (UniqueConstraint('session_id', 'item_id', name='_session_item_uc'),)
    
    def to_dict(self):
        item_data = self.item.to_dict()
        
        # 1. Rozdíl v celých jednotkách (litry nebo kusy)
        diff_qty = self.original_stock - self.counted_quantity
        
        # 2. Výpočet rozdílu z váhy (pouze pro litry)
        weight_diff_qty = 0.0
        if item_data['unit_type'] == 'litry' and self.counted_weight is not None and self.original_weight is not None:
            grams_diff = self.original_weight - self.counted_weight
            shot_w = item_data.get('shot_weight', 0)
            shot_v = item_data.get('shot_volume', 0)
            
            if shot_w > 0:
                # Přepočet gramů na litry
                weight_diff_qty = (grams_diff / shot_w) * shot_v

        # 3. Celkový součet
        total_diff_qty = diff_qty + weight_diff_qty
        
        # 4. Finanční vyjádření 
        # Předpokládáme, že selling_price je cena za 1 jednotku (1ks nebo 1l)
        # Pokud je cena za panák, musíš total_diff_qty nejdřív vydělit shot_volume
        if item_data['unit_type'] == 'litry' and item_data.get('shot_volume', 0) > 0:
            difference_value = total_diff_qty / item_data['shot_volume'] * item_data['selling_price']
        else:
            difference_value = total_diff_qty  * item_data['selling_price']

        return {
            'id': self.id,
            'item_id': self.item_id,
            'item_name': item_data['name'],
            'unit_type': item_data['unit_type'],
            'selling_price': item_data['selling_price'], # Dobré posílat pro kontrolu
            'session_id': self.session_id,
            'counted_quantity': self.counted_quantity,
            'original_stock': self.original_stock,
            'counted_weight': self.counted_weight,
            'original_weight': self.original_weight,
            'difference_quantity': total_diff_qty,
            'difference_value': difference_value,
            'last_updated_at': self.last_updated_at.isoformat() if self.last_updated_at else None,
            'last_updated_by_client_id': self.last_updated_by_client_id,
        }
    
