from typing import Any, Dict, Iterable, List

from bson import ObjectId


def is_object_id(value: str) -> bool:
    try:
        ObjectId(value)
        return True
    except Exception:
        return False


def slugify(value: str) -> str:
    return (
        str(value or "")
        .strip()
        .lower()
        .replace("&", " and ")
        .replace("/", " ")
        .replace("_", " ")
        .replace("  ", " ")
        .replace(" ", "-")
    )


def _clean_list(items: Iterable[Any]) -> List[str]:
    result = []
    seen = set()
    for item in items:
        value = str(item or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def normalize_collection_slugs(product_doc: Dict[str, Any]) -> List[str]:
    collection_slugs = product_doc.get("collectionSlugs") or []
    if isinstance(collection_slugs, str):
        collection_slugs = [collection_slugs]
    return _clean_list([product_doc.get("collectionSlug"), *collection_slugs])


def _normalize_variants(product_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    variants = product_doc.get("variants") or []
    normalized = []

    for index, variant in enumerate(variants):
        normalized.append(
            {
                "id": variant.get("id") or f"{product_doc.get('slug') or product_doc.get('_id')}-variant-{index + 1}",
                "size": variant.get("size") or "One Size",
                "color": variant.get("color") or "",
                "sku": variant.get("sku") or "",
                "stock": max(0, int(variant.get("stock", 0) or 0)),
                "price": variant.get("price"),
                "isActive": variant.get("isActive", True),
            }
        )

    return normalized


def serialize_product(product_doc: Dict[str, Any]) -> Dict[str, Any]:
    doc = dict(product_doc)
    collection_slugs = normalize_collection_slugs(doc)
    fallback_collection_slug = slugify(doc.get("category") or "uncategorized")
    categories = _clean_list(doc.get("categories") or [doc.get("category")])
    variants = _normalize_variants(doc)
    active_variants = [variant for variant in variants if variant.get("isActive", True)]

    stock = sum(int(variant.get("stock", 0) or 0) for variant in active_variants)
    sizes = _clean_list(variant.get("size") for variant in active_variants if variant.get("size"))
    colors = _clean_list(variant.get("color") for variant in active_variants if variant.get("color"))

    serialized = {
        **doc,
        "id": str(doc.get("_id")),
        "slug": doc.get("slug") or str(doc.get("_id")),
        "sku": doc.get("sku") or "",
        "status": doc.get("status") or "active",
        "collectionSlug": collection_slugs[0] if collection_slugs else fallback_collection_slug,
        "collectionSlugs": collection_slugs,
        "compareAtPrice": doc.get("compareAtPrice"),
        "coverImage": doc.get("coverImage") or "",
        "images": doc.get("images") or [],
        "variants": variants,
        "styleTags": doc.get("styleTags") or [],
        "material": doc.get("material") or "",
        "fitNotes": doc.get("fitNotes") or "",
        "seoTitle": doc.get("seoTitle") or "",
        "seoDescription": doc.get("seoDescription") or "",
        "isNew": bool(doc.get("isNew", False)),
        "isBestSeller": bool(doc.get("isBestSeller", False)),
        "isOnSale": bool(doc.get("isOnSale", False)),
        "trendingScore": int(doc.get("trendingScore", 0) or 0),
        "category": doc.get("category") or (categories[0] if categories else ""),
        "categories": categories,
        "stock": stock if variants else max(0, int(doc.get("stock", 0) or 0)),
        "sizes": sizes if variants else _clean_list(doc.get("sizes") or []),
        "colors": colors if variants else _clean_list(doc.get("colors") or []),
    }

    serialized.pop("_id", None)
    return serialized


def serialize_collection(collection_doc: Dict[str, Any]) -> Dict[str, Any]:
    doc = dict(collection_doc)
    serialized = {
        **doc,
        "id": str(doc.get("_id")),
        "slug": doc.get("slug") or "",
        "title": doc.get("title") or "",
        "description": doc.get("description") or "",
        "image": doc.get("image") or "",
        "featuredKeywords": doc.get("featuredKeywords") or [],
        "seoHeading": doc.get("seoHeading") or "",
        "seoBody": doc.get("seoBody") or "",
        "sortPriority": int(doc.get("sortPriority", 99) or 99),
        "isActive": bool(doc.get("isActive", True)),
    }
    serialized.pop("_id", None)
    return serialized
