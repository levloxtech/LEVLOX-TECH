from flask import Blueprint, jsonify, request, send_from_directory
from utils.db import mongo_db
from datetime import datetime
import os
import werkzeug.utils

admin_bp = Blueprint("admin", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "admin")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@admin_bp.route("/api/admin/profile", methods=["GET"])
def get_admin_profile():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    profile = db.admin_profiles.find_one({"email": "admin@levlox.com"})
    if not profile:
        # Seed default profile if not present
        default_profile = {
            "name": "Sri Aakash",
            "email": "admin@levlox.com",
            "phone": "+91 98765 43210",
            "role": "Super Admin",
            "company": "Levlox Tech",
            "location": "Bangalore, India",
            "bio": "CRM & Systems Administrator at Levlox Tech.",
            "profileImage": "",
            "accountStatus": "Active",
            "lastLogin": datetime.utcnow().strftime("%B %d, %Y %I:%M %p"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        db.admin_profiles.insert_one(default_profile)
        profile = default_profile

    profile["_id"] = str(profile["_id"])
    return jsonify({"status": "success", "profile": profile}), 200

@admin_bp.route("/api/admin/profile", methods=["POST", "PUT"])
def update_admin_profile():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    
    # Handle image upload if sent via multipart/form-data instead of json
    if request.content_type and "multipart/form-data" in request.content_type:
        # We can extract text fields from request.form
        data = request.form.to_dict()
        if 'profileImage' in request.files:
            file = request.files['profileImage']
            if file.filename != '':
                filename = werkzeug.utils.secure_filename(file.filename)
                unique_filename = f"{int(datetime.utcnow().timestamp())}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                data["profileImage"] = f"/api/uploads/admin/{unique_filename}"

    # Prepare update query
    update_data = {}
    allowed_keys = ["name", "phone", "role", "company", "location", "bio", "profileImage"]
    for key in allowed_keys:
        if key in data:
            update_data[key] = data[key]
            
    # Also handle password change if requested
    new_password = data.get("password")
    if new_password:
        # Update admin user password in users collection
        db.users.update_one(
            {"email": "admin@levlox.com"},
            {"$set": {"password": new_password}} # In production use hashing, but CRM currently checks plain password or matches the mock authentication
        )
        
    update_data["updatedAt"] = datetime.utcnow()
    
    db.admin_profiles.update_one(
        {"email": "admin@levlox.com"},
        {"$set": update_data},
        upsert=True
    )
    
    # Retrieve updated profile
    profile = db.admin_profiles.find_one({"email": "admin@levlox.com"})
    profile["_id"] = str(profile["_id"])
    
    # Log CRM action
    mongo_db.log_activity("Admin Profile details updated.")
    
    return jsonify({"status": "success", "message": "Profile updated successfully", "profile": profile}), 200

@admin_bp.route("/api/admin/profile-image", methods=["DELETE"])
def delete_profile_image():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    db.admin_profiles.update_one(
        {"email": "admin@levlox.com"},
        {"$set": {"profileImage": "", "updatedAt": datetime.utcnow()}}
    )
    
    profile = db.admin_profiles.find_one({"email": "admin@levlox.com"})
    profile["_id"] = str(profile["_id"])
    
    return jsonify({"status": "success", "message": "Profile image removed", "profile": profile}), 200

@admin_bp.route("/api/uploads/admin/<filename>", methods=["GET"])
def get_admin_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@admin_bp.route("/api/admin/upload-profile", methods=["POST"])
def upload_admin_profile_image():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    if 'profileImage' not in request.files:
        return jsonify({"status": "error", "message": "No profileImage file part"}), 400
        
    file = request.files['profileImage']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
        
    # Check extension
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    filename = file.filename
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"status": "error", "message": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400
        
    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 10 * 1024 * 1024:
        return jsonify({"status": "error", "message": "File size exceeds 10MB limit"}), 400
        
    # Save the file
    import werkzeug.utils
    from datetime import datetime
    secured_name = werkzeug.utils.secure_filename(file.filename)
    unique_filename = f"{int(datetime.utcnow().timestamp())}_{secured_name}"
    
    PROFILE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "profile")
    os.makedirs(PROFILE_UPLOAD_FOLDER, exist_ok=True)
    
    file_path = os.path.join(PROFILE_UPLOAD_FOLDER, unique_filename)
    file.save(file_path)
    
    image_url = f"/api/uploads/profile/{unique_filename}"
    
    # Update MongoDB admin_profiles collection
    db.admin_profiles.update_one(
        {"email": "admin@levlox.com"},
        {"$set": {"profileImage": image_url, "updatedAt": datetime.utcnow()}},
        upsert=True
    )
    
    profile = db.admin_profiles.find_one({"email": "admin@levlox.com"})
    profile["_id"] = str(profile["_id"])
    
    # Log CRM action
    mongo_db.log_activity("Admin Profile photo uploaded.")
    
    return jsonify({"status": "success", "message": "Profile image uploaded successfully", "profile": profile}), 200

@admin_bp.route("/api/uploads/profile/<filename>", methods=["GET"])
def get_profile_uploaded_file(filename):
    PROFILE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "profile")
    return send_from_directory(PROFILE_UPLOAD_FOLDER, filename)
