from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import atexit

# Import Config, Database manager, and centralized logger
from config import Config
from utils.db import mongo_db
from utils.logger import logger

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
from routes.upload_settings import upload_settings_bp

def create_app():
    """Application factory function."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    logger.info("Starting Levlox CRM Application factory...")
    
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
            "expose_headers": ["Content-Range", "Accept-Ranges", "Content-Disposition", "Content-Length"]
        },
        r"/api/certificates/verify/*": {
            "origins": "*",
            "methods": ["GET", "OPTIONS"],
            "allow_headers": ["Content-Type", "Accept"]
        }
    }, supports_credentials=True)
    
    # Initialize JWT Manager
    jwt = JWTManager(app)
    
    # JWT validation custom loggers and responses
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        logger.warning(f"JWT Verification Failed: Unauthorized request to {request.path}. Detail: {callback}")
        return jsonify({"status": "error", "message": "Missing Authorization Header"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        logger.warning(f"JWT Verification Failed: Invalid token provided to {request.path}. Detail: {callback}")
        return jsonify({"status": "error", "message": "Signature verification failed"}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        user_identity = jwt_payload.get("sub", "unknown")
        logger.warning(f"JWT Verification Failed: Expired token for user '{user_identity}' to {request.path}")
        return jsonify({"status": "error", "message": "The token has expired"}), 401
    
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
    app.register_blueprint(upload_settings_bp)
    
    # Request & Response Logging Middleware
    @app.before_request
    def log_request_info():
        origin = request.headers.get('Origin')
        # Log CORS warnings
        if origin and origin not in Config.CORS_ORIGINS and not request.path.startswith('/api/certificates/verify/'):
            logger.warning(f"CORS Error: Origin '{origin}' is not in ALLOWED_ORIGINS config list for path {request.path}")
        logger.info(f"API Request: {request.method} {request.path} - Remote Addr: {request.remote_addr} - Origin: {origin}")
        
    @app.after_request
    def log_response_info(response):
        logger.info(f"API Response: {request.method} {request.path} status={response.status_code}")
        return response

    # Frontend Log Ingestion Route
    @app.route("/api/logs/frontend", methods=["POST"])
    def log_frontend_error():
        data = request.get_json() or {}
        error_msg = data.get("message", "Unknown frontend error")
        stack = data.get("stack", "")
        url = data.get("url", "")
        logger.error(f"Frontend Error Ingested: '{error_msg}' at URL: {url}\nStack Trace:\n{stack}")
        return jsonify({"status": "success", "message": "Log received"}), 200

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
        logger.warning(f"Resource not found: {request.method} {request.path}")
        return jsonify({
            "status": "error",
            "message": "Resource not found"
        }), 404

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):
        import traceback
        stack = traceback.format_exc()
        logger.critical(f"Unexpected Exception occurred: {str(error)}\n{stack}")
        return jsonify({
            "status": "error",
            "message": "Internal server error"
        }), 500

    return app

app = create_app()

@atexit.register
def shutdown():
    logger.info("Levlox CRM Application is shutting down...")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)

