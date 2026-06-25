from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.db import mongo_db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticates the administrator using database validation."""
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
    db = mongo_db.get_db()
    if db is not None:
        user = db.users.find_one({"email": email})
        if user and user.get("password") == password:
            access_token = create_access_token(identity=email)
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "token": access_token,
                "user": {
                    "email": email,
                    "role": user.get("role", "admin")
                }
            }), 200
            
    # Fallback to default credentials and seed them in the DB if the admin user is not yet created
    if email == "admin@levlox.com" and password == "admin123":
        if db is not None:
            existing_user = db.users.find_one({"email": "admin@levlox.com"})
            if not existing_user:
                db.users.update_one(
                    {"email": "admin@levlox.com"},
                    {"$set": {
                        "email": "admin@levlox.com",
                        "name": "Sri Aakash",
                        "role": "Super Admin",
                        "password": "admin123"
                    }},
                    upsert=True
                )
                access_token = create_access_token(identity=email)
                return jsonify({
                    "status": "success",
                    "message": "Login successful",
                    "token": access_token,
                    "user": {
                        "email": email,
                        "role": "Super Admin"
                    }
                }), 200
        else:
            # Fallback if DB is not active/available
            access_token = create_access_token(identity=email)
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "token": access_token,
                "user": {
                    "email": email,
                    "role": "Super Admin"
                }
            }), 200
        
    return jsonify({"status": "error", "message": "Invalid email or password"}), 401

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Get currently logged-in user identity."""
    current_user = get_jwt_identity()
    return jsonify({
        "status": "success",
        "user": {
            "email": current_user,
            "role": "admin"
        }
    }), 200

# User CRUD Operations for CRM Administrators
@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    """Retrieve all users in CRM system."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    try:
        users = []
        cursor = db.users.find()
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "password" in doc:
                del doc["password"]
            users.append(doc)
        return jsonify({
            "status": "success",
            "users": users
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@auth_bp.route("/users", methods=["POST"])
@jwt_required()
def create_user():
    """Create a new CRM administrator/user."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    name = data.get("name", "").strip()
    role = data.get("role", "user").strip()
    password = data.get("password", "").strip()

    if not email or not name or not password:
        return jsonify({"status": "error", "message": "Name, email, and password are required fields"}), 400

    try:
        existing = db.users.find_one({"email": email})
        if existing:
            return jsonify({"status": "error", "message": "A user with this email already exists"}), 400

        user_doc = {
            "email": email,
            "name": name,
            "role": role,
            "password": password # In real crm, should be hashed, for Phase 1/2 stubs simple plain text works
        }
        res = db.users.insert_one(user_doc)
        user_doc["_id"] = str(res.inserted_id)
        del user_doc["password"]
        
        # Log activity
        mongo_db.log_activity(f"Created user: {name} ({email})")
        return jsonify({
            "status": "success",
            "message": "User created successfully",
            "user": user_doc
        }), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@auth_bp.route("/users/<user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    """Update CRM user details."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    from bson.objectid import ObjectId
    data = request.get_json() or {}
    try:
        update_fields = {}
        if "name" in data:
            update_fields["name"] = data["name"].strip()
        if "role" in data:
            update_fields["role"] = data["role"].strip()
        if "password" in data and data["password"].strip():
            update_fields["password"] = data["password"].strip()

        res = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
        if res.matched_count == 0:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        updated = db.users.find_one({"_id": ObjectId(user_id)})
        updated["_id"] = str(updated["_id"])
        if "password" in updated:
            del updated["password"]

        # Log activity
        mongo_db.log_activity(f"Updated user ID: {user_id}")
        return jsonify({
            "status": "success",
            "message": "User updated successfully",
            "user": updated
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@auth_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    """Delete a CRM user."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    from bson.objectid import ObjectId
    try:
        res = db.users.delete_one({"_id": ObjectId(user_id)})
        if res.deleted_count == 0:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Log activity
        mongo_db.log_activity(f"Deleted user ID: {user_id}")
        return jsonify({
            "status": "success",
            "message": "User deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
