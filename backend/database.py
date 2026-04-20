from pymongo import MongoClient
from pymongo.errors import OperationFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv
from security import hash_password
from storage import ensure_storage_bucket

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "fashion_store")

client = None
db = None

def connect_db():
    global client, db
    try:
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        
        # Create indexes
        create_indexes()
        seed_admin_user()
        ensure_storage_bucket()
        print("✅ MinIO bucket ensured")
        return db
    except ServerSelectionTimeoutError:
        print(f"❌ Could not connect to MongoDB at {MONGODB_URL}")
        raise

def close_db():
    global client
    if client:
        client.close()

def get_db():
    if db is None:
        connect_db()
    return db


def ensure_index(collection, keys, **options):
    try:
        return collection.create_index(keys, **options)
    except OperationFailure as error:
        if "IndexOptionsConflict" in str(error) or "already exists with a different name" in str(error):
            return None
        raise

def create_indexes():
    """Create necessary indexes for collections"""
    db = get_db()
    
    # Products indexes
    ensure_index(db.products, "slug", unique=True)
    ensure_index(db.products, "name")
    ensure_index(db.products, "category")
    ensure_index(db.products, "categories")
    ensure_index(db.products, "collectionSlug")
    ensure_index(db.products, "collectionSlugs")
    ensure_index(db.products, "status")
    ensure_index(db.products, "price")
    ensure_index(db.products, "created_at")
    ensure_index(db.products, [("collectionSlug", 1), ("status", 1), ("created_at", -1)])
    ensure_index(db.products, [("collectionSlugs", 1), ("status", 1), ("created_at", -1)])
    ensure_index(db.products, [("status", 1), ("isBestSeller", 1), ("trendingScore", -1)])
    ensure_index(db.products, [("status", 1), ("isOnSale", 1), ("price", 1)])
    ensure_index(db.products, [("name", "text"), ("description", "text")])

    # Collections indexes
    ensure_index(db.catalog_collections, "slug", unique=True)
    ensure_index(db.catalog_collections, [("isActive", 1), ("sortPriority", 1)])

    # Content indexes
    ensure_index(db.site_content, "key", unique=True)
    
    # Users indexes
    ensure_index(db.users, "email", unique=True)
    ensure_index(db.users, "username", unique=True)
    
    # Orders indexes
    ensure_index(db.carts, "user_id", unique=True)
    ensure_index(db.carts, "updated_at")
    ensure_index(db.wishlists, "user_id", unique=True)
    ensure_index(db.orders, "user_id")
    ensure_index(db.orders, "email")
    ensure_index(db.orders, "created_at")
    
    print("✅ Indexes created successfully")

def seed_admin_user():
    seed_enabled = os.getenv("ADMIN_SEED_ENABLED", "true").lower() == "true"
    if not seed_enabled:
        return

    admin_email = os.getenv("ADMIN_EMAIL", "admin@fashionstore.com").strip()
    admin_username = os.getenv("ADMIN_USERNAME", "admin").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin123!").strip()
    admin_full_name = os.getenv("ADMIN_FULL_NAME", "Store Admin").strip()

    if not admin_email or not admin_username or not admin_password:
        print("⚠️ Admin seed skipped: missing ADMIN_EMAIL, ADMIN_USERNAME, or ADMIN_PASSWORD")
        return

    user_doc = {
        "email": admin_email,
        "username": admin_username,
        "full_name": admin_full_name,
        "password": hash_password(admin_password),
        "is_admin": True,
        "is_active": True,
    }

    existing_user = db.users.find_one({"$or": [{"email": admin_email}, {"username": admin_username}]})
    if existing_user:
        db.users.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "email": admin_email,
                    "username": admin_username,
                    "full_name": admin_full_name,
                    "password": user_doc["password"],
                    "is_admin": True,
                    "is_active": True,
                }
            },
        )
        print(f"✅ Admin user ensured: {admin_username}")
        return

    user_doc["created_at"] = __import__("datetime").datetime.utcnow()
    db.users.insert_one(user_doc)
    print(f"✅ Admin user seeded: {admin_username}")
