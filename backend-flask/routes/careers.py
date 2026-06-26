import os
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from utils.db import mongo_db
from datetime import datetime

careers_bp = Blueprint("careers", __name__)



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

    db = mongo_db.get_db()
    
    resume_info = {
        "file_id": gridfs_res["file_id"],
        "filename": gridfs_res["filename"],
        "original_filename": gridfs_res["original_filename"],
        "content_type": gridfs_res["content_type"],
        "file_size": gridfs_res["size"],
        "status": "Pending",
        "uploaded_at": datetime.utcnow().isoformat()
    }

    # Store resume entry details in database
    resume_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "filename": gridfs_res["filename"],
        "file_id": gridfs_res["file_id"],
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
                "file_id": gridfs_res["file_id"],
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
