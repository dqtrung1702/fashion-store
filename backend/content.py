from datetime import datetime
from typing import Any, Dict


SITE_CONTENT_KEY = "site-content"
SITE_CONTENT_FIELDS = (
    "siteChrome",
    "homePageContent",
    "merchandisingPages",
    "editorialPages",
    "infoPages",
    "locales",
)


def empty_site_content_bundle() -> Dict[str, Dict[str, Any]]:
    return {field: {} for field in SITE_CONTENT_FIELDS}


def serialize_site_content(content_doc: Dict[str, Any] | None) -> Dict[str, Any]:
    doc = dict(content_doc or {})
    serialized = {
        **empty_site_content_bundle(),
        **{field: doc.get(field) or {} for field in SITE_CONTENT_FIELDS},
    }

    if doc.get("created_at"):
        serialized["created_at"] = doc.get("created_at")
    if doc.get("updated_at"):
        serialized["updated_at"] = doc.get("updated_at")

    return serialized


def build_site_content_doc(payload: Dict[str, Any], existing_doc: Dict[str, Any] | None = None) -> Dict[str, Any]:
    now = datetime.utcnow()
    existing_data = dict(existing_doc or {})
    existing_data.pop("_id", None)

    doc = {
        "key": SITE_CONTENT_KEY,
        **existing_data,
        **{field: payload.get(field) or {} for field in SITE_CONTENT_FIELDS},
        "updated_at": now,
    }

    if not existing_doc:
        doc["created_at"] = now

    return doc
