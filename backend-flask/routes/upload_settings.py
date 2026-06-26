from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import mongo_db
from utils.file_storage import get_upload_settings, update_upload_settings

upload_settings_bp = Blueprint("upload_settings", __name__)

def is_admin(db, email):
    """Check if the email belongs to an Admin profile."""
    if not email:
        return False
    if email == "admin@levlox.com":
        return True
    profile = db.admin_profiles.find_one({"email": email})
    if profile:
        return True
    return False

@upload_settings_bp.route("/api/settings/upload-config", methods=["GET"])
def get_public_limits():
    """Retrieve the current file upload settings/limits without authentication."""
    try:
        settings = get_upload_settings()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@upload_settings_bp.route("/api/admin/upload-settings", methods=["GET"])
@jwt_required()
def get_limits():
    """Retrieve the current file upload settings/limits (authenticated)."""
    try:
        settings = get_upload_settings()
        return jsonify({
            "status": "success",
            "settings": settings
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@upload_settings_bp.route("/api/admin/upload-settings", methods=["PUT"])
@jwt_required()
def update_limits():
    """Update file upload settings/limits. Requires Admin privileges."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    current_email = get_jwt_identity()
    if not is_admin(db, current_email):
        return jsonify({"status": "error", "message": "Unauthorized. Admin privileges required."}), 403

    data = request.get_json() or {}
    # Basic structural check
    if not data or not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid request payload"}), 400

    try:
        updated_settings = update_upload_settings(data)
        mongo_db.log_activity("Updated CRM File Upload configuration limits.")
        return jsonify({
            "status": "success",
            "message": "File upload settings updated successfully",
            "settings": updated_settings
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
