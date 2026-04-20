from fastapi import APIRouter

from cache import CONTENT_CACHE_TTL, get_json_cache, make_cache_key, set_json_cache
from content import SITE_CONTENT_KEY, serialize_site_content
from database import get_db
from models import SiteContentBundle

router = APIRouter()


@router.get("/", response_model=SiteContentBundle)
async def get_site_content():
    cache_key = make_cache_key("content:site")
    cached = get_json_cache(cache_key)
    if cached is not None:
        return SiteContentBundle(**cached)

    db = get_db()
    content_doc = db.site_content.find_one({"key": SITE_CONTENT_KEY})
    result = SiteContentBundle(**serialize_site_content(content_doc))
    set_json_cache(cache_key, result.model_dump(mode="json"), CONTENT_CACHE_TTL)
    return result
