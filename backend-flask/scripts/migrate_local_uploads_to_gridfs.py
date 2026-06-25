import os
import sys
import base64
from datetime import datetime

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from utils.db import mongo_db
from utils.file_storage import save_local_file_to_gridfs, get_gridfs
from bson.objectid import ObjectId

def run_migration():
    print("=" * 60)
    print("STARTING UPLOADS MIGRATION TO GRIDFS")
    print("=" * 60)
    
    db = mongo_db.get_db()
    if db is None:
        print("Error: Database connection is not available.")
        return

    fs = get_gridfs()
    if not fs:
        print("Error: GridFS could not be initialized.")
        return

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    resumes_dir = os.path.join(base_dir, "uploads", "resumes")
    profile_dir = os.path.join(base_dir, "uploads", "profile")
    admin_dir = os.path.join(base_dir, "uploads", "admin")
    courses_dir = os.path.join(base_dir, "uploads", "courses")

    stats = {
        "leads_migrated": 0,
        "leads_skipped": 0,
        "leads_restored_from_b64": 0,
        "profiles_migrated": 0,
        "profiles_skipped": 0,
        "contacts_migrated": 0,
        "contacts_skipped": 0,
        "errors": 0
    }

    # 1. Migrate Resumes in Leads
    print("\n[1/3] Migrating Leads Resumes...")
    for lead in db.leads.find({"resume": {"$exists": True}}):
        resume = lead.get("resume")
        if not resume or not isinstance(resume, dict):
            continue

        if "file_id" in resume:
            stats["leads_skipped"] += 1
            continue

        filename = resume.get("filepath")
        gridfs_res = None

        if filename:
            local_path = os.path.join(resumes_dir, filename)
            if os.path.exists(local_path):
                try:
                    gridfs_res = save_local_file_to_gridfs(local_path, category="resume")
                    stats["leads_migrated"] += 1
                    print(f"  Migrated local resume for Lead '{lead.get('name')}': {filename}")
                except Exception as e:
                    print(f"  Error migrating local resume for Lead '{lead.get('name')}': {str(e)}")
                    stats["errors"] += 1

        # Self-healing fallback: Restore from base64 if local file is missing
        if not gridfs_res and "file_data" in resume:
            try:
                file_bytes = base64.b64decode(resume["file_data"])
                # Save base64 data to GridFS directly
                file_metadata = {
                    "category": "resume",
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "size": len(file_bytes),
                    "recovered_from_base64": True
                }
                file_id = fs.put(
                    file_bytes,
                    filename=resume.get("filename", "resume.pdf"),
                    content_type="application/pdf" if resume.get("filename", "").lower().endswith(".pdf") else "application/octet-stream",
                    metadata=file_metadata
                )
                gridfs_res = {
                    "file_id": str(file_id),
                    "filename": resume.get("filename", "resume.pdf"),
                    "content_type": "application/pdf" if resume.get("filename", "").lower().endswith(".pdf") else "application/octet-stream",
                    "size": len(file_bytes)
                }
                stats["leads_restored_from_b64"] += 1
                print(f"  Restored resume from Base64 for Lead '{lead.get('name')}': {resume.get('filename')}")
            except Exception as e:
                print(f"  Error restoring Base64 for Lead '{lead.get('name')}': {str(e)}")
                stats["errors"] += 1

        if gridfs_res:
            db.leads.update_one(
                {"_id": lead["_id"]},
                {
                    "$set": {
                        "resume.file_id": gridfs_res["file_id"],
                        "resume.content_type": gridfs_res["content_type"],
                        "resume.size": gridfs_res["size"]
                    },
                    "$unset": {"resume.file_data": ""} # Clean up base64 field to save document space
                }
            )
            # Sync back to db.resumes collection
            db.resumes.update_many(
                {"leadId": str(lead["_id"])},
                {"$set": {"file_id": gridfs_res["file_id"]}}
            )
        else:
            stats["leads_skipped"] += 1

    # 2. Migrate Profile Images
    print("\n[2/3] Migrating Admin Profiles...")
    for profile in db.admin_profiles.find():
        img_url = profile.get("profileImage")
        if not img_url:
            stats["profiles_skipped"] += 1
            continue

        if "/api/admin/profile-image/" in img_url:
            stats["profiles_skipped"] += 1
            continue

        filename = os.path.basename(img_url)
        local_path = None
        
        # Check profile dir
        if "/api/uploads/profile/" in img_url:
            local_path = os.path.join(profile_dir, filename)
        elif "/api/uploads/admin/" in img_url:
            local_path = os.path.join(admin_dir, filename)

        if local_path and os.path.exists(local_path):
            try:
                gridfs_res = save_local_file_to_gridfs(local_path, category="profile")
                new_url = f"/api/admin/profile-image/{gridfs_res['file_id']}"
                db.admin_profiles.update_one(
                    {"_id": profile["_id"]},
                    {"$set": {"profileImage": new_url}}
                )
                stats["profiles_migrated"] += 1
                print(f"  Migrated profile image for Admin '{profile.get('name')}': {filename}")
            except Exception as e:
                print(f"  Error migrating profile image for Admin '{profile.get('name')}': {str(e)}")
                stats["errors"] += 1
        else:
            stats["profiles_skipped"] += 1

    # 3. Migrate Contact Form Resumes
    print("\n[3/3] Migrating Contacts Resumes...")
    for contact in db.contacts.find({"resume_file": {"$exists": True, "$ne": None}}):
        resume_file = contact.get("resume_file")
        if ObjectId.is_valid(resume_file): # Already migrated
            stats["contacts_skipped"] += 1
            continue

        filename = os.path.basename(resume_file)
        local_path = os.path.join(resumes_dir, filename)
        
        if os.path.exists(local_path):
            try:
                gridfs_res = save_local_file_to_gridfs(local_path, category="resume")
                db.contacts.update_one(
                    {"_id": contact["_id"]},
                    {"$set": {"resume_file": gridfs_res["file_id"]}}
                )
                stats["contacts_migrated"] += 1
                print(f"  Migrated contact resume for '{contact.get('name')}': {filename}")
            except Exception as e:
                print(f"  Error migrating contact resume for '{contact.get('name')}': {str(e)}")
                stats["errors"] += 1
        else:
            stats["contacts_skipped"] += 1

    print("\n" + "=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Leads Resumes Migrated:        {stats['leads_migrated']}")
    print(f"Leads Resumes Restored (B64):  {stats['leads_restored_from_b64']}")
    print(f"Leads Resumes Skipped:         {stats['leads_skipped']}")
    print(f"Profiles Migrated:             {stats['profiles_migrated']}")
    print(f"Profiles Skipped:              {stats['profiles_skipped']}")
    print(f"Contacts Resumes Migrated:     {stats['contacts_migrated']}")
    print(f"Contacts Resumes Skipped:      {stats['contacts_skipped']}")
    print(f"Total Errors/Warnings:         {stats['errors']}")
    print("=" * 60)

if __name__ == "__main__":
    with app.app_context():
        run_migration()
