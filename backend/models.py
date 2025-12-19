# backend/models.py

from datetime import datetime, timezone
from sqlalchemy import UniqueConstraint
from .__init__ import db

#Položka na skladě
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    unit_type = db.Column(db.String(20), nullable=False)
    current_stock = db.Column(db.Float, default=0.0)
    selling_price = db.Column(db.Float, default=0.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'unit_type': self.unit_type,
            'current_stock': self.current_stock,
            'selling_price': self.selling_price
        }

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
    original_stock = db.Column(db.Float, default=0.0) 
    last_updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                                onupdate=lambda: datetime.now(timezone.utc))
    last_updated_by_client_id = db.Column(db.String(50), nullable=True) 

    item = db.relationship('Item', backref=db.backref('entries', cascade='all, delete-orphan', lazy=True))
    session = db.relationship('InventorySession', backref=db.backref('entries', lazy=True))

    __table_args__ = (UniqueConstraint('session_id', 'item_id', name='_session_item_uc'),)
    
    def to_dict(self):
        updated_at_str = self.last_updated_at.isoformat() if self.last_updated_at else None

        item_data = self.item.to_dict()
        
        difference_quantity = self.original_stock - self.counted_quantity
        difference_value = difference_quantity * item_data['selling_price']

        return {
            'id': self.id,
            'item_id': self.item_id,
            'session_id': self.session_id,
            'counted_quantity': self.counted_quantity,
            'original_stock': self.original_stock,
            'last_updated_by_client_id': self.last_updated_by_client_id,
            'last_updated_at': updated_at_str,
            'item_name': item_data['name'], 
            'unit_type': item_data['unit_type'],
            'selling_price': item_data['selling_price'],
            'difference_quantity': difference_quantity,
            'difference_value': difference_value,
        }