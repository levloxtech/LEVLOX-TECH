import os
import gridfs
import mimetypes
import hashlib
import re
import uuid
from bson.objectid import ObjectId
from datetime import datetime
from utils.db import mongo_db

DEFAULT_SETTINGS = {
    "hero_video": {
        "max_size_mb": 100,
        "allowed_extensions": ["mp4", "webm", "mov"]
    },
    "resume": {
        "max_size_mb": 3,
        "allowed_extensions": ["pdf", "doc", "docx"]
    },
    "profile_image": {
        "max_size_mb": 2,
        "allowed_extensions": ["jpg", "jpeg", "png", "webp"]
    },
    "certificate": {
        "max_size_mb": 5,
        "allowed_extensions": ["pdf", "png", "jpg"]
    }
}

def get_gridfs():
    """Helper to retrieve the GridFS instance for the current database connection."""
    db = mongo_db.get_db()
    if db is None:
        return None
    return gridfs.GridFS(db)

def get_upload_settings():
    """Fetches upload limits and rules from DB, or seeds defaults if empty."""
    db = mongo_db.get_db()
    if db is None:
        return DEFAULT_SETTINGS
    
    settings_doc = db.upload_settings.find_one({"type": "file_upload_limits"})
    if not settings_doc:
        doc = {"type": "file_upload_limits", "settings": DEFAULT_SETTINGS}
        db.upload_settings.insert_one(doc)
        return DEFAULT_SETTINGS
    
    return settings_doc.get("settings", DEFAULT_SETTINGS)

def update_upload_settings(new_settings):
    """Updates upload limits in DB."""
    db = mongo_db.get_db()
    if db is None:
        raise Exception("Database not initialized")
    
    # Merge/overwrite limits safely
    db.upload_settings.update_one(
        {"type": "file_upload_limits"},
        {"$set": {"settings": new_settings}},
        upsert=True
    )
    return get_upload_settings()

def sanitize_filename(filename):
    """Removes invalid characters and spaces, keeping only safe alphanumeric, dots, hyphens, and underscores."""
    if not filename:
        return f"{uuid.uuid4().hex[:12]}_file"
    
    # Remove path elements if any
    base = os.path.basename(filename)
    
    # Extract extension
    parts = base.rsplit(".", 1)
    name = parts[0]
    ext = parts[1].lower() if len(parts) > 1 else ""
    
    # Remove invalid characters from name
    name = re.sub(r'[^a-zA-Z0-9_\-]', '', name.replace(' ', '_'))
    if not name:
        name = "file"
        
    sanitized = f"{name}.{ext}" if ext else name
    # Prepend a unique short UUID to avoid collisions
    return f"{uuid.uuid4().hex[:12]}_{sanitized}"

def calculate_sha256(file_bytes):
    """Computes SHA256 of the given file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()

def validate_file(file_storage, category):
    """
    Validates a file storage object according to dynamic settings for the given category.
    Returns (is_valid, error_message, file_content, content_type)
    """
    if not file_storage or file_storage.filename == "":
        return False, "No file selected or empty file.", None, None
        
    filename = file_storage.filename
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    # Load limits
    settings = get_upload_settings()
    category_config = settings.get(category)
    if not category_config:
        return False, f"Unknown upload category: {category}", None, None
        
    allowed_exts = category_config.get("allowed_extensions", [])
    max_size_mb = category_config.get("max_size_mb", 1)
    
    # 1. Extension validation
    if ext not in allowed_exts:
        return False, f"Only {', '.join(allowed_exts).upper()} files are allowed.", None, None
        
    # Read file content safely to validate size
    file_storage.seek(0, os.SEEK_END)
    size_bytes = file_storage.tell()
    file_storage.seek(0)
    
    # 2. Check for empty files
    if size_bytes == 0:
        return False, "File is empty (0 bytes).", None, None
        
    # 3. Size validation
    max_bytes = max_size_mb * 1024 * 1024
    if size_bytes > max_bytes:
        # Custom message formatting based on category rules
        if category == "resume":
            return False, f"Resume must be less than {max_size_mb} MB.", None, None
        return False, f"File size exceeds maximum allowed limit of {max_size_mb} MB.", None, None

    # Read bytes for checksum and storage
    file_content = file_storage.read()
    file_storage.seek(0) # reset stream
    
    # 4. Check for duplicate upload
    fs = get_gridfs()
    if fs:
        sha256_hash = calculate_sha256(file_content)
        # Search by sha256 hash in metadata
        existing = fs.find_one({"metadata.sha256": sha256_hash})
        if existing:
            return False, "Duplicate upload detected. This file has already been uploaded.", None, None

    content_type = file_storage.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    
    return True, None, file_content, content_type

def save_file_to_gridfs(file_storage, category="general", metadata=None):
    """
    Saves a Werkzeug/Flask FileStorage object to MongoDB GridFS.
    Applies sanitization and validation.
    Returns metadata dict.
    """
    is_valid, err_msg, file_content, content_type = validate_file(file_storage, category)
    if not is_valid:
        raise ValueError(err_msg)

    fs = get_gridfs()
    if not fs:
        raise Exception("Database/GridFS not initialized")

    original_filename = file_storage.filename
    sanitized_name = sanitize_filename(original_filename)
    size = len(file_content)
    sha256_hash = calculate_sha256(file_content)
    
    file_metadata = {
        "category": category,
        "uploaded_at": datetime.utcnow().isoformat(),
        "size": size,
        "sha256": sha256_hash,
        "original_filename": original_filename
    }
    if metadata:
        file_metadata.update(metadata)

    # Save to GridFS
    file_id = fs.put(
        file_content,
        filename=sanitized_name,
        content_type=content_type,
        metadata=file_metadata
    )
    
    return {
        "file_id": str(file_id),
        "filename": sanitized_name,
        "original_filename": original_filename,
        "content_type": content_type,
        "size": size,
        "category": category
    }

def get_file_from_gridfs(file_id):
    """
    Retrieves a file from GridFS by its file_id (string or ObjectId).
    Returns GridOut object which behaves like a file-like stream.
    """
    fs = get_gridfs()
    if not fs:
        raise Exception("Database/GridFS not initialized")

    if isinstance(file_id, str):
        file_id = ObjectId(file_id)

    return fs.get(file_id)

def delete_file_from_gridfs(file_id):
    """
    Deletes a file from GridFS by its file_id (string or ObjectId).
    """
    fs = get_gridfs()
    if not fs:
        raise Exception("Database/GridFS not initialized")

    if isinstance(file_id, str):
        file_id = ObjectId(file_id)

    fs.delete(file_id)
