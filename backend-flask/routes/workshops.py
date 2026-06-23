from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from utils.db import mongo_db
from datetime import datetime

workshops_bp = Blueprint("workshops", __name__, url_prefix="/api/workshops")

@workshops_bp.route("/", methods=["GET"])
def list_workshops():
    """Retrieve list of workshops (publicly accessible)."""
    db = mongo_db.get_db()
    workshops = []
    if db is not None:
        try:
            cursor = db.workshops.find().sort("date", 1)
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                workshops.append(doc)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
            
    return jsonify({
        "status": "success",
        "workshops": workshops
    }), 200

@workshops_bp.route("/", methods=["POST"])
@jwt_required()
def create_workshop():
    """Create a new workshop event (authenticated)."""
    db = mongo_db.get_db()
    data = request.get_json() or {}
    title = data.get("title")
    date = data.get("date")
    
    if not title or not date:
        return jsonify({
            "status": "error",
            "message": "Title and date are required fields."
        }), 400

    workshop_data = {
        "title": title,
        "date": date,
        "description": data.get("description", ""),
        "location": data.get("location", "Online Zoom"),
        "registrations": 0,
        "createdAt": datetime.utcnow()
    }

    workshop_id = None
    if db is not None:
        try:
            res = db.workshops.insert_one(workshop_data)
            workshop_id = str(res.inserted_id)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    return jsonify({
        "status": "success",
        "message": "Workshop created successfully",
        "workshopId": workshop_id
    }), 201

@workshops_bp.route("/register", methods=["POST"])
def register_workshop():
    """Handle Workshop Registration form submission and auto-create leads."""
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone") or "N/A"
    workshop_id = data.get("workshopId") or data.get("workshop_title") or "Unknown"

    if not name or not email:
        return jsonify({
            "status": "error",
            "message": "Name and email are required fields."
        }), 400

    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    # Store registration details
    registration_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "workshopId": workshop_id,
        "createdAt": datetime.utcnow()
    }
    
    try:
        res = db.workshop_registrations.insert_one(registration_data)
        registration_id = str(res.inserted_id)
        import logging
        logging.getLogger(__name__).info(f"Successfully processed workshop registration with ID: {registration_id}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to save workshop registration to MongoDB: {e}")
        return jsonify({"status": "error", "message": f"Database insertion failed: {str(e)}"}), 500
    
    # Auto-create lead
    lead_id = mongo_db.create_lead(name, email, phone, "workshop")
    if not lead_id:
        import logging
        logging.getLogger(__name__).warning("Failed to auto-create lead for workshop registration.")
    
    # Auto-email acknowledgment
    mongo_db.log_email(
        recipient=email,
        subject="Workshop Registration Confirmation - Levlox Tech",
        body=f"Hello {name},\n\nYour registration for the Levlox Workshop event has been successfully processed! We are excited to have you join us. Details and links will be shared prior to the event.\n\nBest regards,\nLevlox Tech Events Team"
    )

    return jsonify({
        "status": "success",
        "message": "Workshop registration successful",
        "registrationId": registration_id
    }), 201
