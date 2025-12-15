import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from . import config

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()

def create_app(config_object=config.Config):
    app = Flask(__name__)

    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, cors_allowed_origins="*")

    from . import models 

    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    from . import socket_events
    
    return app