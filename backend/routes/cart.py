from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from catalog import is_object_id
from database import get_db
from models import Cart, CartItemCreate, CartItemUpdate
from security import verify_token

router = APIRouter()

FREE_SHIPPING_THRESHOLD = 2000000
STANDARD_SHIPPING_FEE = 30000


def _find_product(db, product_id: str):
    product = None
    if is_object_id(product_id):
        product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        product = db.products.find_one({"slug": product_id})
    return product


def _find_variant(product: dict, variant_id: Optional[str] = None, variant_sku: Optional[str] = None):
    variants = product.get("variants") or []
    if variant_id:
        return next((variant for variant in variants if variant.get("id") == variant_id), None)
    if variant_sku:
        return next((variant for variant in variants if variant.get("sku") == variant_sku), None)
    if variants:
        return next(
            (
                variant
                for variant in variants
                if variant.get("isActive", True) and int(variant.get("stock", 0) or 0) > 0
            ),
            None,
        ) or next((variant for variant in variants if variant.get("isActive", True)), None)
    return None


def _cart_item_key(product_id: str, variant_id: Optional[str], variant_sku: Optional[str]) -> str:
    return variant_id or variant_sku or product_id


def _build_cart_item(product: dict, variant: Optional[dict], quantity: int) -> dict:
    return {
        "product_id": str(product.get("_id")),
        "quantity": quantity,
        "size": (variant or {}).get("size") or "One Size",
        "color": (variant or {}).get("color") or "",
        "variant_id": (variant or {}).get("id"),
        "variant_sku": (variant or {}).get("sku"),
        "price_snapshot": float((variant or {}).get("price") or product.get("price") or 0),
        "product_name_snapshot": product.get("name") or "",
        "image_snapshot": product.get("coverImage") or (product.get("images") or [""])[0],
        "category_snapshot": product.get("category") or "",
        "slug_snapshot": product.get("slug") or "",
    }


def _get_or_create_cart(db, user_id: str) -> dict:
    cart = db.carts.find_one({"user_id": user_id})
    if cart:
        return cart

    now = datetime.utcnow()
    cart = {
        "user_id": user_id,
        "items": [],
        "created_at": now,
        "updated_at": now,
    }
    db.carts.insert_one(cart)
    return cart


def _serialize_cart(db, cart_doc: dict) -> dict:
    serialized_items = []

    for item in cart_doc.get("items") or []:
        product = db.products.find_one({"_id": ObjectId(item["product_id"])}) if is_object_id(item.get("product_id", "")) else None
        variant = _find_variant(product, item.get("variant_id"), item.get("variant_sku")) if product else None

        current_price = float((variant or {}).get("price") or (product or {}).get("price") or item.get("price_snapshot") or 0)
        max_quantity = int((variant or {}).get("stock", (product or {}).get("stock", 0)) or 0)
        available = bool(product) and max_quantity > 0

        serialized_items.append(
            {
                "product_id": item.get("product_id") or "",
                "quantity": int(item.get("quantity", 1) or 1),
                "size": item.get("size") or "One Size",
                "color": item.get("color") or "",
                "price": current_price,
                "product_name": (product or {}).get("name") or item.get("product_name_snapshot") or "",
                "image": (product or {}).get("coverImage") or item.get("image_snapshot") or "",
                "category": (product or {}).get("category") or item.get("category_snapshot") or "",
                "slug": (product or {}).get("slug") or item.get("slug_snapshot") or "",
                "variant_id": item.get("variant_id"),
                "variant_sku": item.get("variant_sku"),
                "max_quantity": max(0, max_quantity),
                "available": available,
            }
        )

    subtotal_amount = sum(item["price"] * item["quantity"] for item in serialized_items)
    shipping_amount = 0 if not serialized_items or subtotal_amount >= FREE_SHIPPING_THRESHOLD else STANDARD_SHIPPING_FEE

    return {
        "user_id": cart_doc.get("user_id") or "",
        "items": serialized_items,
        "subtotal_amount": subtotal_amount,
        "shipping_amount": shipping_amount,
        "total_amount": subtotal_amount + shipping_amount,
        "created_at": cart_doc.get("created_at"),
        "updated_at": cart_doc.get("updated_at"),
    }


@router.get("/", response_model=Cart)
async def get_cart(user_id: str = Depends(verify_token)):
    db = get_db()
    cart = _get_or_create_cart(db, user_id)
    return Cart(**_serialize_cart(db, cart))


@router.post("/items", response_model=Cart)
async def add_to_cart(item: CartItemCreate, user_id: str = Depends(verify_token)):
    db = get_db()

    product = _find_product(db, item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = _find_variant(product, item.variant_id, item.variant_sku)
    if product.get("variants") and not variant:
        raise HTTPException(status_code=400, detail="Variant not found")

    max_quantity = int((variant or {}).get("stock", product.get("stock", 0)) or 0)
    if max_quantity < item.quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")

    cart = _get_or_create_cart(db, user_id)
    stored_product_id = str(product.get("_id"))
    target_key = _cart_item_key(stored_product_id, (variant or {}).get("id"), (variant or {}).get("sku"))

    items = list(cart.get("items") or [])
    match_index = next(
        (
            index
            for index, existing in enumerate(items)
            if _cart_item_key(existing.get("product_id"), existing.get("variant_id"), existing.get("variant_sku")) == target_key
        ),
        None,
    )

    if match_index is not None:
        next_quantity = int(items[match_index].get("quantity", 0) or 0) + item.quantity
        if next_quantity > max_quantity:
            raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")
        items[match_index] = _build_cart_item(product, variant, next_quantity)
    else:
        items.append(_build_cart_item(product, variant, item.quantity))

    updated_at = datetime.utcnow()
    db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": items, "updated_at": updated_at}},
        upsert=True,
    )

    updated = db.carts.find_one({"user_id": user_id}) or {
        "user_id": user_id,
        "items": items,
        "created_at": updated_at,
        "updated_at": updated_at,
    }
    return Cart(**_serialize_cart(db, updated))


@router.patch("/items/{product_id}", response_model=Cart)
async def update_cart_item(
    product_id: str,
    item: CartItemUpdate,
    user_id: str = Depends(verify_token),
):
    db = get_db()
    cart = db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    product = _find_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = _find_variant(product, item.variant_id, item.variant_sku)
    if product.get("variants") and not variant:
        raise HTTPException(status_code=400, detail="Variant not found")

    max_quantity = int((variant or {}).get("stock", product.get("stock", 0)) or 0)
    if item.quantity > max_quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")

    stored_product_id = str(product.get("_id"))
    target_key = _cart_item_key(stored_product_id, (variant or {}).get("id"), (variant or {}).get("sku"))
    items = list(cart.get("items") or [])
    match_index = next(
        (
            index
            for index, existing in enumerate(items)
            if _cart_item_key(existing.get("product_id"), existing.get("variant_id"), existing.get("variant_sku")) == target_key
        ),
        None,
    )

    if match_index is None:
        raise HTTPException(status_code=404, detail="Cart item not found")

    items[match_index] = _build_cart_item(product, variant, item.quantity)
    db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": items, "updated_at": datetime.utcnow()}},
    )

    updated = db.carts.find_one({"user_id": user_id}) or cart
    return Cart(**_serialize_cart(db, updated))


@router.delete("/items/{product_id}", response_model=Cart)
async def remove_from_cart(
    product_id: str,
    variant_id: Optional[str] = Query(None, alias="variantId"),
    variant_sku: Optional[str] = Query(None, alias="variantSku"),
    user_id: str = Depends(verify_token),
):
    db = get_db()
    cart = db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    product = _find_product(db, product_id)
    stored_product_id = str(product.get("_id")) if product else product_id
    target_key = _cart_item_key(stored_product_id, variant_id, variant_sku)

    next_items = [
        item
        for item in (cart.get("items") or [])
        if _cart_item_key(item.get("product_id"), item.get("variant_id"), item.get("variant_sku")) != target_key
    ]

    db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": next_items, "updated_at": datetime.utcnow()}},
    )

    updated = db.carts.find_one({"user_id": user_id}) or cart
    updated["items"] = next_items
    return Cart(**_serialize_cart(db, updated))


@router.delete("/", response_model=dict)
async def clear_cart(user_id: str = Depends(verify_token)):
    db = get_db()
    db.carts.delete_one({"user_id": user_id})
    return {"message": "Cart cleared successfully"}
