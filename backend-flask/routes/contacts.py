import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from utils.db import mongo_db
from datetime import datetime
from utils.date_helpers import parse_date_range_query

from utils.logger import logger

contacts_bp = Blueprint("contacts", __name__)



@contacts_bp.route("/api/contact", methods=["POST"])
def submit_contact():
    """Submit a contact/inquiry form and automatically generate a lead."""
    # Since we accept multipart/form-data, retrieve fields from request.form
    name = request.form.get("name")
    email = request.form.get("email")
    phone = request.form.get("phone", "N/A")
    message = request.form.get("message")
    help_type = request.form.get("help_type") or request.form.get("topic") or "General"
    company = request.form.get("company")

    if not company and message:
        import re
        match = re.search(r"Target Company:\s*(.*)", message, re.IGNORECASE)
        if match:
            company = match.group(1).strip()

    if not name or not email:
        return jsonify({
            "status": "error",
            "message": "Name and email are required fields."
        }), 400

    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    resume_file = None
    original_filename = None
    unique_filename = None
    resume_info = None

    # Handle resume upload if present
    if "resume" in request.files:
        file = request.files["resume"]
        if file and file.filename != "":
            from utils.file_storage import save_file_to_gridfs
            try:
                gridfs_res = save_file_to_gridfs(file, category="resume")
            except ValueError as val_err:
                return jsonify({
                    "status": "error",
                    "message": str(val_err)
                }), 400
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": f"Failed to save resume to GridFS: {str(e)}"
                }), 500

            resume_file = gridfs_res["file_id"]
            
            resume_info = {
                "file_id": gridfs_res["file_id"],
                "filename": gridfs_res["filename"],
                "original_filename": gridfs_res["original_filename"],
                "content_type": gridfs_res["content_type"],
                "file_size": gridfs_res["size"],
                "status": "Pending",
                "uploaded_at": datetime.utcnow().isoformat()
            }

    # Store contact details
    contact_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "message": message,
        "help_type": help_type,
        "company": company or "Unknown",
        "resume_file": resume_file,
        "created_at": datetime.utcnow(),
        "createdAt": datetime.utcnow() # for backwards compatibility with list queries
    }
    
    try:
        res = db.contacts.insert_one(contact_data)
        contact_id = str(res.inserted_id)
        logger.info(f"Successfully saved contact inquiry with ID: {contact_id}")
    except Exception as e:
        logger.error(f"Failed to insert contact inquiry into MongoDB: {e}")
        return jsonify({"status": "error", "message": f"Database insertion failed: {str(e)}"}), 500

    # Auto-create lead
    lead_source = "contact_with_resume" if resume_file else "contact_form"
    lead_id = mongo_db.create_lead(name, email, phone, lead_source, company=company, resume=resume_info)
    if not lead_id:
        logger.warning("Failed to auto-create lead for contact form submission.")

    if resume_file:
        # Save resume to general 'resumes' collection too (CRM tracker)
        try:
            db.resumes.insert_one({
                "leadId": str(lead_id) if lead_id else None,
                "name": name,
                "email": email,
                "filename": resume_info["filename"],
                "file_id": resume_file,
                "status": "Pending",
                "createdAt": datetime.utcnow()
            })
        except Exception as e:
            pass

        # Trigger notification: "New Resume Submitted by {User Name}"
        mongo_db.create_notification("Resume Submission", f"New Resume Submitted by {name}")

    # Auto-email acknowledgment
    mongo_db.log_email(
        recipient=email,
        subject="Thank you for contacting Levlox Tech",
        body=f"Hello {name},\n\nWe have received your contact inquiry. A member of our support team will review your message and respond to you as soon as possible.\n\nYour message: \"{message}\"\n\nBest regards,\nLevlox Tech Support Team"
    )

    return jsonify({
        "status": "success",
        "message": "Contact inquiry submitted successfully",
        "contactId": contact_id
    }), 201

@contacts_bp.route("/api/contacts", methods=["GET"])
@jwt_required()
def list_contacts():
    """Retrieve list of contact inquiries (authenticated)."""
    db = mongo_db.get_db()
    contacts = []
    if db is not None:
        try:
            query = {}
            date_filter = parse_date_range_query("createdAt")
            if date_filter:
                query.update(date_filter)
            cursor = db.contacts.find(query).sort("createdAt", -1)
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                doc["createdAt"] = doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt")
                contacts.append(doc)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
            
    return jsonify({
        "status": "success",
        "contacts": contacts
    }), 200
