from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from utils.db import mongo_db
from datetime import datetime
from bson import ObjectId
from utils.date_helpers import parse_date_range_query

results_bp = Blueprint("results", __name__)

@results_bp.route("/api/results", methods=["GET"])
def get_results():
    """Fetch student success stories/results dynamically from database."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    # Seed default success stories if none exist
    if db.success_stories.count_documents({}) == 0:
        default_stories = [
            {
                "name": "AMAN VERMA",
                "role": "Data Analyst",
                "batch": "Batch '23",
                "company": "Google",
                "logoColor": "#4285F4",
                "lpa": "₹12 LPA",
                "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
                "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
                "createdAt": datetime.utcnow()
            },
            {
                "name": "PRIYA SHARMA",
                "role": "Full Stack Developer",
                "batch": "Batch '22",
                "company": "Microsoft",
                "logoColor": "#F25022",
                "lpa": "₹18 LPA",
                "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
                "videoUrl": "https://www.w3schools.com/html/movie.mp4",
                "createdAt": datetime.utcnow()
            },
            {
                "name": "VIKRAM SINGH",
                "role": "Backend Developer",
                "batch": "Batch '23",
                "company": "amazon",
                "logoColor": "#FF9900",
                "lpa": "₹16 LPA",
                "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
                "createdAt": datetime.utcnow()
            },
            {
                "name": "NEHA JOSHI",
                "role": "Data Scientist",
                "batch": "Batch '22",
                "company": "Adobe",
                "logoColor": "#FF0000",
                "lpa": "₹17 LPA",
                "image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
                "videoUrl": "https://www.w3schools.com/html/movie.mp4",
                "createdAt": datetime.utcnow()
            }
        ]
        db.success_stories.insert_many(default_stories)

    query = {}
    date_filter = parse_date_range_query("createdAt")
    if date_filter:
        query.update(date_filter)

    stories = list(db.success_stories.find(query))
    for s in stories:
        s["_id"] = str(s["_id"])
        if "createdAt" in s and isinstance(s["createdAt"], datetime):
            s["createdAt"] = s["createdAt"].isoformat()
    return jsonify({"status": "success", "results": stories}), 200


@results_bp.route("/api/results", methods=["POST"])
@jwt_required()
def create_result():
    """Create a new success story / result in the database (CRM only)."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    data = request.get_json() or {}
    name = data.get("name")
    company = data.get("company")
    role = data.get("role")
    lpa = data.get("lpa")
    
    if not name or not company or not role or not lpa:
        return jsonify({"status": "error", "message": "Name, Company, Role, and LPA are required"}), 400

    story_data = {
        "name": name,
        "company": company,
        "role": role,
        "lpa": lpa,
        "batch": data.get("batch", "Batch '26"),
        "logoColor": data.get("logoColor", "#6b21e8"),
        "image": data.get("image", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"),
        "videoUrl": data.get("videoUrl", ""),
        "createdAt": datetime.utcnow()
    }

    res = db.success_stories.insert_one(story_data)
    story_data["_id"] = str(res.inserted_id)
    story_data["createdAt"] = story_data["createdAt"].isoformat()

    mongo_db.log_activity(f"New student success story added for {name} ({company})")
    mongo_db.create_notification("Result", f"New success story: {name} placed at {company}")

    return jsonify({"status": "success", "result": story_data}), 201


@results_bp.route("/api/results/<result_id>", methods=["DELETE"])
@jwt_required()
def delete_result(result_id):
    """Delete a success story by ID (CRM only)."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        query = {"_id": ObjectId(result_id)}
    except Exception:
        query = {"_id": result_id}

    story = db.success_stories.find_one(query)
    if not story:
        return jsonify({"status": "error", "message": "Success story not found"}), 404

    db.success_stories.delete_one(query)
    mongo_db.log_activity(f"Success story deleted for {story.get('name')}")

    return jsonify({"status": "success", "message": "Success story deleted successfully"}), 200


@results_bp.route("/api/results/<result_id>", methods=["PUT"])
@jwt_required()
def update_result(result_id):
    """Update an existing success story / result in the database (CRM only)."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        query = {"_id": ObjectId(result_id)}
    except Exception:
        query = {"_id": result_id}

    story = db.success_stories.find_one(query)
    if not story:
        return jsonify({"status": "error", "message": "Success story not found"}), 404

    data = request.get_json() or {}
    
    update_data = {}
    fields = ["name", "company", "role", "lpa", "batch", "logoColor", "image", "videoUrl"]
    for f in fields:
        if f in data:
            update_data[f] = data[f]

    if not update_data:
        return jsonify({"status": "error", "message": "No fields to update"}), 400

    db.success_stories.update_one(query, {"$set": update_data})
    
    updated_story = db.success_stories.find_one(query)
    updated_story["_id"] = str(updated_story["_id"])
    if "createdAt" in updated_story and isinstance(updated_story["createdAt"], datetime):
        updated_story["createdAt"] = updated_story["createdAt"].isoformat()

    mongo_db.log_activity(f"Success story updated for {updated_story.get('name')} ({updated_story.get('company')})")

    return jsonify({"status": "success", "result": updated_story}), 200

