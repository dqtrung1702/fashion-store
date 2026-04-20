from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from cache import (
    CATEGORIES_CACHE_TTL,
    COLLECTION_CACHE_TTL,
    PRODUCT_CACHE_TTL,
    PRODUCT_SEARCH_CACHE_TTL,
    get_json_cache,
    make_cache_key,
    set_json_cache,
)
from catalog import is_object_id, serialize_collection, serialize_product
from database import get_db
from models import CatalogCollection, Product

router = APIRouter()


def _product_sort(field: str, order: int) -> list:
    allowed = {
        "price": "price",
        "name": "name",
        "created_at": "created_at",
        "trending": "trendingScore",
    }
    sort_field = allowed.get(field, "created_at")
    return [(sort_field, order)]


def _collection_sort() -> list:
    return [("sortPriority", 1), ("title", 1)]


def _collection_link_filter(collection_slug: str) -> dict:
    return {"$or": [{"collectionSlug": collection_slug}, {"collectionSlugs": collection_slug}]}


def _category_filter(category: str) -> dict:
    return {"$or": [{"category": category}, {"categories": category}]}


@router.get("/collections", response_model=List[CatalogCollection])
async def get_collections(
    active_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
):
    cache_key = make_cache_key(
        "collections:list",
        {
            "active_only": active_only,
            "limit": limit,
        },
    )
    cached = get_json_cache(cache_key)
    if cached is not None:
        return [CatalogCollection(**collection) for collection in cached]

    db = get_db()
    filter_dict = {"isActive": True} if active_only else {}
    collections = db.catalog_collections.find(filter_dict).sort(_collection_sort()).limit(limit)
    result = [CatalogCollection(**serialize_collection(collection)) for collection in collections]
    set_json_cache(
        cache_key,
        [collection.model_dump(mode="json") for collection in result],
        COLLECTION_CACHE_TTL,
    )
    return result


@router.get("/collections/{slug}", response_model=CatalogCollection)
async def get_collection(slug: str):
    cache_key = make_cache_key("collections:detail", {"slug": slug})
    cached = get_json_cache(cache_key)
    if cached is not None:
        return CatalogCollection(**cached)

    db = get_db()
    collection = db.catalog_collections.find_one({"slug": slug})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    result = CatalogCollection(**serialize_collection(collection))
    set_json_cache(cache_key, result.model_dump(mode="json"), COLLECTION_CACHE_TTL)
    return result


@router.get("/categories/list", response_model=List[str])
async def get_categories():
    cache_key = make_cache_key("categories:list")
    cached = get_json_cache(cache_key)
    if cached is not None:
        return cached

    db = get_db()
    filter_dict = {"status": {"$ne": "draft"}}
    categories = set(db.products.distinct("category", filter_dict))
    categories.update(db.products.distinct("categories", filter_dict))
    result = sorted(category for category in categories if category)
    set_json_cache(cache_key, result, CATEGORIES_CACHE_TTL)
    return result


@router.get("/", response_model=List[Product])
async def get_products(
    category: Optional[str] = Query(None),
    collection_slug: Optional[str] = Query(None, alias="collectionSlug"),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    sort_by: str = Query("created_at", pattern="^(price|name|created_at|trending)$"),
    order: int = Query(-1, ge=-1, le=1),
):
    cache_key = make_cache_key(
        "products:list",
        {
            "category": category,
            "collection_slug": collection_slug,
            "status": status,
            "q": q,
            "skip": skip,
            "limit": limit,
            "sort_by": sort_by,
            "order": order,
        },
    )
    cached = get_json_cache(cache_key)
    if cached is not None:
        return [Product(**product) for product in cached]

    db = get_db()

    filter_dict = {}
    filter_clauses = []
    if category:
        filter_clauses.append(_category_filter(category))
    if collection_slug:
        filter_clauses.append(_collection_link_filter(collection_slug))
    if status:
        filter_dict["status"] = status
    else:
        filter_dict["status"] = {"$ne": "draft"}
    if q:
        filter_dict["$text"] = {"$search": q}
    if filter_clauses:
        filter_dict["$and"] = filter_clauses

    products = (
        db.products.find(filter_dict)
        .sort(_product_sort(sort_by, order))
        .skip(skip)
        .limit(limit)
    )

    result = [Product(**serialize_product(product)) for product in products]
    set_json_cache(
        cache_key,
        [product.model_dump(mode="json") for product in result],
        PRODUCT_CACHE_TTL,
    )
    return result


@router.get("/search", response_model=List[Product])
async def search_products(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    cache_key = make_cache_key(
        "products:search",
        {
            "q": q,
            "skip": skip,
            "limit": limit,
        },
    )
    cached = get_json_cache(cache_key)
    if cached is not None:
        return [Product(**product) for product in cached]

    db = get_db()
    products = db.products.find(
        {
            "$text": {"$search": q},
            "status": {"$ne": "draft"},
        }
    ).skip(skip).limit(limit)
    result = [Product(**serialize_product(product)) for product in products]
    set_json_cache(
        cache_key,
        [product.model_dump(mode="json") for product in result],
        PRODUCT_SEARCH_CACHE_TTL,
    )
    return result


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    cache_key = make_cache_key("products:detail", {"product_id": product_id})
    cached = get_json_cache(cache_key)
    if cached is not None:
        return Product(**cached)

    db = get_db()

    product = None
    if is_object_id(product_id):
        product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        product = db.products.find_one({"slug": product_id})

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    result = Product(**serialize_product(product))
    set_json_cache(cache_key, result.model_dump(mode="json"), PRODUCT_CACHE_TTL)
    return result
