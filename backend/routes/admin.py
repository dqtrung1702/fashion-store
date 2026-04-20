from datetime import datetime
from typing import List
from urllib.parse import unquote, urlparse

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from cache import invalidate_catalog_cache
from catalog import is_object_id, normalize_collection_slugs, serialize_collection, serialize_product
from database import get_db
from models import (
    AdminOrderStatusUpdate,
    CatalogCollection,
    CatalogCollectionCreate,
    CatalogCollectionUpdate,
    CatalogImportRequest,
    CatalogImportResponse,
    Order,
    OrderStatus,
    Product,
    ProductImageAsset,
    ProductCreate,
    ProductImageUploadResponse,
    ProductUpdate,
)
from order_flow import serialize_order, tracking_steps_for_status
from security import verify_token
from storage import build_public_url, delete_product_image, list_product_images, upload_product_image

router = APIRouter()
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


async def verify_admin(user_id: str = Depends(verify_token)):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id


def _find_product(db, product_id: str):
    product = None
    if is_object_id(product_id):
      product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
      product = db.products.find_one({"slug": product_id})
    return product


def _find_order(db, order_id: str):
    order = None
    if is_object_id(order_id):
      order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
      order = db.orders.find_one({"orderNumber": order_id})
    return order


def _normalize_image_reference(value: str) -> str:
    if not value:
        return ""

    raw_value = unquote(value.strip())
    parsed = urlparse(raw_value)
    if parsed.path:
        return parsed.path.lstrip("/")

    return raw_value.lstrip("/")


def _product_uses_image(product: dict, object_name: str) -> bool:
    bucket_path_suffix = f"/{object_name}"
    expected_url = build_public_url(object_name)
    values = [product.get("coverImage") or "", *(product.get("images") or [])]

    for value in values:
        normalized = _normalize_image_reference(value)
        if value == expected_url or value == object_name:
            return True
        if normalized == object_name or normalized.endswith(bucket_path_suffix):
            return True

    return False


def _count_products_using_image(db, object_name: str) -> int:
    return sum(
        1
        for product in db.products.find({}, {"coverImage": 1, "images": 1})
        if _product_uses_image(product, object_name)
    )


def _collection_link_filter(collection_slug: str) -> dict:
    return {"$or": [{"collectionSlug": collection_slug}, {"collectionSlugs": collection_slug}]}


def _clean_list(items: list | None) -> list[str]:
    result = []
    seen = set()
    for item in items or []:
        value = str(item or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _resolve_product_collections(db, payload: dict, existing_doc: dict | None = None) -> tuple[list[str], list[str]]:
    existing_doc = existing_doc or {}
    if "collectionSlugs" in payload and payload.get("collectionSlugs") is not None:
        secondary_slugs = payload.get("collectionSlugs") or []
    elif payload.get("collectionSlug"):
        secondary_slugs = []
    else:
        secondary_slugs = existing_doc.get("collectionSlugs") or []
    if isinstance(secondary_slugs, str):
        secondary_slugs = [secondary_slugs]

    collection_slugs = _clean_list([payload.get("collectionSlug") or existing_doc.get("collectionSlug"), *secondary_slugs])
    if not collection_slugs:
        raise HTTPException(status_code=400, detail="Choose at least one collection")

    collections = list(db.catalog_collections.find({"slug": {"$in": collection_slugs}}))
    collections_by_slug = {collection.get("slug"): collection for collection in collections}
    missing_slugs = [slug for slug in collection_slugs if slug not in collections_by_slug]
    if missing_slugs:
        raise HTTPException(status_code=400, detail=f"Collection not found: {', '.join(missing_slugs)}")

    category_titles = [collections_by_slug[slug].get("title", "") for slug in collection_slugs]
    return collection_slugs, category_titles


def _sync_product_collection_labels(db, product_doc: dict, collection_slug_map: dict[str, str] | None = None) -> dict:
    collection_slug_map = collection_slug_map or {}
    next_slugs = _clean_list(
        [collection_slug_map.get(slug, slug) for slug in normalize_collection_slugs(product_doc)]
    )
    collections = list(db.catalog_collections.find({"slug": {"$in": next_slugs}}))
    collections_by_slug = {collection.get("slug"): collection for collection in collections}
    category_titles = [
        collections_by_slug[slug].get("title", "")
        for slug in next_slugs
        if slug in collections_by_slug
    ]
    now = datetime.utcnow()
    return {
        "collectionSlug": next_slugs[0] if next_slugs else "",
        "collectionSlugs": next_slugs,
        "category": category_titles[0] if category_titles else "",
        "categories": category_titles,
        "updated_at": now,
    }


def _prepare_product_doc(db, payload: dict, existing_doc: dict | None = None) -> dict:
    collection_slugs, category_titles = _resolve_product_collections(db, payload, existing_doc)
    now = datetime.utcnow()
    existing_data = dict(existing_doc or {})
    existing_data.pop("_id", None)
    existing_data.pop("id", None)
    existing_data.pop("category", None)
    existing_data.pop("categories", None)
    existing_data.pop("collectionSlug", None)
    existing_data.pop("collectionSlugs", None)
    existing_data.pop("sizes", None)
    existing_data.pop("colors", None)
    existing_data.pop("stock", None)

    doc = {
        **existing_data,
        **payload,
        "collectionSlug": collection_slugs[0],
        "collectionSlugs": collection_slugs,
        "category": category_titles[0] if category_titles else "",
        "categories": category_titles,
        "updated_at": now,
    }
    if not existing_doc:
        doc["created_at"] = now

    return doc


def _prepare_collection_doc(payload: dict, existing_doc: dict | None = None) -> dict:
    now = datetime.utcnow()
    existing_data = dict(existing_doc or {})
    existing_data.pop("_id", None)
    existing_data.pop("id", None)
    doc = {
        **existing_data,
        **payload,
        "updated_at": now,
    }
    if not existing_doc:
        doc["created_at"] = now
    return doc


@router.get("/products", response_model=List[Product])
async def list_products(user_id: str = Depends(verify_admin)):
    db = get_db()
    products = db.products.find({}).sort([("updated_at", -1), ("created_at", -1)])
    return [Product(**serialize_product(product)) for product in products]


@router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, user_id: str = Depends(verify_admin)):
    db = get_db()
    payload = product.dict()

    if db.products.find_one({"slug": payload["slug"]}):
        raise HTTPException(status_code=400, detail="Product slug already exists")

    product_doc = _prepare_product_doc(db, payload)
    result = db.products.insert_one(product_doc)
    created = db.products.find_one({"_id": result.inserted_id})
    invalidate_catalog_cache()
    return Product(**serialize_product(created))


@router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductUpdate, user_id: str = Depends(verify_admin)):
    db = get_db()
    existing = _find_product(db, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    payload = product.dict(exclude_unset=True)
    next_slug = payload.get("slug")
    if next_slug and next_slug != existing.get("slug"):
        if db.products.find_one({"slug": next_slug, "_id": {"$ne": existing["_id"]}}):
            raise HTTPException(status_code=400, detail="Product slug already exists")

    next_collection_slug = payload.get("collectionSlug")
    if not next_collection_slug and payload.get("collectionSlugs"):
        next_collection_slug = payload["collectionSlugs"][0]

    merged = _prepare_product_doc(
        db,
        {
            **payload,
            "slug": payload.get("slug") or existing.get("slug"),
            "collectionSlug": next_collection_slug or existing.get("collectionSlug"),
        },
        existing,
    )

    db.products.update_one({"_id": existing["_id"]}, {"$set": merged})
    updated = db.products.find_one({"_id": existing["_id"]})
    invalidate_catalog_cache()
    return Product(**serialize_product(updated))


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, user_id: str = Depends(verify_admin)):
    db = get_db()
    existing = _find_product(db, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    db.products.delete_one({"_id": existing["_id"]})
    invalidate_catalog_cache()
    return {"message": "Product deleted successfully"}


@router.get("/collections", response_model=List[CatalogCollection])
async def list_collections(user_id: str = Depends(verify_admin)):
    db = get_db()
    collections = db.catalog_collections.find({}).sort([("sortPriority", 1), ("title", 1)])
    return [CatalogCollection(**serialize_collection(collection)) for collection in collections]


@router.post("/collections", response_model=CatalogCollection)
async def create_collection(collection: CatalogCollectionCreate, user_id: str = Depends(verify_admin)):
    db = get_db()
    payload = collection.dict()

    if db.catalog_collections.find_one({"slug": payload["slug"]}):
        raise HTTPException(status_code=400, detail="Collection slug already exists")

    collection_doc = _prepare_collection_doc(payload)
    result = db.catalog_collections.insert_one(collection_doc)
    created = db.catalog_collections.find_one({"_id": result.inserted_id})
    invalidate_catalog_cache()
    return CatalogCollection(**serialize_collection(created))


@router.put("/collections/{slug}", response_model=CatalogCollection)
async def update_collection(slug: str, collection: CatalogCollectionUpdate, user_id: str = Depends(verify_admin)):
    db = get_db()
    existing = db.catalog_collections.find_one({"slug": slug})
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")

    payload = collection.dict(exclude_unset=True)
    next_slug = payload.get("slug")
    if next_slug and next_slug != slug:
        if db.catalog_collections.find_one({"slug": next_slug, "_id": {"$ne": existing["_id"]}}):
            raise HTTPException(status_code=400, detail="Collection slug already exists")

    next_title = payload.get("title") or existing.get("title", "")
    merged = _prepare_collection_doc(payload, existing)
    db.catalog_collections.update_one({"_id": existing["_id"]}, {"$set": merged})

    if (next_slug and next_slug != slug) or (payload.get("title") and payload["title"] != existing.get("title")):
        slug_map = {slug: next_slug} if next_slug and next_slug != slug else {}
        affected_products = db.products.find(_collection_link_filter(slug))
        for product_doc in affected_products:
            db.products.update_one(
                {"_id": product_doc["_id"]},
                {"$set": _sync_product_collection_labels(db, product_doc, slug_map)},
            )

    updated = db.catalog_collections.find_one({"_id": existing["_id"]})
    invalidate_catalog_cache()
    return CatalogCollection(**serialize_collection(updated))


@router.delete("/collections/{slug}")
async def delete_collection(slug: str, user_id: str = Depends(verify_admin)):
    db = get_db()
    existing = db.catalog_collections.find_one({"slug": slug})
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")

    linked_products = db.products.count_documents(_collection_link_filter(slug))
    if linked_products > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete collection with {linked_products} linked products",
        )

    db.catalog_collections.delete_one({"_id": existing["_id"]})
    invalidate_catalog_cache()
    return {"message": "Collection deleted successfully"}


@router.get("/orders", response_model=List[Order])
async def list_orders(user_id: str = Depends(verify_admin)):
    db = get_db()
    orders = db.orders.find({}).sort([("created_at", -1)])
    return [Order(**serialize_order(order)) for order in orders]


@router.patch("/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    payload: AdminOrderStatusUpdate,
    user_id: str = Depends(verify_admin),
):
    db = get_db()
    order = _find_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    next_status = payload.status

    db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": next_status,
                "trackingSteps": tracking_steps_for_status(next_status),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    updated = db.orders.find_one({"_id": order["_id"]})
    return Order(**serialize_order(updated))


@router.post("/catalog/import", response_model=CatalogImportResponse)
async def import_catalog(payload: CatalogImportRequest, user_id: str = Depends(verify_admin)):
    db = get_db()
    collections_upserted = 0
    products_upserted = 0

    for collection in payload.collections:
        doc = _prepare_collection_doc(collection.dict())
        db.catalog_collections.update_one({"slug": doc["slug"]}, {"$set": doc}, upsert=True)
        collections_upserted += 1

    for product in payload.products:
        product_payload = product.dict()
        doc = _prepare_product_doc(db, product_payload)
        db.products.update_one({"slug": doc["slug"]}, {"$set": doc}, upsert=True)
        products_upserted += 1

    invalidate_catalog_cache()

    return CatalogImportResponse(
        collections_upserted=collections_upserted,
        products_upserted=products_upserted,
    )


@router.get("/stats")
async def get_stats(user_id: str = Depends(verify_admin)):
    db = get_db()

    total_products = db.products.count_documents({})
    total_collections = db.catalog_collections.count_documents({})
    total_users = db.users.count_documents({})
    total_orders = db.orders.count_documents({})
    total_revenue = sum(order.get("total_amount", 0) for order in db.orders.find({}))

    return {
        "total_products": total_products,
        "total_collections": total_collections,
        "total_users": total_users,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
    }


@router.get("/uploads/products", response_model=List[ProductImageAsset])
async def list_product_media(limit: int = 100, user_id: str = Depends(verify_admin)):
    db = get_db()
    safe_limit = max(1, min(limit, 500))
    return [
        ProductImageAsset(
            **image,
            product_usage_count=_count_products_using_image(db, image["object_name"]),
        )
        for image in list_product_images(safe_limit)
    ]


@router.delete("/uploads/products")
async def delete_product_media(
    object_name: str = Query(..., min_length=1),
    user_id: str = Depends(verify_admin),
):
    db = get_db()
    usage_count = _count_products_using_image(db, object_name)
    if usage_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Không thể xóa ảnh vì đang được {usage_count} sản phẩm sử dụng.",
        )

    try:
        return delete_product_image(object_name)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product image object name")


@router.post("/uploads/products", response_model=ProductImageUploadResponse)
async def upload_product_media(file: UploadFile = File(...), user_id: str = Depends(verify_admin)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use JPG, PNG, WEBP, or GIF.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty upload")

    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds 10 MB limit")

    upload = upload_product_image(content, file.filename, file.content_type or "")
    return ProductImageUploadResponse(**upload)
