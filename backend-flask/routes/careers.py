import os
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from utils.db import mongo_db
from datetime import datetime

careers_bp = Blueprint("careers", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "resumes")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@careers_bp.route("/api/resume-upload", methods=["POST"])
def upload_resume():
    """Handle Resume Upload submissions and auto-create leads."""
    # Since it is a file upload, fields are retrieved from request.form
    name = request.form.get("name")
    email = request.form.get("email")
    phone = request.form.get("phone", "N/A")
    target_company = request.form.get("targetCompany") or request.form.get("target_company") or "Unknown"

    if not name or not email or not phone:
        return jsonify({
            "status": "error",
            "message": "Name, email, and phone are required fields."
        }), 400

    if "resume" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No resume file was uploaded."
        }), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({
            "status": "error",
            "message": "Selected file is empty."
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "status": "error",
            "message": "Invalid file type. Only PDF, DOC, and DOCX are allowed."
        }), 400

    # Ensure uploads directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Secure the filename and save the file
    original_filename = secure_filename(file.filename)
    # Append timestamp to make filename unique
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{original_filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    db = mongo_db.get_db()
    
    resume_info = {
        "filename": original_filename,
        "filepath": filename,
        "status": "Pending",
        "uploadedAt": datetime.utcnow().isoformat()
    }

    # Store resume entry details in database
    resume_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "filename": filename,
        "filepath": f"uploads/resumes/{filename}",
        "targetCompany": target_company,
        "createdAt": datetime.utcnow()
    }
    
    submission_id = None
    if db is not None:
        try:
            res = db.resumes.insert_one(resume_data)
            submission_id = str(res.inserted_id)

            # Insert into pathway_requests collection
            db.pathway_requests.insert_one({
                "name": name,
                "email": email,
                "phone": phone,
                "targetCompany": target_company,
                "resumeFile": f"uploads/resumes/{filename}",
                "createdAt": datetime.utcnow()
            })
        except Exception as e:
            pass

    # Auto-create lead
    mongo_db.create_lead(name, email, phone, "company_pathway", company=target_company, resume=resume_info)

    return jsonify({
        "status": "success",
        "message": "Resume uploaded and lead created successfully.",
        "submissionId": submission_id
    }), 201
