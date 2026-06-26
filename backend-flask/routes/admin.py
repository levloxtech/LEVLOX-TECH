from flask import Blueprint, jsonify, request, send_from_directory
from utils.db import mongo_db
from datetime import datetime
import os
import werkzeug.utils

admin_bp = Blueprint("admin", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "admin")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token

@admin_bp.route("/api/admin/profile", methods=["GET"])
@jwt_required()
def get_admin_profile():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    current_email = get_jwt_identity()
    profile = db.admin_profiles.find_one({"email": current_email})
    if not profile:
        # Seed default profile if not present
        default_profile = {
            "name": "Sri Aakash",
            "email": current_email,
            "phone": "+91 98765 43210",
            "role": "Super Admin",
            "company": "Levlox Tech",
            "location": "Bangalore, India",
            "bio": "CRM & Systems Administrator at Levlox Tech.",
            "profileImage": "",
            "accountStatus": "Active",
            "lastLogin": datetime.utcnow().strftime("%B %d, %Y %I:%M %p"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        db.admin_profiles.insert_one(default_profile)
        profile = default_profile

    profile["_id"] = str(profile["_id"])
    return jsonify({"status": "success", "profile": profile}), 200

@admin_bp.route("/api/admin/profile", methods=["POST", "PUT"])
@jwt_required()
def update_admin_profile():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    current_email = get_jwt_identity()
    data = request.get_json() or {}
    
    # Handle image upload if sent via multipart/form-data instead of json
    if request.content_type and "multipart/form-data" in request.content_type:
        # We can extract text fields from request.form
        data = request.form.to_dict()
        if 'profileImage' in request.files:
            file = request.files['profileImage']
            if file.filename != '':
                from utils.file_storage import save_file_to_gridfs
                try:
                    gridfs_res = save_file_to_gridfs(file, category="profile_image")
                    data["profileImage"] = f"/api/admin/profile-image/{gridfs_res['file_id']}"
                except ValueError as val_err:
                    return jsonify({"status": "error", "message": str(val_err)}), 400
                except Exception as e:
                    return jsonify({"status": "error", "message": f"Failed to save profile image: {str(e)}"}), 500

    # Prepare update query
    update_data = {}
    allowed_keys = ["name", "email", "phone", "role", "company", "location", "bio", "profileImage"]
    for key in allowed_keys:
        if key in data:
            update_data[key] = data[key]
            
    # Also handle password change if requested
    new_password = data.get("password")
    if new_password:
        # Update admin user password in users collection
        db.users.update_one(
            {"email": current_email},
            {"$set": {"password": new_password}}
        )
        
    update_data["updatedAt"] = datetime.utcnow()
    
    # If email is updated, we must update the users collection as well so they can log in with new email!
    new_email = update_data.get("email")
    if new_email and new_email != current_email:
        # Check if the new email is already taken in users collection
        existing_user = db.users.find_one({"email": new_email})
        if existing_user:
            return jsonify({"status": "error", "message": "Email address already in use by another user"}), 400
            
        # Update users collection email
        db.users.update_one(
            {"email": current_email},
            {"$set": {"email": new_email}}
        )
        
    db.admin_profiles.update_one(
        {"email": current_email},
        {"$set": update_data},
        upsert=True
    )
    
    # Retrieve updated profile
    final_email = new_email if new_email else current_email
    profile = db.admin_profiles.find_one({"email": final_email})
    profile["_id"] = str(profile["_id"])
    
    # Generate new token if email changed
    response_data = {
        "status": "success",
        "message": "Profile updated successfully",
        "profile": profile
    }
    if new_email and new_email != current_email:
        new_token = create_access_token(identity=new_email)
        response_data["token"] = new_token
        
    # Log CRM action
    mongo_db.log_activity("Admin Profile details updated.")
    
    return jsonify(response_data), 200

@admin_bp.route("/api/admin/profile-image", methods=["DELETE"])
def delete_profile_image():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    db.admin_profiles.update_one(
        {"email": "admin@levlox.com"},
        {"$set": {"profileImage": "", "updatedAt": datetime.utcnow()}}
    )
    
    profile = db.admin_profiles.find_one({"email": "admin@levlox.com"})
    profile["_id"] = str(profile["_id"])
    
    return jsonify({"status": "success", "message": "Profile image removed", "profile": profile}), 200

@admin_bp.route("/api/uploads/admin/<filename>", methods=["GET"])
def get_admin_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@admin_bp.route("/api/admin/profile-image/<file_id>", methods=["GET"])
def get_gridfs_profile_image(file_id):
    """Serve profile image from GridFS."""
    try:
        from utils.file_storage import get_file_from_gridfs
        from flask import send_file
        import io
        grid_out = get_file_from_gridfs(file_id)
        return send_file(
            io.BytesIO(grid_out.read()),
            mimetype=grid_out.content_type or "image/jpeg"
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 404

@admin_bp.route("/api/admin/upload-profile", methods=["POST"])
def upload_admin_profile_image():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    if 'profileImage' not in request.files:
        return jsonify({"status": "error", "message": "No profileImage file part"}), 400
        
    file = request.files['profileImage']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
        
    from utils.file_storage import save_file_to_gridfs
    try:
        gridfs_res = save_file_to_gridfs(file, category="profile_image")
        image_url = f"/api/admin/profile-image/{gridfs_res['file_id']}"
    except ValueError as val_err:
        return jsonify({"status": "error", "message": str(val_err)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to save profile image: {str(e)}"}), 500
    
    # Update MongoDB admin_profiles collection
    db.admin_profiles.update_one(
        {"email": "admin@levlox.com"},
        {"$set": {"profileImage": image_url, "updatedAt": datetime.utcnow()}},
        upsert=True
    )
    
    profile = db.admin_profiles.find_one({"email": "admin@levlox.com"})
    profile["_id"] = str(profile["_id"])
    
    # Log CRM action
    mongo_db.log_activity("Admin Profile photo uploaded.")
    
    return jsonify({"status": "success", "message": "Profile image uploaded successfully", "profile": profile}), 200

@admin_bp.route("/api/uploads/profile/<filename>", methods=["GET"])
def get_profile_uploaded_file(filename):
    PROFILE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "profile")
    return send_from_directory(PROFILE_UPLOAD_FOLDER, filename)

@admin_bp.route("/api/admin/hero-video", methods=["POST"])
@jwt_required()
def upload_hero_video():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    current_email = get_jwt_identity()
    # Check admin role
    profile = db.admin_profiles.find_one({"email": current_email})
    if not profile and current_email != "admin@levlox.com":
        return jsonify({"status": "error", "message": "Unauthorized. Admin access required."}), 403

    if 'hero_video' not in request.files:
        return jsonify({"status": "error", "message": "No hero_video file part"}), 400
        
    file = request.files['hero_video']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    from utils.file_storage import save_file_to_gridfs, delete_file_from_gridfs
    try:
        # Save to GridFS (category: "hero_video")
        gridfs_res = save_file_to_gridfs(file, category="hero_video")
    except ValueError as val_err:
        return jsonify({"status": "error", "message": str(val_err)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to upload video: {str(e)}"}), 500

    # Look for previous active hero video to delete it from GridFS
    try:
        previous_active = db.hero_videos.find_one({"status": "active"})
        if previous_active:
            prev_file_id = previous_active.get("file_id")
            if prev_file_id:
                try:
                    delete_file_from_gridfs(prev_file_id)
                except Exception:
                    pass # ignore deletion errors for robustness
            db.hero_videos.delete_one({"_id": previous_active["_id"]})
    except Exception:
        pass

    now = datetime.utcnow()
    # Insert new active video
    video_doc = {
        "file_id": gridfs_res["file_id"],
        "filename": gridfs_res["filename"],
        "original_filename": gridfs_res["original_filename"],
        "content_type": gridfs_res["content_type"],
        "size": gridfs_res["size"],
        "uploaded_at": now.isoformat(),
        "status": "active"
    }
    
    db.hero_videos.insert_one(video_doc)
    video_doc["_id"] = str(video_doc["_id"])
    
    mongo_db.log_activity(f"Uploaded new active Hero Video: {gridfs_res['original_filename']}")
    mongo_db.create_notification("Hero Video Update", f"New Hero Video active: {gridfs_res['original_filename']}")
    
    return jsonify({
        "status": "success",
        "message": "Hero Video uploaded and activated successfully",
        "video": video_doc
    }), 200

@admin_bp.route("/api/hero-video/active/metadata", methods=["GET"])
def get_public_active_video_metadata():
    """Retrieve metadata of the currently active hero video for the public website."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    video = db.hero_videos.find_one({"status": "active"})
    if not video:
        return jsonify({
            "status": "success",
            "video": {
                "url": "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
                "filename": "Fallback YouTube Video",
                "uploadDate": None,
                "thumbnailUrl": None
            }
        }), 200
        
    thumbnail_url = "/api/hero-video/active/thumbnail" if video.get("thumbnail_file_id") else None
    return jsonify({
        "status": "success",
        "video": {
            "url": "/api/hero-video/active",
            "filename": video.get("original_filename") or video.get("filename"),
            "uploadDate": video.get("uploaded_at"),
            "thumbnailUrl": thumbnail_url
        }
    }), 200

@admin_bp.route("/api/admin/hero-video/thumbnail", methods=["POST"])
@jwt_required()
def upload_hero_video_thumbnail():
    """Upload thumbnail image for the active Hero Video."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    current_email = get_jwt_identity()
    # Check admin role
    profile = db.admin_profiles.find_one({"email": current_email})
    if not profile and current_email != "admin@levlox.com":
        return jsonify({"status": "error", "message": "Unauthorized. Admin access required."}), 403

    active_video = db.hero_videos.find_one({"status": "active"})
    if not active_video:
        return jsonify({"status": "error", "message": "Please upload a Hero Video first before setting its thumbnail."}), 400

    if 'hero_thumbnail' not in request.files:
        return jsonify({"status": "error", "message": "No hero_thumbnail file part"}), 400
        
    file = request.files['hero_thumbnail']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    from utils.file_storage import save_file_to_gridfs, delete_file_from_gridfs
    try:
        # Save to GridFS (category: "profile_image" config limits used as fallback, i.e., 2MB images)
        gridfs_res = save_file_to_gridfs(file, category="profile_image")
    except ValueError as val_err:
        return jsonify({"status": "error", "message": str(val_err)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to upload thumbnail: {str(e)}"}), 500

    # Delete previous thumbnail if exists
    prev_thumb_id = active_video.get("thumbnail_file_id")
    if prev_thumb_id:
        try:
            delete_file_from_gridfs(prev_thumb_id)
        except Exception:
            pass

    # Update active video document with thumbnail ID
    db.hero_videos.update_one(
        {"_id": active_video["_id"]},
        {"$set": {"thumbnail_file_id": gridfs_res["file_id"]}}
    )

    thumbnail_url = "/api/hero-video/active/thumbnail"
    mongo_db.log_activity(f"Uploaded new thumbnail for Hero Video: {active_video['original_filename']}")
    
    return jsonify({
        "status": "success",
        "message": "Hero video thumbnail uploaded successfully",
        "thumbnailUrl": thumbnail_url
    }), 200

@admin_bp.route("/api/hero-video/active/thumbnail", methods=["GET"])
def get_active_hero_video_thumbnail():
    """Serves the active hero video thumbnail from GridFS."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    video = db.hero_videos.find_one({"status": "active"})
    if not video or not video.get("thumbnail_file_id"):
        return jsonify({"status": "error", "message": "No active thumbnail found"}), 404
        
    from utils.file_storage import get_file_from_gridfs
    from flask import Response
    
    try:
        grid_out = get_file_from_gridfs(video["thumbnail_file_id"])
        return Response(grid_out.read(), mimetype=grid_out.content_type)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 404

@admin_bp.route("/api/admin/hero-video/active/metadata", methods=["GET"])
@jwt_required()
def get_active_video_metadata():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    video = db.hero_videos.find_one({"status": "active"})
    if not video:
        return jsonify({"status": "success", "video": None}), 200
        
    video["_id"] = str(video["_id"])
    return jsonify({"status": "success", "video": video}), 200

@admin_bp.route("/api/hero-video/active", methods=["GET"])
def get_active_hero_video():
    """Streams the active hero video with full support for HTML5 range headers."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500
        
    video = db.hero_videos.find_one({"status": "active"})
    if not video:
        return jsonify({"status": "error", "message": "No active hero video found"}), 404
        
    from utils.file_storage import get_file_from_gridfs
    from flask import Response
    
    try:
        grid_out = get_file_from_gridfs(video["file_id"])
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to retrieve video stream: {str(e)}"}), 404

    range_header = request.headers.get('Range', None)
    if not range_header:
        # Full content response
        def generate():
            grid_out.seek(0)
            while True:
                chunk = grid_out.read(8192 * 16)
                if not chunk:
                    break
                yield chunk
        return Response(generate(), mimetype=grid_out.content_type, headers={
            "Content-Length": str(grid_out.length),
            "Accept-Ranges": "bytes"
        })
    
    # Parse Range Header (bytes=start-end)
    try:
        byte_ranges = range_header.replace('bytes=', '').split('-')
        start = int(byte_ranges[0])
        end = int(byte_ranges[1]) if byte_ranges[1] else grid_out.length - 1
    except Exception:
        return Response("Range Format Invalid", status=400)
        
    if start >= grid_out.length:
        return Response("Range Not Satisfiable", status=416)
        
    chunk_size = end - start + 1
    grid_out.seek(start)
    
    def generate_range():
        remaining = chunk_size
        while remaining > 0:
            read_size = min(remaining, 8192 * 16)
            chunk = grid_out.read(read_size)
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk
            
    return Response(
        generate_range(), 
        status=206, 
        mimetype=grid_out.content_type, 
        headers={
            "Content-Range": f"bytes {start}-{end}/{grid_out.length}",
            "Content-Length": str(chunk_size),
            "Accept-Ranges": "bytes"
        }
    )
