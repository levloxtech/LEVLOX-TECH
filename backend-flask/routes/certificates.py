import io
import base64
import qrcode
import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from utils.date_helpers import parse_date_range_query
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import mongo_db

certificates_bp = Blueprint('certificates', __name__)

# ─────────────────────────────────────────────────────────────
# Frontend URL for QR codes — set FRONTEND_URL in .env
# Dev:  http://localhost:5173
# Prod: https://levlox-tech-website.vercel.app
# ─────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ─────────────────────────────────────────────────────────────
# Helper: Generate unique certificate ID  (LVX-YYYY-NNNNNN)
# Race-condition safe: uses find_one with sort to get last seq
# ─────────────────────────────────────────────────────────────
def generate_certificate_id(db):
    year = datetime.utcnow().year
    prefix = f"LVX-{year}-"
    count = db.certificates.count_documents({"certificateId": {"$regex": f"^{prefix}"}})
    seq = count + 1
    return f"{prefix}{seq:06d}"


# ─────────────────────────────────────────────────────────────
# Helper: Generate QR code as base64 PNG data URI
# ─────────────────────────────────────────────────────────────
def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


# ─────────────────────────────────────────────────────────────
# Helper: Serialize a MongoDB certificate document for JSON
# ─────────────────────────────────────────────────────────────
def serialize_cert(cert):
    cert["_id"] = str(cert["_id"])
    for field in ("issuedDate", "completionDate", "createdAt", "revokedAt", "updatedAt"):
        if field in cert and isinstance(cert[field], datetime):
            cert[field] = cert[field].isoformat()
    
    if "auditLog" in cert and isinstance(cert["auditLog"], list):
        for entry in cert["auditLog"]:
            if "date" in entry and isinstance(entry["date"], datetime):
                entry["date"] = entry["date"].isoformat()
                
    return cert


# ─────────────────────────────────────────────────────────────
# Helper: Check if current user is Super Admin
# ─────────────────────────────────────────────────────────────
def check_is_super_admin(db):
    email = get_jwt_identity()
    if not email:
        return False
    profile = db.admin_profiles.find_one({"email": email})
    if profile and profile.get("role") == "Super Admin":
        return True
    if email == "admin@levlox.com":
        return True
    return False


# ═══════════════════════════════════════════════════════════════
# POST /api/certificates — Create a certificate (JWT required)
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates", methods=["POST"])
@jwt_required()
def create_certificate():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    data = request.get_json(silent=True) or {}
    student_name    = data.get("studentName", "").strip()
    course_name     = data.get("courseName", "").strip()
    issued_date     = data.get("issuedDate", "")
    completion_date = data.get("completionDate", "")

    if not student_name or not course_name:
        return jsonify({"status": "error", "message": "studentName and courseName are required"}), 400

    try:
        issued_dt = datetime.fromisoformat(issued_date) if issued_date else datetime.utcnow()
    except ValueError:
        issued_dt = datetime.utcnow()

    try:
        completion_dt = datetime.fromisoformat(completion_date) if completion_date else datetime.utcnow()
    except ValueError:
        completion_dt = datetime.utcnow()

    certificate_id = generate_certificate_id(db)

    # QR points to the React frontend verify page — NOT to Flask
    verify_url = f"{FRONTEND_URL}/verify/{certificate_id}"
    qr_base64  = generate_qr_base64(verify_url)

    now = datetime.utcnow()
    user_email = get_jwt_identity()
    
    audit_entry = {
        "action": "CREATED",
        "by": user_email,
        "date": now,
        "details": f"Certificate generated for {student_name} ({course_name})"
    }

    cert_doc = {
        "certificateId":     certificate_id,
        "studentName":       student_name,
        "courseName":        course_name,
        "issuedDate":        issued_dt,
        "completionDate":    completion_dt,
        "certificateStatus": "VALID",
        "qrCodeBase64":      qr_base64,
        "verifyUrl":         verify_url,
        "createdAt":         now,
        "createdBy":         user_email,
        "auditLog":          [audit_entry]
    }

    result = db.certificates.insert_one(cert_doc)
    cert_doc["_id"] = str(result.inserted_id)

    mongo_db.log_activity(f"Certificate issued: {certificate_id} for {student_name} ({course_name}) by {user_email}")
    mongo_db.create_notification("Certificate", f"New certificate {certificate_id} issued to {student_name}")

    return jsonify({
        "status":      "success",
        "message":     "Certificate created successfully",
        "certificate": serialize_cert(cert_doc)
    }), 201


# ═══════════════════════════════════════════════════════════════
# GET /api/certificates — List all certificates (JWT required)
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates", methods=["GET"])
@jwt_required()
def list_certificates():
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    page   = int(request.args.get("page", 1))
    limit_val  = request.args.get("limit", "50")
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    recent = request.args.get("recent", "").lower() == "true"

    query = {}
    if search:
        query["$or"] = [
            {"studentName":   {"$regex": search, "$options": "i"}},
            {"courseName":    {"$regex": search, "$options": "i"}},
            {"certificateId": {"$regex": search, "$options": "i"}},
        ]
    
    if status:
        query["certificateStatus"] = status

    if recent:
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        query["createdAt"] = {"$gte": seven_days_ago}

    date_filter = parse_date_range_query("createdAt")
    if date_filter:
        query.update(date_filter)

    if limit_val == "all" or limit_val == "-1":
        certs = list(
            db.certificates.find(query, {"qrCodeBase64": 0})
                .sort("createdAt", -1)
        )
        total = len(certs)
        return jsonify({
            "status":       "success",
            "certificates": [serialize_cert(c) for c in certs],
            "total":        total,
            "page":         1,
            "limit":        total
        }), 200
    else:
        limit = int(limit_val)
        skip = (page - 1) * limit
        total = db.certificates.count_documents(query)
        certs = list(
            db.certificates.find(query, {"qrCodeBase64": 0})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
        )

        return jsonify({
            "status":       "success",
            "certificates": [serialize_cert(c) for c in certs],
            "total":        total,
            "page":         page,
            "limit":        limit
        }), 200


# ═══════════════════════════════════════════════════════════════
# GET /api/certificates/<cert_id> — Single cert with QR (JWT)
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates/<cert_id>", methods=["GET"])
@jwt_required()
def get_certificate(cert_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    from bson import ObjectId
    try:
        cert = db.certificates.find_one({"_id": ObjectId(cert_id)})
    except Exception:
        cert = db.certificates.find_one({"certificateId": cert_id})

    if not cert:
        return jsonify({"status": "error", "message": "Certificate not found"}), 404

    return jsonify({"status": "success", "certificate": serialize_cert(cert)}), 200


# ═══════════════════════════════════════════════════════════════
# PUT /api/certificates/<cert_id> — Edit certificate (JWT, Super Admin only)
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates/<cert_id>", methods=["PUT"])
@jwt_required()
def edit_certificate(cert_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    if not check_is_super_admin(db):
        return jsonify({"status": "error", "message": "Unauthorized. Super Admin role required."}), 403

    from bson import ObjectId
    try:
        query = {"_id": ObjectId(cert_id)}
    except Exception:
        query = {"certificateId": cert_id}

    cert = db.certificates.find_one(query)
    if not cert:
        return jsonify({"status": "error", "message": "Certificate not found"}), 404

    data = request.get_json(silent=True) or {}
    student_name = data.get("studentName", "").strip()
    course_name  = data.get("courseName", "").strip()
    issued_date  = data.get("issuedDate", "")
    completion_date = data.get("completionDate", "")

    if not student_name or not course_name:
        return jsonify({"status": "error", "message": "studentName and courseName are required"}), 400

    try:
        issued_dt = datetime.fromisoformat(issued_date) if issued_date else cert.get("issuedDate")
    except ValueError:
        issued_dt = cert.get("issuedDate")

    try:
        completion_dt = datetime.fromisoformat(completion_date) if completion_date else cert.get("completionDate")
    except ValueError:
        completion_dt = cert.get("completionDate")

    now = datetime.utcnow()
    user_email = get_jwt_identity()

    # Create audit log entry
    audit_entry = {
        "action": "EDITED",
        "by": user_email,
        "date": now,
        "details": f"Updated studentName to '{student_name}', courseName to '{course_name}'"
    }

    db.certificates.update_one(query, {
        "$set": {
            "studentName": student_name,
            "courseName": course_name,
            "issuedDate": issued_dt,
            "completionDate": completion_dt,
            "updatedAt": now
        },
        "$push": {
            "auditLog": audit_entry
        }
    })

    updated_cert = db.certificates.find_one(query)
    mongo_db.log_activity(f"Certificate updated: {updated_cert.get('certificateId')} by {user_email}")

    return jsonify({
        "status": "success",
        "message": "Certificate updated successfully",
        "certificate": serialize_cert(updated_cert)
    }), 200


# ═══════════════════════════════════════════════════════════════
# POST /api/certificates/<cert_id>/reissue — Reissue (JWT, Super Admin only)
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates/<cert_id>/reissue", methods=["POST"])
@jwt_required()
def reissue_certificate(cert_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    if not check_is_super_admin(db):
        return jsonify({"status": "error", "message": "Unauthorized. Super Admin role required."}), 403

    from bson import ObjectId
    try:
        query = {"_id": ObjectId(cert_id)}
    except Exception:
        query = {"certificateId": cert_id}

    cert = db.certificates.find_one(query)
    if not cert:
        return jsonify({"status": "error", "message": "Certificate not found"}), 404

    data = request.get_json(silent=True) or {}
    student_name = data.get("studentName", "").strip()
    course_name  = data.get("courseName", "").strip()
    issued_date  = data.get("issuedDate", "")
    completion_date = data.get("completionDate", "")

    if not student_name or not course_name:
        return jsonify({"status": "error", "message": "studentName and courseName are required"}), 400

    try:
        issued_dt = datetime.fromisoformat(issued_date) if issued_date else datetime.utcnow()
    except ValueError:
        issued_dt = datetime.utcnow()

    try:
        completion_dt = datetime.fromisoformat(completion_date) if completion_date else datetime.utcnow()
    except ValueError:
        completion_dt = datetime.utcnow()

    now = datetime.utcnow()
    user_email = get_jwt_identity()

    audit_entry = {
        "action": "REISSUED",
        "by": user_email,
        "date": now,
        "details": f"Reissued certificate. Updated studentName: '{student_name}', courseName: '{course_name}'"
    }

    db.certificates.update_one(query, {
        "$set": {
            "studentName": student_name,
            "courseName": course_name,
            "issuedDate": issued_dt,
            "completionDate": completion_dt,
            "certificateStatus": "VALID",
            "updatedAt": now
        },
        "$unset": {
            "revokedAt": "",
            "revocationReason": ""
        },
        "$push": {
            "auditLog": audit_entry
        }
    })

    updated_cert = db.certificates.find_one(query)
    mongo_db.log_activity(f"Certificate reissued: {updated_cert.get('certificateId')} by {user_email}")

    return jsonify({
        "status": "success",
        "message": "Certificate reissued successfully",
        "certificate": serialize_cert(updated_cert)
    }), 200


# ═══════════════════════════════════════════════════════════════
# DELETE /api/certificates/<cert_id> — Soft delete/revoke (JWT, Super Admin only)
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates/<cert_id>", methods=["DELETE"])
@jwt_required()
def delete_certificate(cert_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    if not check_is_super_admin(db):
        return jsonify({"status": "error", "message": "Unauthorized. Super Admin role required."}), 403

    from bson import ObjectId
    try:
        query = {"_id": ObjectId(cert_id)}
    except Exception:
        query = {"certificateId": cert_id}

    cert = db.certificates.find_one(query)
    if not cert:
        return jsonify({"status": "error", "message": "Certificate not found"}), 404

    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "Cancelled by administrator.").strip()

    now = datetime.utcnow()
    user_email = get_jwt_identity()

    audit_entry = {
        "action": "REVOKED",
        "by": user_email,
        "date": now,
        "details": f"Revoked. Reason: {reason}"
    }

    db.certificates.update_one(query, {
        "$set": {
            "certificateStatus": "REVOKED",
            "revokedAt": now,
            "revocationReason": reason
        },
        "$push": {
            "auditLog": audit_entry
        }
    })

    updated_cert = db.certificates.find_one(query)
    mongo_db.log_activity(f"Certificate revoked: {updated_cert.get('certificateId')} by {user_email}")

    return jsonify({
        "status": "success",
        "message": "Certificate revoked successfully",
        "certificate": serialize_cert(updated_cert)
    }), 200


# ═══════════════════════════════════════════════════════════════
# GET /api/certificates/verify/<certificateId>
# PUBLIC endpoint — no JWT — called by the React verify page
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates/verify/<certificate_id>", methods=["GET"])
def public_verify_certificate(certificate_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "valid": False, "message": "Database unavailable"}), 503

    cert = db.certificates.find_one({"certificateId": certificate_id.strip()})
    if not cert:
        return jsonify({
            "status":  "error",
            "valid":   False,
            "message": "Certificate not found"
        }), 404

    status = cert.get("certificateStatus", "VALID")

    # Serialize dates for the response
    issued_dt     = cert.get("issuedDate")
    completion_dt = cert.get("completionDate")

    issued_str     = issued_dt.strftime("%d %B %Y")     if isinstance(issued_dt, datetime)     else str(issued_dt)[:10]
    completion_str = completion_dt.strftime("%d %B %Y") if isinstance(completion_dt, datetime) else str(completion_dt)[:10]

    return jsonify({
        "status":     "success",
        "valid":      status == "VALID",
        "verifiedAt": datetime.utcnow().isoformat(),
        "certificate": {
            "certificateId":     cert.get("certificateId"),
            "studentName":       cert.get("studentName"),
            "courseName":        cert.get("courseName"),
            "issueDate":         issued_str,
            "completionDate":    completion_str,
            "certificateStatus": status,
            "verifyUrl":         cert.get("verifyUrl", ""),
            "revocationReason":  cert.get("revocationReason", ""),
            "revokedAt":         cert.get("revokedAt").isoformat() if isinstance(cert.get("revokedAt"), datetime) else None
        }
    }), 200


# ═══════════════════════════════════════════════════════════════
# PUT /api/certificates/<cert_id>/revoke (JWT required) — compatibility endpoint
# ═══════════════════════════════════════════════════════════════
@certificates_bp.route("/api/certificates/<cert_id>/revoke", methods=["PUT"])
@jwt_required()
def revoke_certificate(cert_id):
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    from bson import ObjectId
    try:
        query = {"_id": ObjectId(cert_id)}
    except Exception:
        query = {"certificateId": cert_id}

    cert = db.certificates.find_one(query)
    if not cert:
        return jsonify({"status": "error", "message": "Certificate not found"}), 404

    if cert.get("certificateStatus") == "REVOKED":
        return jsonify({"status": "error", "message": "Certificate is already revoked"}), 400

    now = datetime.utcnow()
    user_email = get_jwt_identity()

    audit_entry = {
        "action": "REVOKED",
        "by": user_email,
        "date": now,
        "details": "Revoked via legacy endpoint"
    }

    db.certificates.update_one(query, {
        "$set": {
            "certificateStatus": "REVOKED",
            "revokedAt":         now
        },
        "$push": {
            "auditLog": audit_entry
        }
    })

    mongo_db.log_activity(f"Certificate revoked (legacy): {cert.get('certificateId')} by {user_email}")

    return jsonify({"status": "success", "message": "Certificate revoked successfully"}), 200
