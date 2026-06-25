import os
import gridfs
import mimetypes
from bson.objectid import ObjectId
from datetime import datetime
from utils.db import mongo_db

def get_gridfs():
    """Helper to retrieve the GridFS instance for the current database connection."""
    db = mongo_db.get_db()
    if db is None:
        return None
    return gridfs.GridFS(db)

def save_file_to_gridfs(file_storage, category="general", metadata=None):
    """
    Saves a Werkzeug/Flask FileStorage object to MongoDB GridFS.
    Returns metadata dict.
    """
    fs = get_gridfs()
    if not fs:
        raise Exception("Database/GridFS not initialized")

    filename = file_storage.filename
    content_type = file_storage.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    
    # Read file content
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)
    
    file_content = file_storage.read()
    
    file_metadata = {
        "category": category,
        "uploaded_at": datetime.utcnow().isoformat(),
        "size": size
    }
    if metadata:
        file_metadata.update(metadata)

    # Save to GridFS
    file_id = fs.put(
        file_content,
        filename=filename,
        content_type=content_type,
        metadata=file_metadata
    )
    
    return {
        "file_id": str(file_id),
        "filename": filename,
        "content_type": content_type,
        "size": size,
        "category": category
    }

def save_local_file_to_gridfs(file_path, category="general", metadata=None):
    """
    Reads a local file and saves it to MongoDB GridFS.
    Used primarily for migrations.
    """
    fs = get_gridfs()
    if not fs:
        raise Exception("Database/GridFS not initialized")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Local file not found: {file_path}")

    filename = os.path.basename(file_path)
    content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    size = os.path.getsize(file_path)

    with open(file_path, "rb") as f:
        file_content = f.read()

    file_metadata = {
        "category": category,
        "uploaded_at": datetime.utcnow().isoformat(),
        "size": size,
        "migrated_from": file_path
    }
    if metadata:
        file_metadata.update(metadata)

    # Save to GridFS
    file_id = fs.put(
        file_content,
        filename=filename,
        content_type=content_type,
        metadata=file_metadata
    )

    return {
        "file_id": str(file_id),
        "filename": filename,
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
