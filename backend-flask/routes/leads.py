import os
import uuid
from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required
from utils.db import mongo_db
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from utils.date_helpers import parse_date_range_query

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "resumes")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def format_lead(doc):
    """Utility to format MongoDB lead document for response."""
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("createdAt"), datetime):
        doc["createdAt"] = doc["createdAt"].isoformat()
    if isinstance(doc.get("updatedAt"), datetime):
        doc["updatedAt"] = doc["updatedAt"].isoformat()
    else:
        doc["updatedAt"] = doc.get("createdAt")
    # Handle status defaults if missing
    if "status" not in doc:
        doc["status"] = "New"
    if "notes" not in doc:
        doc["notes"] = []
    if "activity_history" not in doc:
        doc["activity_history"] = []
    if "location" not in doc:
        doc["location"] = "Unknown"
    if "company" not in doc:
        doc["company"] = "Unknown"
    return doc

@leads_bp.route("/", methods=["GET"])
@jwt_required()
def list_leads():
    """Retrieve list of leads with search, source, status, location, date filters, and pagination."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    # Query Params
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    source = request.args.get("source", "").strip()
    location = request.args.get("location", "").strip()
    start_date_str = request.args.get("startDate", "").strip()
    end_date_str = request.args.get("endDate", "").strip()
    
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = max(1, int(request.args.get("limit", 10)))
    except ValueError:
        page = 1
        limit = 10

    # Build MongoDB Query Filter
    query = {}
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"source": {"$regex": search, "$options": "i"}}
        ]

    # Date filters
    date_filter = parse_date_range_query("createdAt")
    if date_filter:
        query.update(date_filter)

    try:
        total = db.leads.count_documents(query)
        cursor = db.leads.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit)
        leads = [format_lead(doc) for doc in cursor]
        
        pages = (total + limit - 1) // limit if total > 0 else 1

        return jsonify({
            "status": "success",
            "leads": leads,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/<lead_id>", methods=["GET"])
@jwt_required()
def get_lead(lead_id):
    """Retrieve details of a single lead."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        doc = db.leads.find_one({"_id": ObjectId(lead_id)})
        if not doc:
            return jsonify({"status": "error", "message": "Lead not found"}), 404
        return jsonify({
            "status": "success",
            "lead": format_lead(doc)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Invalid lead ID or server error"}), 500

@leads_bp.route("/", methods=["POST"])
@jwt_required()
def create_lead():
    """Add a new lead manually."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    source = data.get("source", "manual")
    status = data.get("status", "New")
    location = data.get("location", "Unknown")
    company = data.get("company", "Unknown")

    if not name or not email or not phone:
        return jsonify({"status": "error", "message": "Name, email, and phone are required fields."}), 400

    now = datetime.utcnow()
    lead_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "source": source,
        "status": status,
        "location": location,
        "company": company,
        "notes": [],
        "activity_history": [
            {
                "activity": f"Lead created manually",
                "timestamp": now.isoformat()
            }
        ],
        "createdAt": now,
        "updatedAt": now
    }

    try:
        res = db.leads.insert_one(lead_data)
        lead_data["_id"] = str(res.inserted_id)
        lead_data["createdAt"] = now.isoformat()
        
        # Log activity & Notify
        mongo_db.log_activity(f"Admin manually created lead: {name}")
        mongo_db.create_notification("New Lead", f"New manual lead: {name}")

        return jsonify({
            "status": "success",
            "message": "Lead created successfully",
            "lead": format_lead(lead_data)
        }), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/video-lead", methods=["POST"])
def video_lead():
    """Endpoint for Levlox website to track video watch progress and auto-capture leads."""
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    location = data.get("location", "Unknown")
    video_name = data.get("videoName")
    watch_percentage = data.get("watchPercentage", 0)

    if not name or not email or not phone or not video_name:
        return jsonify({"status": "error", "message": "Required fields missing"}), 400

    # If watched >= 50%, register lead
    if watch_percentage >= 50:
        lead_id = mongo_db.create_lead(
            name=name,
            email=email,
            phone=phone,
            source="video_lead",
            location=location,
            video_name=video_name,
            watch_percentage=watch_percentage
        )
        
        # Log notification and activity specifically for video milestones
        mongo_db.log_activity(f"Video lead captured: {name} (watched {watch_percentage}% of '{video_name}')")
        mongo_db.create_notification("New Lead", f"{name} watched {watch_percentage}% of '{video_name}'")

        return jsonify({
            "status": "success",
            "message": "Video lead created successfully",
            "leadId": str(lead_id)
        }), 201
    else:
        return jsonify({
            "status": "success",
            "message": "Lead not created (watch percentage is below 50%)"
        }), 200

@leads_bp.route("/<lead_id>", methods=["PUT"])
@jwt_required()
def update_lead(lead_id):
    """Update lead details."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    data = request.get_json() or {}
    try:
        lead = db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            return jsonify({"status": "error", "message": "Lead not found"}), 404

        update_fields = {}
        activity_logs = []
        now = datetime.utcnow()
        now_str = now.isoformat()

        # Check fields and detect changes for activity log
        for field in ["name", "email", "phone", "source", "location", "company"]:
            if field in data and data[field] != lead.get(field):
                update_fields[field] = data[field]
                activity_logs.append(f"Updated {field} to '{data[field]}'")

        if "status" in data and data["status"] != lead.get("status", "New"):
            old_status = lead.get("status", "New")
            update_fields["status"] = data["status"]
            activity_logs.append(f"Changed status from '{old_status}' to '{data['status']}'")

        if not update_fields:
            return jsonify({"status": "success", "message": "No changes made", "lead": format_lead(lead)}), 200

        update_fields["updatedAt"] = now
        # Push activities to history
        new_activities = [{"activity": act, "timestamp": now_str} for act in activity_logs]
        
        db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {
                "$set": update_fields,
                "$push": {"activity_history": {"$each": new_activities}}
            }
        )

        # Log system activity
        for act in activity_logs:
            mongo_db.log_activity(f"Lead '{lead['name']}': {act}")

        updated_lead = db.leads.find_one({"_id": ObjectId(lead_id)})
        return jsonify({
            "status": "success",
            "message": "Lead updated successfully",
            "lead": format_lead(updated_lead)
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/<lead_id>", methods=["DELETE"])
@jwt_required()
def delete_lead(lead_id):
    """Delete a lead."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        lead = db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            return jsonify({"status": "error", "message": "Lead not found"}), 404

        db.leads.delete_one({"_id": ObjectId(lead_id)})
        
        # Log system activity
        mongo_db.log_activity(f"Deleted lead: {lead.get('name')}")
        return jsonify({
            "status": "success",
            "message": "Lead deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/<lead_id>/notes", methods=["POST"])
@jwt_required()
def add_lead_note(lead_id):
    """Add a note to a lead."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    data = request.get_json() or {}
    note_content = data.get("note", "").strip()
    if not note_content:
        return jsonify({"status": "error", "message": "Note content cannot be empty"}), 400

    now_str = datetime.utcnow().isoformat()
    note_id = str(uuid.uuid4())
    new_note = {
        "id": note_id,
        "content": note_content,
        "createdAt": now_str
    }

    try:
        res = db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {
                "$push": {
                    "notes": new_note,
                    "activity_history": {
                        "activity": f"Added note: '{note_content[:30]}...'",
                        "timestamp": now_str
                    }
                }
            }
        )
        if res.matched_count == 0:
            return jsonify({"status": "error", "message": "Lead not found"}), 404
        
        return jsonify({
            "status": "success",
            "message": "Note added successfully",
            "note": new_note
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/<lead_id>/notes/<note_id>", methods=["DELETE"])
@jwt_required()
def delete_lead_note(lead_id, note_id):
    """Delete a note from a lead."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        # Find the note first to log the activity
        lead = db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            return jsonify({"status": "error", "message": "Lead not found"}), 404

        notes = lead.get("notes", [])
        note_to_delete = next((n for n in notes if n.get("id") == note_id), None)
        if not note_to_delete:
            return jsonify({"status": "error", "message": "Note not found"}), 404

        now_str = datetime.utcnow().isoformat()
        db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {
                "$pull": {"notes": {"id": note_id}},
                "$push": {
                    "activity_history": {
                        "activity": "Deleted a note",
                        "timestamp": now_str
                    }
                }
            }
        )
        return jsonify({
            "status": "success",
            "message": "Note deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/<lead_id>/resume", methods=["POST"])
@jwt_required()
def upload_lead_resume(lead_id):
    """Upload resume specifically associated with a lead."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    if "resume" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Empty file name"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Invalid file type. Allowed: PDF, DOC, DOCX"}), 400

    try:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        original_filename = secure_filename(file.filename)
        filename = f"{lead_id}_{int(datetime.utcnow().timestamp())}_{original_filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Read file content for base64 database storage fallback
        file.seek(0)
        file_content = file.read()
        import base64
        file_base64 = base64.b64encode(file_content).decode('utf-8')

        now = datetime.utcnow()
        now_str = now.isoformat()
        resume_info = {
            "filename": original_filename,
            "filepath": filename,
            "file_data": file_base64,
            "status": "Pending",  # Store status of resume as requested: Pending/Approved/Rejected
            "uploadedAt": now_str
        }

        # Update Lead Object
        db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {
                "$set": {"resume": resume_info},
                "$push": {
                    "activity_history": {
                        "activity": f"Uploaded resume: {original_filename}",
                        "timestamp": now_str
                    }
                }
            }
        )

        # Store in general 'resumes' collection for Resume Management
        lead = db.leads.find_one({"_id": ObjectId(lead_id)})
        resume_doc = {
            "leadId": lead_id,
            "name": lead.get("name"),
            "email": lead.get("email"),
            "filename": original_filename,
            "filepath": filename,
            "status": "Pending",
            "createdAt": now
        }
        db.resumes.insert_one(resume_doc)

        # Notify CRM System
        mongo_db.log_activity(f"Resume uploaded for lead: {lead.get('name')}")
        mongo_db.create_notification("New Resume Upload", f"New CV uploaded for {lead.get('name')}")

        return jsonify({
            "status": "success",
            "message": "Resume uploaded successfully",
            "resume": resume_info
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@leads_bp.route("/<lead_id>/download-resume", methods=["GET"])
@jwt_required()
def download_lead_resume(lead_id):
    """Download a lead's resume."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        lead = db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead or "resume" not in lead or not lead["resume"].get("filepath"):
            return jsonify({"status": "error", "message": "Resume info not found in database for this lead"}), 404

        filename = lead["resume"]["filepath"]
        file_full_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_full_path):
            file_data_b64 = lead["resume"].get("file_data")
            if file_data_b64:
                import base64
                import io
                from flask import send_file
                try:
                    file_bytes = base64.b64decode(file_data_b64)
                    mimetype = "application/pdf" if lead["resume"]["filename"].lower().endswith(".pdf") else "application/octet-stream"
                    return send_file(
                        io.BytesIO(file_bytes),
                        mimetype=mimetype,
                        as_attachment=True,
                        download_name=lead["resume"]["filename"]
                    )
                except Exception as b64_err:
                    pass
            return jsonify({
                "status": "error",
                "message": "Resume file was not found on the server disk. (It may have been cleared during a server restart/redeployment)."
            }), 404

        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True, download_name=lead["resume"]["filename"])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
