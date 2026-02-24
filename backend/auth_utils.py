import jwt
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from .models import User, AuthSession
from flask import current_app
import os

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
TOKEN_EXPIRATION_HOURS = 24

def generate_jwt_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def create_auth_session(user_id):
    """Create auth session record"""
    from . import db
    
    try:
        token = generate_jwt_token(user_id)
        token_hash = generate_password_hash(token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRATION_HOURS)
        
        print(f"Creating auth session for user_id: {user_id}")
        print(f"Current app: {current_app}")
        
        # Deactivate old sessions for this user
        AuthSession.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
        
        # Create new session
        auth_session = AuthSession(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.session.add(auth_session)
        db.session.commit()
        
        print(f"Auth session created successfully")
        return token, auth_session
    except Exception as e:
        print(f"Error creating auth session: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        raise

def authenticate_user(username, password):
    """Authenticate user with username and password"""
    from . import db
    
    user = User.query.filter_by(username=username, is_active=True).first()
    if user and user.check_password(password):
        return user
    return None

def get_user_from_token(token):
    """Get user from JWT token"""
    from . import db
    
    user_id = verify_jwt_token(token)
    if user_id:
        return User.query.get(user_id)
    return None

def invalidate_user_sessions(user_id):
    """Invalidate all sessions for a user"""
    from . import db
    
    AuthSession.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
    db.session.commit()

def cleanup_expired_sessions():
    """Clean up expired auth sessions"""
    from . import db
    
    expired_sessions = AuthSession.query.filter(
        AuthSession.expires_at < datetime.now(timezone.utc)
    ).all()
    
    for session in expired_sessions:
        session.is_active = False
    
    db.session.commit()
