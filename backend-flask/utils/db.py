import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        """Initialize the MongoDB client using the config from the Flask app."""
        mongo_uri = app.config.get("MONGO_URI")
        
        if not mongo_uri:
            logger.error("MONGO_URI not configured in app config!")
            return

        try:
            # We set a short connection timeout so it doesn't block the app startup indefinitely
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Fetch database name from URI, default to 'levlox_crm' if not in URI path
            db_name = mongo_uri.split('/')[-1].split('?')[0] or 'levlox_crm'
            self.db = self.client[db_name]
            
            # Check connection
            self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB Atlas / Database!")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            # Keep self.db reference so PyMongo can auto-reconnect when server is reachable
        except Exception as e:
            logger.error(f"An unexpected error occurred during database initialization: {e}")

    def get_db(self):
        """Returns the active MongoDB database object."""
        return self.db

    def log_activity(self, activity):
        """Logs a global system activity with a timestamp."""
        db = self.get_db()
        if db is None:
            return
        from datetime import datetime
        try:
            db.activity_logs.insert_one({
                "activity": activity,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

    def create_notification(self, notification_type, message):
        """Creates a CRM notification."""
        db = self.get_db()
        if db is None:
            return
        from datetime import datetime
        try:
            db.notifications.insert_one({
                "type": notification_type,
                "message": message,
                "read": False,
                "createdAt": datetime.utcnow()
            })
        except Exception as e:
            logger.error(f"Error creating notification: {e}")

    def log_email(self, recipient, subject, body):
        """Mocks automated acknowledgment email sending and stores it in the CRM email history."""
        db = self.get_db()
        if db is None:
            return
        from datetime import datetime
        try:
            db.email_history.insert_one({
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "sentAt": datetime.utcnow()
            })
            # Also log this as an activity
            self.log_activity(f"Automated email sent to {recipient}: '{subject}'")
        except Exception as e:
            logger.error(f"Error logging email history: {e}")

    def create_lead(self, name, email, phone, source, location=None, company=None, video_name=None, watch_percentage=None, resume=None):
        """Creates a lead entry in the 'leads' collection with location, company, video details, status flow, and logs."""
        db = self.get_db()
        if db is None:
            logger.warning("Database client not initialized. Cannot create lead.")
            return None
            
        from datetime import datetime
        now = datetime.utcnow()
        lead_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "source": source,
            "location": location or "Unknown",
            "company": company or "Unknown",
            "status": "New",
            "notes": [],
            "activity_history": [
                {
                    "activity": f"Lead created via {source.replace('_', ' ')}",
                    "timestamp": now.isoformat()
                }
            ],
            "createdAt": now,
            "updatedAt": now
        }
        
        if video_name:
            lead_data["videoName"] = video_name
        if watch_percentage is not None:
            lead_data["watchPercentage"] = watch_percentage
        if resume:
            lead_data["resume"] = resume

        try:
            result = db.leads.insert_one(lead_data)
            logger.info(f"Lead created successfully with ID: {result.inserted_id}")
            
            # Log global activity
            self.log_activity(f"New lead created: {name} (Source: {source})")
            # Create notification
            self.create_notification("New Lead", f"New lead captured: {name} via {source.replace('_', ' ')}")
            
            return result.inserted_id
        except Exception as e:
            logger.error(f"Error creating lead: {e}")
            return None

# Global instance to be imported by other modules
mongo_db = Database()
