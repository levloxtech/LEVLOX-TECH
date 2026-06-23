from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from utils.db import mongo_db
from bson.objectid import ObjectId
from datetime import datetime

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

def format_task(doc):
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("createdAt"), datetime):
        doc["createdAt"] = doc["createdAt"].isoformat()
    return doc

@tasks_bp.route("/", methods=["GET"])
@jwt_required()
def list_tasks():
    """Retrieve list of tasks."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        cursor = db.tasks.find().sort("createdAt", -1)
        tasks = [format_task(doc) for doc in cursor]
        return jsonify({
            "status": "success",
            "tasks": tasks
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@tasks_bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    """Create a new task."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"status": "error", "message": "Task title is required"}), 400

    now = datetime.utcnow()
    task_data = {
        "title": title,
        "description": data.get("description", "").strip(),
        "assignedTo": data.get("assignedTo", "Unassigned").strip(),
        "dueDate": data.get("dueDate"),
        "deadline": data.get("deadline"),
        "status": data.get("status", "Pending")  # Pending, In Progress, Completed
    }

    try:
        res = db.tasks.insert_one(task_data)
        task_data["_id"] = str(res.inserted_id)
        
        # Log activity
        mongo_db.log_activity(f"Created task: '{title}' assigned to {task_data['assignedTo']}")

        return jsonify({
            "status": "success",
            "message": "Task created successfully",
            "task": format_task(task_data)
        }), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@tasks_bp.route("/<task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    """Update an existing task status or details."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    data = request.get_json() or {}
    try:
        update_fields = {}
        for field in ["title", "description", "assignedTo", "dueDate", "deadline", "status"]:
            if field in data:
                update_fields[field] = data[field]

        res = db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_fields})
        if res.matched_count == 0:
            return jsonify({"status": "error", "message": "Task not found"}), 404

        updated_doc = db.tasks.find_one({"_id": ObjectId(task_id)})
        
        # Log activity
        if "status" in data:
            mongo_db.log_activity(f"Task '{updated_doc['title']}' status updated to: {data['status']}")

        return jsonify({
            "status": "success",
            "message": "Task updated successfully",
            "task": format_task(updated_doc)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@tasks_bp.route("/<task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    """Delete a task."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return jsonify({"status": "error", "message": "Task not found"}), 404

        db.tasks.delete_one({"_id": ObjectId(task_id)})
        
        # Log activity
        mongo_db.log_activity(f"Deleted task: '{task.get('title')}'")
        return jsonify({
            "status": "success",
            "message": "Task deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
