from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from catalog import is_object_id
from database import get_db
from models import Order, OrderCreate, OrderItem, OrderStatus, OrderTrackingStep
from order_flow import serialize_order, tracking_steps_for_status
from security import get_optional_user_id, verify_token

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


def _build_shipping_address(customer: dict) -> str:
    return ", ".join(
        [
            part
            for part in [
                customer.get("fullName"),
                customer.get("address"),
                customer.get("city"),
                customer.get("country"),
                customer.get("postalCode"),
            ]
            if part
        ]
    )


def _generate_order_number(db) -> str:
    count = db.orders.count_documents({})
    return f"FS{str(2041 + count + 1).zfill(5)}"


def _build_order_items(db, order_data: OrderCreate) -> List[dict]:
    order_items = []

    for item in order_data.items:
        product = _find_product(db, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")

        variants = product.get("variants") or []
        variant = None
        if item.variant_id:
            variant = next((entry for entry in variants if entry.get("id") == item.variant_id), None)
        elif item.variant_sku:
            variant = next((entry for entry in variants if entry.get("sku") == item.variant_sku), None)
        elif variants:
            variant = next((entry for entry in variants if int(entry.get("stock", 0) or 0) > 0), None)

        if variants and not variant:
            raise HTTPException(status_code=400, detail=f"Variant not found for product {product.get('name')}")

        available_stock = int((variant or {}).get("stock", product.get("stock", 0)) or 0)
        if available_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Sản phẩm {product.get('name')} không đủ tồn kho cho số lượng yêu cầu.",
            )

        order_items.append(
            {
                "product_id": str(product.get("_id")),
                "product_name": product.get("name") or "",
                "quantity": item.quantity,
                "price": float((variant or {}).get("price") or product.get("price") or 0),
                "size": (variant or {}).get("size") or "One Size",
                "color": (variant or {}).get("color") or None,
                "image": product.get("coverImage") or (product.get("images") or [""])[0],
                "variant_id": (variant or {}).get("id"),
                "variant_sku": (variant or {}).get("sku"),
            }
        )

    return order_items


def _decrement_inventory(db, items: List[dict]) -> None:
    for item in items:
        product = db.products.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        variants = product.get("variants") or []
        for variant in variants:
            if variant.get("id") == item.get("variant_id"):
                variant["stock"] = max(0, int(variant.get("stock", 0) or 0) - int(item.get("quantity", 0) or 0))
                break

        db.products.update_one(
            {"_id": product["_id"]},
            {
                "$set": {
                    "variants": variants,
                    "updated_at": datetime.utcnow(),
                }
            },
        )


@router.get("/", response_model=List[Order])
async def get_user_orders(user_id: str = Depends(verify_token)):
    db = get_db()
    orders = db.orders.find({"user_id": user_id}).sort("created_at", -1)
    return [Order(**serialize_order(order)) for order in orders]


@router.post("/", response_model=Order)
async def create_order(order_data: OrderCreate, user_id: Optional[str] = Depends(get_optional_user_id)):
    db = get_db()

    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order_items = _build_order_items(db, order_data)
    subtotal_amount = sum(item["price"] * item["quantity"] for item in order_items)
    shipping_amount = 0 if subtotal_amount >= FREE_SHIPPING_THRESHOLD else STANDARD_SHIPPING_FEE
    total_amount = subtotal_amount + shipping_amount
    now = datetime.utcnow()

    order_doc = {
        "orderNumber": _generate_order_number(db),
        "user_id": user_id,
        "email": order_data.customer.email.lower(),
        "items": order_items,
        "subtotal_amount": subtotal_amount,
        "shipping_amount": shipping_amount,
        "total_amount": total_amount,
        "status": OrderStatus.PENDING,
        "shipping_address": _build_shipping_address(order_data.customer.model_dump()),
        "contact_phone": order_data.customer.phone.strip(),
        "payment_method": order_data.payment_method,
        "trackingSteps": tracking_steps_for_status(OrderStatus.PENDING),
        "created_at": now,
        "updated_at": now,
    }

    result = db.orders.insert_one(order_doc)
    _decrement_inventory(db, order_items)

    if user_id:
        db.carts.delete_one({"user_id": user_id})

    created = db.orders.find_one({"_id": result.inserted_id})
    return Order(**serialize_order(created))


@router.get("/track", response_model=Order)
async def track_order(
    order_number: str = Query(..., alias="orderNumber", min_length=3),
):
    db = get_db()
    order = db.orders.find_one({"orderNumber": order_number.strip().upper()})

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return Order(**serialize_order(order))


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, user_id: str = Depends(verify_token)):
    db = get_db()
    query = {"user_id": user_id}
    if is_object_id(order_id):
        query["_id"] = ObjectId(order_id)
    else:
        query["orderNumber"] = order_id

    order = db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return Order(**serialize_order(order))


@router.patch("/{order_id}/cancel", response_model=Order)
async def cancel_order(order_id: str, user_id: str = Depends(verify_token)):
    db = get_db()
    query = {"user_id": user_id}
    if is_object_id(order_id):
        query["_id"] = ObjectId(order_id)
    else:
        query["orderNumber"] = order_id

    order = db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("status") not in {OrderStatus.CONFIRMED, OrderStatus.PENDING}:
        raise HTTPException(status_code=400, detail="Only pending or confirmed orders can be cancelled")

    db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": OrderStatus.CANCELLED,
                "trackingSteps": tracking_steps_for_status(OrderStatus.CANCELLED),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    updated = db.orders.find_one({"_id": order["_id"]})
    return Order(**serialize_order(updated))
