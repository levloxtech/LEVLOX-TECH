from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Import Config and Database manager - refreshed config with CORS wildcard
from config import Config
from utils.db import mongo_db

# Import Route Blueprints
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.leads import leads_bp
from routes.workshops import workshops_bp
from routes.contacts import contacts_bp
from routes.tasks import tasks_bp
from routes.courses import courses_bp
from routes.careers import careers_bp
from routes.admin import admin_bp
from routes.certificates import certificates_bp
from routes.results import results_bp

def create_app():
    """Application factory function."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    allowed_origins = [
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://127.0.0.1:5176"
    ]
    CORS(app, resources={
        r"/api/*":                      {"origins": allowed_origins},
        r"/api/certificates/verify/*":  {"origins": "*"},  # Public — no restriction
    }, supports_credentials=True)
    
    # Initialize JWT Manager
    jwt = JWTManager(app)
    
    # Initialize MongoDB Connection
    mongo_db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(workshops_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(careers_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(certificates_bp)
    app.register_blueprint(results_bp)
    
    # Test route: GET /
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "status": "success",
            "message": "Levlox CRM Backend Running"
        }), 200

    # General Error Handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "status": "error",
            "message": "Resource not found"
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": "Internal server error"
        }), 500

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
