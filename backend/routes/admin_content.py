from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from cache import invalidate_content_cache
from content import SITE_CONTENT_KEY, build_site_content_doc, serialize_site_content
from database import get_db
from models import SiteContentBundle, SiteContentImportRequest
from security import verify_token

router = APIRouter()


async def verify_admin(user_id: str = Depends(verify_token)):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id


@router.get("/", response_model=SiteContentBundle)
async def get_admin_site_content(user_id: str = Depends(verify_admin)):
    db = get_db()
    content_doc = db.site_content.find_one({"key": SITE_CONTENT_KEY})
    return SiteContentBundle(**serialize_site_content(content_doc))


@router.post("/import", response_model=SiteContentBundle)
async def import_site_content(payload: SiteContentImportRequest, user_id: str = Depends(verify_admin)):
    db = get_db()
    existing = db.site_content.find_one({"key": SITE_CONTENT_KEY})
    doc = build_site_content_doc(payload.model_dump(), existing)

    db.site_content.update_one(
        {"key": SITE_CONTENT_KEY},
        {"$set": doc},
        upsert=True,
    )
    invalidate_content_cache()

    updated = db.site_content.find_one({"key": SITE_CONTENT_KEY})
    return SiteContentBundle(**serialize_site_content(updated))
