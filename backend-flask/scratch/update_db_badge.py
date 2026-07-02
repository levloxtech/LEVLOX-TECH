import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path)

mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    print("MONGO_URI not found in env!")
    exit(1)

print("Connecting to MongoDB...")
client = MongoClient(mongo_uri)
db_name = mongo_uri.split('/')[-1].split('?')[0] or 'levlox_crm'
db = client[db_name]

print("Updating badges...")
res = db.courses.update_many({"badge": "START HERE"}, {"$set": {"badge": "FREE"}})
print(f"Matched {res.matched_count} documents, modified {res.modified_count} documents.")

res2 = db.courses.update_many({"title": "GET HIRED"}, {"$set": {"badge": "FREE"}})
print(f"Matched GET HIRED: {res2.matched_count} documents, modified {res2.modified_count} documents.")

print("Done!")
