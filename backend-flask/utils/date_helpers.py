from flask import request
from datetime import datetime, timedelta

def parse_date_range_query(date_field="createdAt"):
    """
    Parses request.args for 'filter', 'from_date', 'to_date', 'startDate', 'endDate'.
    Returns a MongoDB query dict filter or an empty dict.
    
    Compatible query parameter names:
      - filter=today|this_week|this_month|this_year
      - from_date / startDate = YYYY-MM-DD or ISO timestamp
      - to_date / endDate = YYYY-MM-DD or ISO timestamp
    """
    filter_preset = request.args.get("filter", "").strip().lower()
    raw_from = request.args.get("from_date") or request.args.get("startDate")
    raw_to = request.args.get("to_date") or request.args.get("endDate")

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Preset filters
    if filter_preset:
        if filter_preset == "today":
            from_dt = today
            to_dt = today + timedelta(days=1)
            return {date_field: {"$gte": from_dt, "$lt": to_dt}}
        
        elif filter_preset in ("this_week", "week"):
            # Start of week (Monday)
            monday = today - timedelta(days=today.weekday())
            return {date_field: {"$gte": monday, "$lt": today + timedelta(days=1)}}
            
        elif filter_preset in ("this_month", "month"):
            start_of_month = today.replace(day=1)
            return {date_field: {"$gte": start_of_month, "$lt": today + timedelta(days=1)}}
            
        elif filter_preset in ("this_year", "year"):
            start_of_year = today.replace(month=1, day=1)
            return {date_field: {"$gte": start_of_year, "$lt": today + timedelta(days=1)}}

    # 2. Custom date ranges
    if raw_from and raw_to:
        try:
            def parse_param(s):
                s = s.strip()
                if 'T' in s or 'Z' in s:
                    s_fixed = s.replace('Z', '+00:00')
                    dt = datetime.fromisoformat(s_fixed)
                    if dt.tzinfo is not None:
                        from datetime import timezone
                        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                    return dt
                else:
                    return datetime.strptime(s[:10], "%Y-%m-%d")

            from_dt = parse_param(raw_from)
            to_dt = parse_param(raw_to)

            if 'T' not in raw_to and 'Z' not in raw_to:
                to_dt = to_dt + timedelta(days=1)

            return {date_field: {"$gte": from_dt, "$lt": to_dt}}
        except Exception:
            pass

    return {}
