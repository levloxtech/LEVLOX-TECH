from flask import Blueprint, jsonify, request, send_from_directory
from utils.db import mongo_db
from datetime import datetime
from bson import ObjectId
import os
import werkzeug.utils
import time
from utils.logger import logger

courses_bp = Blueprint("courses", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "courses")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@courses_bp.route("/api/course-enroll", methods=["POST"])
def enroll_course():
    """Handle Course Enrollment form submissions and create leads."""
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    course_name = data.get("courseName")  # e.g., 'Full Stack Web Development'

    if not name or not email or not phone:
        return jsonify({
            "status": "error",
            "message": "Name, email, and phone are required fields."
        }), 400

    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    # Store course enrollment details
    enrollment_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "courseName": course_name,
        "createdAt": datetime.utcnow()
    }
    
    try:
        res = db.course_enrollments.insert_one(enrollment_data)
        enrollment_id = str(res.inserted_id)
        logger.info(f"Successfully processed course enrollment with ID: {enrollment_id}")
    except Exception as e:
        logger.error(f"Failed to save course enrollment to MongoDB: {e}")
        return jsonify({"status": "error", "message": f"Database insertion failed: {str(e)}"}), 500
            
    # Auto-create lead
    lead_id = mongo_db.create_lead(name, email, phone, "course")
    if not lead_id:
        logger.warning("Failed to auto-create lead for course enrollment.")
    
    # Auto-email acknowledgment
    mongo_db.log_email(
        recipient=email,
        subject=f"Levlox Course Enrollment: {course_name}",
        body=f"Hello {name},\n\nWe have received your enrollment request for the course '{course_name}'. Our admissions representative will contact you shortly to complete the onboarding process.\n\nBest regards,\nLevlox Tech Support Team"
    )

    return jsonify({
        "status": "success",
        "message": "Course enrollment processed successfully",
        "enrollmentId": enrollment_id
    }), 201


# ==========================================
# COURSE MANAGEMENT & PLAYER ENDPOINTS
# ==========================================

# Global variable to ensure migrations run only once per application startup
_migration_run = False

@courses_bp.route("/api/courses", methods=["GET"])
def get_courses():
    global _migration_run
    start_total = time.time()
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    # Ensure indexes are established for foreign keys
    db.modules.create_index("course_id")
    db.lessons.create_index("module_id")
    
    if not _migration_run:
        # Pre-populate default courses if they do not exist
        default_courses = [
            {
                "category": "Interview Strategy",
                "title": "Company Interview Playbooks",
                "desc": "Every Company Hires Differently. Most Candidates Prepare The Same Way.",
                "duration": "12 mins read",
                "level": "Intermediate",
                "enrolled": "Free Access",
                "badge": "Playbook",
                "badgeClass": "badge-free",
                "price": "Start Reading",
                "thumbBg": "c-thumb-1",
                "thumbIcon": "",
                "tab": "Placement",
                "status": "active",
                "createdAt": datetime.utcnow()
            },
            {
                "category": "Placement System",
                "title": "GET HIRED",
                "desc": "The Hiring Formula",
                "duration": "15 mins read",
                "level": "All Levels",
                "enrolled": "Free Access",
                "badge": "FREE",
                "badgeClass": "badge-free",
                "price": "Start Reading",
                "thumbBg": "c-thumb-2",
                "thumbIcon": "",
                "tab": "Placement",
                "is_career_pathway": True,
                "status": "active",
                "createdAt": datetime.utcnow()
            },
            {
                "category": "Career Growth",
                "title": "GET PROMOTED",
                "desc": "The Career Acceleration Formula",
                "duration": "10 mins read",
                "level": "Advanced",
                "enrolled": "Free Access",
                "badge": "FREE",
                "badgeClass": "badge-free",
                "price": "Start Reading",
                "thumbBg": "c-thumb-3",
                "thumbIcon": "",
                "tab": "Career Growth",
                "is_career_pathway": True,
                "status": "active",
                "createdAt": datetime.utcnow()
            },
            {
                "category": "Career Transition",
                "title": "ESCAPE SERVICE COMPANIES",
                "desc": "The Product Company Formula",
                "duration": "18 mins read",
                "level": "Intermediate",
                "enrolled": "Free Access",
                "badge": "FREE",
                "badgeClass": "badge-free",
                "price": "Start Reading",
                "thumbBg": "c-thumb-4",
                "thumbIcon": "",
                "tab": "Career Growth",
                "is_career_pathway": True,
                "status": "active",
                "createdAt": datetime.utcnow()
            },
            {
                "category": "Engineering Mindset",
                "title": "ELITE ENGINEER",
                "desc": "The Top 1% Formula",
                "duration": "8 mins read",
                "level": "All Levels",
                "enrolled": "Free Access",
                "badge": "FREE",
                "badgeClass": "badge-free",
                "price": "Start Reading",
                "thumbBg": "c-thumb-5",
                "thumbIcon": "",
                "tab": "Mindset",
                "is_career_pathway": True,
                "status": "active",
                "createdAt": datetime.utcnow()
            }
        ]

        # Pre-migration: update old title formats to new format in database
        db.courses.update_one({"title": "🎯 Get Hired"}, {"$set": {"title": "GET HIRED", "desc": "The Hiring Formula", "badge": "FREE", "thumbIcon": ""}})
        db.courses.update_one({"title": "GET HIRED"}, {"$set": {"badge": "FREE"}})
        db.courses.update_one({"title": "📈 Get Promoted"}, {"$set": {"title": "GET PROMOTED", "desc": "The Career Acceleration Formula", "badge": "FREE", "thumbIcon": ""}})
        db.courses.update_one({"title": "🚀 Escape Service Companies"}, {"$set": {"title": "ESCAPE SERVICE COMPANIES", "desc": "The Product Company Formula", "badge": "FREE", "thumbIcon": ""}})
        db.courses.update_one({"title": "⚡ Think Like Elite Engineers"}, {"$set": {"title": "ELITE ENGINEER", "desc": "The Top 1% Formula", "badge": "FREE", "thumbIcon": ""}})
        db.courses.update_one({"title": "🏢 Company Interview Playbooks"}, {"$set": {"title": "Company Interview Playbooks", "thumbIcon": ""}})
        
        # Sanitize existing courses, modules, and lessons from the '🎯' emoji or other target icons
        for course in db.courses.find():
            updated = False
            title = course.get("title", "")
            desc = course.get("desc", "")
            if "🎯" in title:
                title = title.replace("🎯", "").strip()
                updated = True
            if "🎯" in desc:
                desc = desc.replace("🎯", "").strip()
                updated = True
            if updated:
                db.courses.update_one({"_id": course["_id"]}, {"$set": {"title": title, "desc": desc}})
                
        for module in db.modules.find():
            title = module.get("title", "")
            if "🎯" in title:
                title = title.replace("🎯", "").strip()
                db.modules.update_one({"_id": module["_id"]}, {"$set": {"title": title}})
                
        # Optimize by only finding and updating lessons that actually contain the target emoji
        for lesson in db.lessons.find({"$or": [{"title": {"$regex": "🎯"}}, {"description": {"$regex": "🎯"}}]}):
            updated = False
            title = lesson.get("title", "")
            description = lesson.get("description", "")
            if "🎯" in title:
                title = title.replace("🎯", "").strip()
                updated = True
            if "🎯" in description:
                description = description.replace("🎯", "").strip()
                updated = True
            if updated:
                db.lessons.update_one({"_id": lesson["_id"]}, {"$set": {"title": title, "description": description}})
                
        # Ensure all existing documents in database have thumbIcon and titles cleared of emojis
        db.courses.update_many({}, {"$set": {"thumbIcon": ""}})
        
        for c_data in default_courses:
            if db.courses.count_documents({"title": c_data["title"]}) == 0:
                res = db.courses.insert_one(c_data)
                c_id = str(res.inserted_id)
                
                # Create default module 1
                m_res = db.modules.insert_one({
                    "course_id": c_id,
                    "title": "Module 1: Introduction and Core Systems",
                    "order": 1,
                    "createdAt": datetime.utcnow()
                })
                m_id = str(m_res.inserted_id)
                
                # Create default lessons
                db.lessons.insert_many([
                    {
                        "module_id": m_id,
                        "course_id": c_id,
                        "title": "1. Welcome & Roadmap Briefing",
                        "description": f"Welcome to {c_data['title']}. We will map out your exact system roadmap, success metrics, and milestones.",
                        "video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
                        "pdf_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                        "code_url": "",
                        "files_url": "",
                        "order": 1,
                        "createdAt": datetime.utcnow()
                    },
                    {
                        "module_id": m_id,
                        "course_id": c_id,
                        "title": "2. High-Impact Fundamentals",
                        "description": "Deep-dive analysis of core models, setup checklists, and setting up initial environments.",
                        "video_url": "https://www.w3schools.com/html/movie.mp4",
                        "pdf_url": "",
                        "code_url": "",
                        "files_url": "",
                        "order": 2,
                        "createdAt": datetime.utcnow()
                    }
                ])
            else:
                # Migration/update check for existing courses with matching titles
                db.courses.update_many(
                    {
                        "title": c_data["title"],
                        "is_career_pathway": {"$exists": False}
                    },
                    {"$set": {
                        "is_career_pathway": c_data.get("is_career_pathway", False),
                        "status": "active",
                        "badge": c_data.get("badge", "FREE")
                    }}
                )
        _migration_run = True

    start_db = time.time()
    courses = list(db.courses.find({}, {
        "_id": 1,
        "title": 1,
        "category": 1,
        "desc": 1,
        "duration": 1,
        "level": 1,
        "price": 1,
        "tab": 1,
        "badge": 1,
        "status": 1,
        "is_career_pathway": 1,
        "subtitle": 1,
        "display_order": 1,
        "displayOrder": 1,
        "is_featured": 1,
        "pathwayType": 1
    }))
    db_time = (time.time() - start_db) * 1000

    for c in courses:
        c["_id"] = str(c["_id"])
        
    total_time = (time.time() - start_total) * 1000
    logger.info(f"API: GET /api/courses | DB Query Time: {db_time:.2f}ms | Total Response Time: {total_time:.2f}ms")
    
    return jsonify({"status": "success", "courses": courses}), 200

@courses_bp.route("/api/career-pathways", methods=["GET"])
def get_career_pathways():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    # Ensure migration has run or defaults exist
    get_courses()

    pathways = list(db.courses.find({"is_career_pathway": True, "status": {"$in": ["active", "coming_soon"]}}))
    for p in pathways:
        p["_id"] = str(p["_id"])
    
    # Sort by display_order/displayOrder, defaulting to 999 if not set
    pathways.sort(key=lambda x: int(x.get("display_order", x.get("displayOrder", 999))))
    return jsonify({"status": "success", "courses": pathways}), 200

@courses_bp.route("/api/company-pathways", methods=["GET"])
def get_company_pathways():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    pathways = list(db.courses.find({"pathwayType": "company", "status": {"$in": ["active", "coming_soon"]}}))
    for p in pathways:
        p["_id"] = str(p["_id"])
        
    pathways.sort(key=lambda x: int(x.get("display_order", x.get("displayOrder", 999))))
    return jsonify({"status": "success", "courses": pathways}), 200

@courses_bp.route("/api/courses", methods=["POST"])
def create_course():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"status": "error", "message": "Title is required"}), 400
        
    course_data = {
        "title": title,
        "subtitle": data.get("subtitle", ""),
        "category": data.get("category", "General"),
        "desc": data.get("desc", ""),
        "duration": data.get("duration", "10 hrs duration"),
        "level": data.get("level", "All Levels"),
        "enrolled": data.get("enrolled", "Free Access"),
        "badge": data.get("badge", "FREE"),
        "badgeClass": data.get("badgeClass", "badge-free"),
        "price": data.get("price", "Start Reading"),
        "thumbBg": data.get("thumbBg", "c-thumb-1"),
        "thumbIcon": data.get("thumbIcon", "📚"),
        "tab": data.get("tab", "Placement"),
        "is_career_pathway": bool(data.get("is_career_pathway", False)),
        "is_featured": bool(data.get("is_featured", False)),
        "display_order": int(data.get("display_order", 999)),
        "pathwayType": data.get("pathwayType", "career"),
        "status": data.get("status", "active"),
        "createdAt": datetime.utcnow()
    }
    
    res = db.courses.insert_one(course_data)
    course_data["_id"] = str(res.inserted_id)
    return jsonify({"status": "success", "course": course_data}), 201

@courses_bp.route("/api/courses/<course_id>", methods=["PUT"])
def update_course(course_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    
    update_data = {}
    fields = [
        "title", "subtitle", "category", "desc", "duration", "level", "enrolled", 
        "badge", "badgeClass", "price", "thumbBg", "thumbIcon", "tab", "status",
        "pathwayType"
    ]
    for f in fields:
        if f in data:
            update_data[f] = data[f]
            
    if "is_career_pathway" in data:
        update_data["is_career_pathway"] = bool(data["is_career_pathway"])
    if "is_featured" in data:
        update_data["is_featured"] = bool(data["is_featured"])
    if "display_order" in data:
        try:
            update_data["display_order"] = int(data["display_order"])
        except (ValueError, TypeError):
            update_data["display_order"] = 999
        
    if not update_data:
        return jsonify({"status": "error", "message": "No fields to update"}), 400
        
    res = db.courses.update_one({"_id": ObjectId(course_id)}, {"$set": update_data})
    if res.matched_count == 0:
        # Fallback simple string lookup
        res = db.courses.update_one({"_id": course_id}, {"$set": update_data})
        if res.matched_count == 0:
            return jsonify({"status": "error", "message": "Course not found"}), 404
            
    updated_course = db.courses.find_one({"_id": ObjectId(course_id)} if ObjectId.is_valid(course_id) else {"_id": course_id})
    if updated_course:
        updated_course["_id"] = str(updated_course["_id"])
        
    return jsonify({"status": "success", "course": updated_course}), 200

@courses_bp.route("/api/courses/<course_id>", methods=["DELETE"])
def delete_course(course_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    # Delete course, modules, and lessons
    course_query = {"_id": ObjectId(course_id)} if ObjectId.is_valid(course_id) else {"_id": course_id}
    res = db.courses.delete_one(course_query)
    if res.deleted_count == 0:
        return jsonify({"status": "error", "message": "Course not found"}), 404
        
    db.modules.delete_many({"course_id": course_id})
    db.lessons.delete_many({"course_id": course_id})
    
    return jsonify({"status": "success", "message": "Course and syllabus deleted successfully"}), 200

@courses_bp.route("/api/courses/<course_id>/modules", methods=["GET"])
def get_modules(course_id):
    start_total = time.time()
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    start_db = time.time()
    modules = list(db.modules.find(
        {"course_id": course_id},
        {"_id": 1, "title": 1, "order": 1, "course_id": 1}
    ).sort("order", 1))
    db_time = (time.time() - start_db) * 1000
    
    for m in modules:
        m["_id"] = str(m["_id"])
        
    total_time = (time.time() - start_total) * 1000
    logger.info(f"API: GET /api/courses/{course_id}/modules | DB Query Time: {db_time:.2f}ms | Total Response Time: {total_time:.2f}ms")
    
    return jsonify({"status": "success", "modules": modules}), 200

@courses_bp.route("/api/courses/<course_id>/modules", methods=["POST"])
def create_module(course_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"status": "error", "message": "Module title is required"}), 400
        
    module_data = {
        "course_id": course_id,
        "title": title,
        "order": int(data.get("order", 0)),
        "createdAt": datetime.utcnow()
    }
    res = db.modules.insert_one(module_data)
    module_data["_id"] = str(res.inserted_id)
    return jsonify({"status": "success", "module": module_data}), 201

@courses_bp.route("/api/modules/<module_id>", methods=["PUT"])
def update_module(module_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    title = data.get("title")
    order = data.get("order")
    
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if order is not None:
        try:
            update_data["order"] = int(order)
        except (ValueError, TypeError):
            pass
            
    if not update_data:
        return jsonify({"status": "error", "message": "No fields to update"}), 400
        
    query = {"_id": ObjectId(module_id)} if ObjectId.is_valid(module_id) else {"_id": module_id}
    res = db.modules.update_one(query, {"$set": update_data})
    
    if res.matched_count == 0:
        return jsonify({"status": "error", "message": "Module not found"}), 404
        
    updated = db.modules.find_one(query)
    if updated:
        updated["_id"] = str(updated["_id"])
        
    return jsonify({"status": "success", "module": updated}), 200

@courses_bp.route("/api/modules/<module_id>", methods=["DELETE"])
def delete_module(module_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    query = {"_id": ObjectId(module_id)} if ObjectId.is_valid(module_id) else {"_id": module_id}
    res = db.modules.delete_one(query)
    
    if res.deleted_count == 0:
        return jsonify({"status": "error", "message": "Module not found"}), 404
        
    # Clean up all lessons under this module
    db.lessons.delete_many({"module_id": module_id})
    
    return jsonify({"status": "success", "message": "Module and its lessons deleted successfully"}), 200


@courses_bp.route("/api/modules/<module_id>/lessons", methods=["GET"])
def get_lessons(module_id):
    start_total = time.time()
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    start_db = time.time()
    lessons = list(db.lessons.find(
        {"module_id": module_id},
        {
            "_id": 1,
            "title": 1,
            "description": 1,
            "video_url": 1,
            "pdf_url": 1,
            "code_url": 1,
            "files_url": 1,
            "pdf_file": 1,
            "notes_file": 1,
            "assignment_file": 1,
            "resources_file": 1,
            "order": 1,
            "module_id": 1,
            "course_id": 1
        }
    ).sort("order", 1))
    db_time = (time.time() - start_db) * 1000
    
    for l in lessons:
        l["_id"] = str(l["_id"])
        
    total_time = (time.time() - start_total) * 1000
    logger.info(f"API: GET /api/modules/{module_id}/lessons | DB Query Time: {db_time:.2f}ms | Total Response Time: {total_time:.2f}ms")
    
    return jsonify({"status": "success", "lessons": lessons}), 200

def validate_resource_url(url, source_type):
    if not url:
        return True, ""
    import re
    if source_type == "youtube":
        if not re.match(r"^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+$", url):
            return False, "Invalid YouTube URL format."
    elif source_type == "vimeo":
        if not re.match(r"^(https?://)?(www\.)?(vimeo\.com|player\.vimeo\.com)/.+$", url):
            return False, "Invalid Vimeo URL format."
    elif source_type == "github":
        if not re.match(r"^(https?://)?(www\.)?github\.com/.+$", url):
            return False, "Invalid GitHub URL format (must be github.com)."
    elif source_type == "gdrive":
        if not re.match(r"^(https?://)?(www\.)?(drive\.google\.com|docs\.google\.com)/.+$", url):
            return False, "Invalid Google Drive URL format."
    elif source_type == "onedrive":
        if not re.match(r"^(https?://)?(www\.)?(onedrive\.live\.com|1drv\.ms|sharepoint\.com)/.+$", url):
            return False, "Invalid OneDrive URL format."
    elif source_type == "dropbox":
        if not re.match(r"^(https?://)?(www\.)?(dropbox\.com|dl\.dropboxusercontent\.com)/.+$", url):
            return False, "Invalid Dropbox URL format."
    elif source_type == "external":
        if not re.match(r"^(https?://).+$", url):
            return False, "Invalid URL format (must start with http:// or https://)."
    return True, ""

@courses_bp.route("/api/modules/<module_id>/lessons", methods=["POST"])
def create_lesson(module_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"status": "error", "message": "Lesson title is required"}), 400
        
    # Perform validations
    for prefix in ["video", "notes", "sourceCode", "project"]:
        src = data.get(f"{prefix}Source")
        url = data.get(f"{prefix}Url")
        if src and src != "upload":
            ok, msg = validate_resource_url(url, src)
            if not ok:
                return jsonify({"status": "error", "message": f"{prefix.capitalize()}: {msg}"}), 400

    lesson_data = {
        "module_id": module_id,
        "course_id": data.get("course_id"),
        "title": title,
        "description": data.get("description", ""),
        "video_url": data.get("video_url", ""),
        "pdf_url": data.get("pdf_url", ""),
        "code_url": data.get("code_url", ""),
        "files_url": data.get("files_url", ""),
        "pdf_file": data.get("pdf_file", ""),
        "notes_file": data.get("notes_file", ""),
        "assignment_file": data.get("assignment_file", ""),
        "resources_file": data.get("resources_file", ""),
        "videoSource": data.get("videoSource", "upload"),
        "videoUrl": data.get("videoUrl", ""),
        "notesSource": data.get("notesSource", "upload"),
        "notesUrl": data.get("notesUrl", ""),
        "sourceCodeSource": data.get("sourceCodeSource", "upload"),
        "sourceCodeUrl": data.get("sourceCodeUrl", ""),
        "projectSource": data.get("projectSource", "upload"),
        "projectUrl": data.get("projectUrl", ""),
        "order": int(data.get("order", 0)),
        "createdAt": datetime.utcnow()
    }
    res = db.lessons.insert_one(lesson_data)
    lesson_data["_id"] = str(res.inserted_id)
    return jsonify({"status": "success", "lesson": lesson_data}), 201

@courses_bp.route("/api/lessons/<lesson_id>", methods=["PUT"])
def update_lesson(lesson_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    
    # Perform validations
    for prefix in ["video", "notes", "sourceCode", "project"]:
        src = data.get(f"{prefix}Source")
        url = data.get(f"{prefix}Url")
        if src and src != "upload":
            ok, msg = validate_resource_url(url, src)
            if not ok:
                return jsonify({"status": "error", "message": f"{prefix.capitalize()}: {msg}"}), 400

    update_data = {}
    fields = [
        "title", "description", "video_url", "pdf_url", "code_url", "files_url",
        "pdf_file", "notes_file", "assignment_file", "resources_file", "status",
        "videoSource", "videoUrl", "notesSource", "notesUrl",
        "sourceCodeSource", "sourceCodeUrl", "projectSource", "projectUrl"
    ]
    for f in fields:
        if f in data:
            update_data[f] = data[f]
            
    if "order" in data:
        try:
            update_data["order"] = int(data["order"])
        except (ValueError, TypeError):
            pass
    if "is_active" in data:
        update_data["is_active"] = bool(data["is_active"])
        
    if not update_data:
        return jsonify({"status": "error", "message": "No fields to update"}), 400
        
    query = {"_id": ObjectId(lesson_id)} if ObjectId.is_valid(lesson_id) else {"_id": lesson_id}
    res = db.lessons.update_one(query, {"$set": update_data})
    
    if res.matched_count == 0:
        return jsonify({"status": "error", "message": "Lesson not found"}), 404
        
    updated = db.lessons.find_one(query)
    if updated:
        updated["_id"] = str(updated["_id"])
        
    return jsonify({"status": "success", "lesson": updated}), 200

@courses_bp.route("/api/lessons/<lesson_id>", methods=["DELETE"])
def delete_lesson(lesson_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    query = {"_id": ObjectId(lesson_id)} if ObjectId.is_valid(lesson_id) else {"_id": lesson_id}
    res = db.lessons.delete_one(query)
    
    if res.deleted_count == 0:
        return jsonify({"status": "error", "message": "Lesson not found"}), 404
        
    return jsonify({"status": "success", "message": "Lesson deleted successfully"}), 200


# File upload endpoint
@courses_bp.route("/api/upload", methods=["POST"])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
        
    from utils.file_storage import save_file_to_gridfs
    try:
        gridfs_res = save_file_to_gridfs(file, category="course")
        file_url = f"/api/uploads/courses/{gridfs_res['file_id']}"
        return jsonify({
            "status": "success", 
            "file_url": file_url, 
            "filename": gridfs_res["filename"],
            "file_id": gridfs_res["file_id"]
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to upload to GridFS: {str(e)}"}), 500

@courses_bp.route("/api/uploads/courses/<filename_or_id>", methods=["GET"])
def get_uploaded_file(filename_or_id):
    # Try GridFS lookup if filename_or_id is a valid ObjectId
    if ObjectId.is_valid(filename_or_id):
        try:
            from utils.file_storage import get_file_from_gridfs
            from flask import send_file
            import io
            grid_out = get_file_from_gridfs(filename_or_id)
            
            # Allow videos, images, and PDFs to play/render inline in the browser
            filename_lower = grid_out.filename.lower()
            is_inline = filename_lower.endswith((".mp4", ".webm", ".ogg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf"))
            
            return send_file(
                io.BytesIO(grid_out.read()),
                mimetype=grid_out.content_type or "application/octet-stream",
                as_attachment=not is_inline,
                download_name=grid_out.filename
            )
        except Exception as e:
            pass  # Fallback to local file lookup in case it's actually a filename that looks like an ObjectId (unlikely but safe)

    # Local file fallback
    return send_from_directory(UPLOAD_FOLDER, filename_or_id)

# Course player structure route
@courses_bp.route("/api/courses/<course_id>/player", methods=["GET"])
def get_course_player_data(course_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
    
    # Support MongoDB ObjectId lookups cleanly
    course = None
    if ObjectId.is_valid(course_id):
        course = db.courses.find_one({"_id": ObjectId(course_id)})
    
    if not course:
        # Fallback check as simple string match
        course = db.courses.find_one({"_id": course_id})
        
    if not course:
        # Fallback search by old integer ID mapping if applicable
        course = db.courses.find_one({"id": int(course_id) if course_id.isdigit() else course_id})
        
    if not course:
        return jsonify({"status": "error", "message": "Course not found"}), 404
        
    course["_id"] = str(course["_id"])
    
    # Find modules and lessons
    modules = list(db.modules.find({"course_id": str(course["_id"])}))
    modules.sort(key=lambda m: m.get("order", 0))
    
    structured_modules = []
    for m in modules:
        m_id = str(m["_id"])
        lessons = list(db.lessons.find({"module_id": m_id}))
        lessons.sort(key=lambda l: l.get("order", 0))
        for l in lessons:
            l["_id"] = str(l["_id"])
            if "title" not in l or not l["title"]:
                l["title"] = l.get("lesson_name") or "Untitled Lesson"
            if "description" not in l or not l["description"]:
                l["description"] = l.get("notes") or ""
        
        structured_modules.append({
            "_id": m_id,
            "title": m.get("title") or m.get("module_name") or "Untitled Module",
            "order": m.get("order", 0),
            "lessons": lessons
        })
        
    return jsonify({
        "status": "success",
        "course": course,
        "modules": structured_modules
    }), 200


# ==========================================
# USER PROGRESS ENDPOINTS
# ==========================================

@courses_bp.route("/api/progress/<course_id>", methods=["GET"])
def get_user_progress(course_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    user_id = request.args.get("user_id", "default_user")
    
    progress_records = list(db.user_progress.find({
        "user_id": user_id,
        "course_id": course_id,
        "completed": True
    }))
    
    completed_lessons = [record["lesson_id"] for record in progress_records]
    
    return jsonify({
        "status": "success",
        "completed_lessons": completed_lessons
    }), 200

@courses_bp.route("/api/progress/complete", methods=["POST"])
def mark_lesson_complete():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    user_id = data.get("user_id", "default_user")
    course_id = data.get("course_id")
    lesson_id = data.get("lesson_id")
    completed = data.get("completed", True)
    
    if not course_id or not lesson_id:
        return jsonify({"status": "error", "message": "course_id and lesson_id are required"}), 400
        
    query = {
        "user_id": user_id,
        "course_id": str(course_id),
        "lesson_id": str(lesson_id)
    }
    
    update = {
        "$set": {
            "completed": completed,
            "completed_at": datetime.utcnow()
        }
    }
    
    db.user_progress.update_one(query, update, upsert=True)
    return jsonify({"status": "success", "message": "Progress updated"}), 200


# ==========================================
# COMMENTS & REPLIES & LIKES ENDPOINTS
# ==========================================

@courses_bp.route("/api/lessons/<lesson_id>/comments", methods=["GET"])
def get_comments(lesson_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    comments = list(db.comments.find({"lesson_id": lesson_id}))
    for c in comments:
        c["_id"] = str(c["_id"])
    comments.sort(key=lambda x: x.get("createdAt", datetime.min), reverse=True)
    return jsonify({"status": "success", "comments": comments}), 200

@courses_bp.route("/api/lessons/<lesson_id>/comments", methods=["POST"])
def add_comment(lesson_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    user_id = data.get("user_id", "default_user")
    user_name = data.get("user_name", "Anonymous Student")
    content = data.get("content")
    
    if not content:
        return jsonify({"status": "error", "message": "Content is required"}), 400
        
    comment_data = {
        "lesson_id": lesson_id,
        "user_id": user_id,
        "user_name": user_name,
        "content": content,
        "likes": [],
        "replies": [],
        "createdAt": datetime.utcnow()
    }
    
    res = db.comments.insert_one(comment_data)
    comment_data["_id"] = str(res.inserted_id)
    return jsonify({"status": "success", "comment": comment_data}), 201

@courses_bp.route("/api/comments/<comment_id>/reply", methods=["POST"])
def add_reply(comment_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    user_id = data.get("user_id", "default_user")
    user_name = data.get("user_name", "Anonymous Student")
    content = data.get("content")
    
    if not content:
        return jsonify({"status": "error", "message": "Content is required"}), 400
        
    reply_data = {
        "id": str(ObjectId()),
        "user_id": user_id,
        "user_name": user_name,
        "content": content,
        "likes": [],
        "createdAt": datetime.utcnow()
    }
    
    db.comments.update_one(
        {"_id": ObjectId(comment_id)},
        {"$push": {"replies": reply_data}}
    )
    return jsonify({"status": "success", "reply": reply_data}), 200

@courses_bp.route("/api/comments/<comment_id>/like", methods=["POST"])
def toggle_like_comment(comment_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    data = request.get_json() or {}
    user_id = data.get("user_id", "default_user")
    
    comment = db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        return jsonify({"status": "error", "message": "Comment not found"}), 404
        
    likes = comment.get("likes", [])
    if user_id in likes:
        db.comments.update_one(
            {"_id": ObjectId(comment_id)},
            {"$pull": {"likes": user_id}}
        )
        liked = False
    else:
        db.comments.update_one(
            {"_id": ObjectId(comment_id)},
            {"$push": {"likes": user_id}}
        )
        liked = True
        
    return jsonify({"status": "success", "liked": liked}), 200

