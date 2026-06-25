import os
import sys
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from utils.db import mongo_db
from routes.certificates import generate_qr_base64, serialize_cert

def migrate_certificates():
    print("=" * 60)
    print("STARTING CERTIFICATE QR CODE & URL MIGRATION")
    print("=" * 60)
    
    db = mongo_db.get_db()
    if db is None:
        print("Error: Database connection is not available.")
        return

    # Load new frontend URL from environment config
    from routes.certificates import FRONTEND_URL
    print(f"Target Frontend URL: {FRONTEND_URL}")

    count = 0
    for cert in db.certificates.find():
        old_url = cert.get("verifyUrl", "")
        cert_id = cert.get("certificateId")
        
        # Check if the URL needs to be updated (points to old vercel app)
        if "vercel.app" in old_url or "localhost" in old_url or FRONTEND_URL not in old_url:
            new_url = f"{FRONTEND_URL}/verify/{cert_id}"
            print(f"Updating Cert {cert_id}:")
            print(f"  Old URL: {old_url}")
            print(f"  New URL: {new_url}")
            
            # Regenerate the QR Code base64 image using the new URL
            try:
                new_qr_base64 = generate_qr_base64(new_url)
                
                db.certificates.update_one(
                    {"_id": cert["_id"]},
                    {
                        "$set": {
                            "verifyUrl": new_url,
                            "qrCodeBase64": new_qr_base64,
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
                count += 1
                print("  Status: SUCCESS")
            except Exception as e:
                print(f"  Status: FAILED - {str(e)}")
        
    print("=" * 60)
    print(f"Migration completed. Total Certificates Updated: {count}")
    print("=" * 60)

if __name__ == "__main__":
    with app.app_context():
        migrate_certificates()
