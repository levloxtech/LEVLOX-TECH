import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from utils.db import mongo_db
from datetime import datetime
from utils.date_helpers import parse_date_range_query

contacts_bp = Blueprint("contacts", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "resumes")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

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
            if not allowed_file(file.filename):
                return jsonify({
                    "status": "error",
                    "message": "Invalid file type. Only PDF, DOC, and DOCX are allowed."
                }), 400

            # Validate file size (max 5 MB)
            file.seek(0, os.SEEK_END)
            file_length = file.tell()
            file.seek(0)
            if file_length > 5 * 1024 * 1024:
                return jsonify({
                    "status": "error",
                    "message": "File size exceeds the maximum limit of 5 MB."
                }), 400

            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            original_filename = secure_filename(file.filename)
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            unique_filename = f"{timestamp}_{original_filename}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)
            resume_file = f"uploads/resumes/{unique_filename}"
            
            resume_info = {
                "filename": original_filename,
                "filepath": unique_filename,
                "status": "Pending",
                "uploadedAt": datetime.utcnow().isoformat()
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
        import logging
        logging.getLogger(__name__).info(f"Successfully saved contact inquiry with ID: {contact_id}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to insert contact inquiry into MongoDB: {e}")
        return jsonify({"status": "error", "message": f"Database insertion failed: {str(e)}"}), 500

    # Auto-create lead
    lead_source = "contact_with_resume" if resume_file else "contact_form"
    lead_id = mongo_db.create_lead(name, email, phone, lead_source, company=company, resume=resume_info)
    if not lead_id:
        import logging
        logging.getLogger(__name__).warning("Failed to auto-create lead for contact form submission.")

    if resume_file:
        # Save resume to general 'resumes' collection too (CRM tracker)
        try:
            db.resumes.insert_one({
                "leadId": str(lead_id) if lead_id else None,
                "name": name,
                "email": email,
                "filename": original_filename,
                "filepath": unique_filename,
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
