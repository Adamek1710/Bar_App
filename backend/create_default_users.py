#!/usr/bin/env python3
"""
Script to create default users for the bar application
"""

import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.__init__ import create_app, db
from backend.models import User

def create_default_users():
    """Create default owner and employee users"""
    app = create_app()
    
    with app.app_context():
        # Check if users already exist
        if User.query.filter_by(username='owner').first():
            print("Owner user already exists")
        else:
            owner = User(username='owner', role='owner')
            owner.set_password('owner123')
            db.session.add(owner)
            print("Created owner user (username: owner, password: owner123)")
        
        if User.query.filter_by(username='employee').first():
            print("Employee user already exists")
        else:
            employee = User(username='employee', role='employee')
            employee.set_password('emp123')
            db.session.add(employee)
            print("Created employee user (username: employee, password: emp123)")
        
        db.session.commit()
        print("Default users created successfully!")

if __name__ == '__main__':
    create_default_users()
