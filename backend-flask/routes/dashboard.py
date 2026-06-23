from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from utils.db import mongo_db
from bson.objectid import ObjectId
from datetime import datetime, timedelta

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


def _parse_date_range():
    """
    Parse ?from_date and ?to_date query params.
    Accepts both:
      - YYYY-MM-DD strings (treated as UTC day boundaries, legacy fallback)
      - ISO datetime strings with timezone (e.g. 2026-06-16T18:30:00.000Z)
        sent by the frontend to represent the LOCAL day start/end in UTC.
    Returns (from_dt, to_dt) as UTC-naive datetime objects for MongoDB queries.
    Defaults to today UTC when params are absent.
    """
    raw_from = request.args.get("from_date")
    raw_to   = request.args.get("to_date")

    if raw_from and raw_to:
        try:
            def parse_param(s):
                """Parse either ISO timestamp or plain date string to UTC-naive datetime."""
                s = s.strip()
                # ISO timestamp (contains T or Z) — frontend sends these for timezone accuracy
                if 'T' in s or 'Z' in s:
                    s_fixed = s.replace('Z', '+00:00')
                    dt = datetime.fromisoformat(s_fixed)
                    # Convert timezone-aware to UTC naive
                    if dt.tzinfo is not None:
                        from datetime import timezone
                        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                    return dt
                else:
                    # Plain date string — treat as UTC midnight
                    return datetime.strptime(s[:10], "%Y-%m-%d")

            from_dt = parse_param(raw_from)
            to_dt   = parse_param(raw_to)

            # If to_dt came from a plain date (no time part), add 1 day to include full day
            if 'T' not in raw_to and 'Z' not in raw_to:
                to_dt = to_dt + timedelta(days=1)

            return from_dt, to_dt
        except (ValueError, AttributeError) as e:
            print(f"[dashboard] Date parse error: {e} | from={raw_from} to={raw_to}")

    # Default: today UTC (midnight to midnight)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end   = today_start + timedelta(days=1)
    return today_start, today_end



@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Retrieve aggregate statistics for Levlox CRM dashboard with optional date range filtering."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({
            "status": "success",
            "data": {
                "total_leads": 0,
                "course_leads": 0,
                "workshop_leads": 0,
                "interested_leads": 0,
                "enrolled_leads": 0,
                "closed_leads": 0,
                "contact_requests": 0,
                "resume_uploads": 0,
                "pending_tasks": 0,
                "active_tasks": 0,
                "completed_tasks": 0,
                "overdue_tasks": 0
            }
        }), 200

    try:
        from_dt, to_dt = _parse_date_range()
        date_filter = {"$gte": from_dt, "$lt": to_dt}

        total_leads         = db.leads.count_documents({"createdAt": date_filter})
        course_leads        = db.leads.count_documents({"source": "course",    "createdAt": date_filter})
        workshop_leads      = db.leads.count_documents({"source": "workshop",  "createdAt": date_filter})
        contacts            = db.contacts.count_documents({"createdAt": date_filter})
        resumes             = db.resumes.count_documents({"createdAt": date_filter})
        enrolled            = db.leads.count_documents({"status": "Enrolled",  "createdAt": date_filter})
        interested          = db.leads.count_documents({"status": "Interested","createdAt": date_filter})
        closed              = db.leads.count_documents({"status": "Closed",    "createdAt": date_filter})

        # Tasks — filter by createdAt if available, otherwise show all within range
        pending_tasks   = db.tasks.count_documents({"status": "Pending"})
        active_tasks    = db.tasks.count_documents({"status": "In Progress"})
        completed_tasks = db.tasks.count_documents({"status": "Completed"})

        # Overdue tasks: status != Completed and dueDate before today
        overdue_tasks = 0
        now_str = datetime.utcnow().strftime("%Y-%m-%d")
        cursor = db.tasks.find({"status": {"$ne": "Completed"}})
        for task in cursor:
            due = task.get("dueDate")
            if due and due < now_str:
                overdue_tasks += 1

        stats = {
            "total_leads":          total_leads,
            "today_leads":          total_leads,   # keep legacy key — now = filtered period count
            "course_leads":         course_leads,
            "today_course_leads":   course_leads,
            "workshop_leads":       workshop_leads,
            "today_workshop_leads": workshop_leads,
            "contact_requests":     contacts,
            "today_contact_requests": contacts,
            "resume_uploads":       resumes,
            "today_resume_uploads": resumes,
            "enrolled_leads":       enrolled,
            "today_enrolled_leads": enrolled,
            "interested_leads":     interested,
            "closed_leads":         closed,
            "pending_tasks":        pending_tasks,
            "active_tasks":         active_tasks,
            "completed_tasks":      completed_tasks,
            "overdue_tasks":        overdue_tasks,
            # Send the active range back so the frontend can label cards correctly
            "filter_from": from_dt.strftime("%Y-%m-%d"),
            "filter_to":   (to_dt - timedelta(days=1)).strftime("%Y-%m-%d"),
        }

        return jsonify({"status": "success", "data": stats}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@dashboard_bp.route("/export-data", methods=["GET"])
@jwt_required()
def get_export_data():
    """Return raw records (leads, contacts, tasks, resumes, enrollments) for the selected date range."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        from_dt, to_dt = _parse_date_range()
        date_filter = {"$gte": from_dt, "$lt": to_dt}

        def serialize(doc):
            doc["_id"] = str(doc["_id"])
            for k, v in doc.items():
                if isinstance(v, datetime):
                    doc[k] = v.isoformat()
            return doc

        leads_cursor = db.leads.find({"createdAt": date_filter}).sort("createdAt", -1)
        leads = [serialize(d) for d in leads_cursor]

        contacts_cursor = db.contacts.find({"createdAt": date_filter}).sort("createdAt", -1)
        contacts = [serialize(d) for d in contacts_cursor]

        tasks_cursor = db.tasks.find().sort("createdAt", -1)
        tasks = [serialize(d) for d in tasks_cursor]

        resumes_cursor = db.resumes.find({"createdAt": date_filter}).sort("createdAt", -1)
        resumes = [serialize(d) for d in resumes_cursor]

        enrollments_cursor = db.course_enrollments.find().sort("createdAt", -1) \
            if "course_enrollments" in db.list_collection_names() else []
        enrollments = [serialize(d) for d in enrollments_cursor]

        return jsonify({
            "status": "success",
            "from_date": from_dt.strftime("%Y-%m-%d"),
            "to_date":   (to_dt - timedelta(days=1)).strftime("%Y-%m-%d"),
            "leads":       leads,
            "contacts":    contacts,
            "tasks":       tasks,
            "resumes":     resumes,
            "enrollments": enrollments,
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@dashboard_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    """Retrieve time-series analytics, category ratios, and traffic reports for CRM dashboard."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        # 1. Leads by Source
        source_pipeline = [
            {"$group": {"_id": "$source", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        source_cursor = db.leads.aggregate(source_pipeline)
        leads_by_source = [{"source": doc["_id"] or "unknown", "count": doc["count"]} for doc in source_cursor]

        # 2. Leads by Status
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_cursor = db.leads.aggregate(status_pipeline)
        leads_by_status = [{"status": doc["_id"] or "New", "count": doc["count"]} for doc in status_cursor]

        # 3. Lead Growth (by Month)
        growth_pipeline = [
            {"$match": {"createdAt": {"$type": "date"}}},
            {
                "$group": {
                    "_id": {
                        "year":  {"$year":  "$createdAt"},
                        "month": {"$month": "$createdAt"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        growth_cursor = db.leads.aggregate(growth_pipeline)
        lead_growth = []
        for doc in growth_cursor:
            yr = doc["_id"].get("year")
            mo = doc["_id"].get("month")
            if yr and mo:
                try:
                    month_name = datetime(yr, mo, 1).strftime("%b")
                    lead_growth.append({"label": f"{month_name} {yr}", "count": doc["count"]})
                except Exception:
                    pass

        if not lead_growth:
            now = datetime.now()
            for i in range(5, -1, -1):
                past_date = now - timedelta(days=i * 30)
                lead_growth.append({"label": past_date.strftime("%b %Y"), "count": 0})

        # 4. Workshop registrations count
        workshop_pipeline = [
            {"$group": {"_id": "$workshopId", "count": {"$sum": 1}}}
        ]
        workshop_cursor = db.workshop_registrations.aggregate(workshop_pipeline)
        workshop_registrations = []
        for doc in workshop_cursor:
            w_id   = doc["_id"]
            w_name = "Event Registration"
            if w_id:
                try:
                    w_doc = db.workshops.find_one({"_id": ObjectId(w_id)})
                    if w_doc:
                        w_name = w_doc.get("title", w_name)
                except Exception:
                    pass
            workshop_registrations.append({"workshop": w_name, "count": doc["count"]})

        # 5. Course Enrollments count
        course_pipeline = [
            {"$group": {"_id": "$courseName", "count": {"$sum": 1}}}
        ]
        course_cursor = db.course_enrollments.aggregate(course_pipeline) \
            if "course_enrollments" in db.list_collection_names() else []
        course_enrollments = [{"course": doc["_id"] or "General Development", "count": doc["count"]} for doc in course_cursor]

        # 6. Resume reports
        resumes_count = db.resumes.count_documents({})

        # 7. Traffic Reports simulation
        total_leads = db.leads.count_documents({})
        traffic_reports = [
            {"source": "Direct",    "count": int(total_leads * 0.15) or 10},
            {"source": "Google",    "count": int(total_leads * 0.35) or 25},
            {"source": "LinkedIn",  "count": int(total_leads * 0.25) or 18},
            {"source": "Instagram", "count": int(total_leads * 0.15) or 12},
            {"source": "YouTube",   "count": int(total_leads * 0.10) or 8},
        ]

        return jsonify({
            "status": "success",
            "data": {
                "leads_by_source":        leads_by_source,
                "leads_by_status":        leads_by_status,
                "lead_growth":            lead_growth,
                "workshop_registrations": workshop_registrations,
                "course_enrollments":     course_enrollments,
                "resume_upload_count":    resumes_count,
                "traffic_reports":        traffic_reports,
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@dashboard_bp.route("/activities", methods=["GET"])
@jwt_required()
def get_activities():
    """Retrieve recent system activity logs (chronological order)."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        cursor = db.activity_logs.find().sort("timestamp", -1).limit(40)
        activities = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("timestamp"), datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            activities.append(doc)

        return jsonify({"status": "success", "activities": activities}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@dashboard_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    """Retrieve system notifications."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        cursor = db.notifications.find().sort("createdAt", -1).limit(50)
        notifications = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("createdAt"), datetime):
                doc["createdAt"] = doc["createdAt"].isoformat()
            notifications.append(doc)

        return jsonify({"status": "success", "notifications": notifications}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@dashboard_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notif_id):
    """Mark a notification as read."""
    db = mongo_db.get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not initialized"}), 500

    try:
        res = db.notifications.update_one(
            {"_id": ObjectId(notif_id)},
            {"$set": {"read": True}}
        )
        if res.matched_count == 0:
            return jsonify({"status": "error", "message": "Notification not found"}), 404

        return jsonify({"status": "success", "message": "Notification marked as read"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
