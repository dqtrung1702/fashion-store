from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from catalog import is_object_id, serialize_product
from database import get_db
from models import Product, Wishlist, WishlistItemCreate
from security import verify_token

router = APIRouter()


def _find_product(db, product_id: str):
    product = None
    if is_object_id(product_id):
        product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        product = db.products.find_one({"slug": product_id})
    return product


def _get_or_create_wishlist(db, user_id: str):
    wishlist = db.wishlists.find_one({"user_id": user_id})
    if wishlist:
        return wishlist

    now = datetime.utcnow()
    wishlist = {
        "user_id": user_id,
        "items": [],
        "created_at": now,
        "updated_at": now,
    }
    db.wishlists.insert_one(wishlist)
    return wishlist


def _serialize_wishlist(db, wishlist_doc: dict):
    product_ids = [item.get("product_id") for item in (wishlist_doc.get("items") or []) if item.get("product_id")]
    serialized_items = []

    for product_id in product_ids:
        product = None
        if is_object_id(product_id):
            product = db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            continue
        serialized_items.append(Product(**serialize_product(product)))

    return {
        "user_id": wishlist_doc.get("user_id") or "",
        "items": serialized_items,
        "created_at": wishlist_doc.get("created_at"),
        "updated_at": wishlist_doc.get("updated_at"),
    }


@router.get("/", response_model=Wishlist)
async def get_wishlist(user_id: str = Depends(verify_token)):
    db = get_db()
    wishlist = _get_or_create_wishlist(db, user_id)
    return Wishlist(**_serialize_wishlist(db, wishlist))


@router.post("/items", response_model=Wishlist)
async def add_to_wishlist(item: WishlistItemCreate, user_id: str = Depends(verify_token)):
    db = get_db()
    product = _find_product(db, item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    wishlist = _get_or_create_wishlist(db, user_id)
    stored_product_id = str(product.get("_id"))

    if not any(entry.get("product_id") == stored_product_id for entry in (wishlist.get("items") or [])):
        wishlist_items = list(wishlist.get("items") or [])
        wishlist_items.insert(0, {"product_id": stored_product_id, "added_at": datetime.utcnow()})
        db.wishlists.update_one(
            {"user_id": user_id},
            {"$set": {"items": wishlist_items, "updated_at": datetime.utcnow()}},
            upsert=True,
        )

    updated = db.wishlists.find_one({"user_id": user_id}) or wishlist
    return Wishlist(**_serialize_wishlist(db, updated))


@router.delete("/items/{product_id}", response_model=Wishlist)
async def remove_from_wishlist(product_id: str, user_id: str = Depends(verify_token)):
    db = get_db()
    wishlist = db.wishlists.find_one({"user_id": user_id})
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    product = _find_product(db, product_id)
    stored_product_id = str(product.get("_id")) if product else product_id
    next_items = [
        item
        for item in (wishlist.get("items") or [])
        if item.get("product_id") != stored_product_id
    ]

    db.wishlists.update_one(
        {"user_id": user_id},
        {"$set": {"items": next_items, "updated_at": datetime.utcnow()}},
    )

    updated = db.wishlists.find_one({"user_id": user_id}) or wishlist
    updated["items"] = next_items
    return Wishlist(**_serialize_wishlist(db, updated))


@router.delete("/", response_model=dict)
async def clear_wishlist(user_id: str = Depends(verify_token)):
    db = get_db()
    db.wishlists.delete_one({"user_id": user_id})
    return {"message": "Wishlist cleared successfully"}
