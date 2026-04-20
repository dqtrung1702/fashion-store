from datetime import datetime

from models import OrderStatus


def tracking_steps_for_status(status: str):
    now = datetime.utcnow()

    if status == OrderStatus.CANCELLED:
        return [
            {
                "label": "Đã tạo đơn",
                "active": True,
                "detail": "Đơn hàng đã bị hủy trước khi cửa hàng hoàn tất bước xác nhận.",
                "timestamp": now,
            },
            {
                "label": "Chờ xác nhận thanh toán",
                "active": False,
                "detail": "Cửa hàng sẽ không gửi lại hướng dẫn thanh toán vì đơn đã bị hủy.",
            },
            {
                "label": "Đang chuẩn bị hàng",
                "active": False,
                "detail": "Bước này sẽ không diễn ra vì đơn đã bị hủy.",
            },
            {
                "label": "Đang giao hàng",
                "active": False,
                "detail": "Bước này sẽ không diễn ra vì đơn đã bị hủy.",
            },
        ]

    step1 = {
        "label": "Đã tạo đơn",
        "active": True,
        "detail": "Đơn hàng đã được tiếp nhận. Cửa hàng sẽ sớm kiểm tra và liên hệ lại theo thông tin bạn đã để lại.",
        "timestamp": now,
    }

    step2 = {
        "label": "Chờ xác nhận thanh toán",
        "active": True,
        "detail": "Nhân viên cửa hàng sẽ gửi thông tin thanh toán qua các phương thức liên hệ bạn đã điền trong phần giao hàng.",
        "timestamp": now,
    }

    step3 = {
        "label": "Đang chuẩn bị hàng",
        "active": False,
        "detail": "Bước này sẽ bắt đầu sau khi cửa hàng xác nhận thanh toán thành công.",
    }

    step4 = {
        "label": "Đang giao hàng",
        "active": False,
        "detail": "Hiển thị khi đơn đã được bàn giao cho đơn vị vận chuyển.",
    }

    if status == OrderStatus.CONFIRMED:
        step2["detail"] = "Cửa hàng đã xác nhận thanh toán và đơn đang chờ chuyển sang khâu chuẩn bị hàng."
    elif status == OrderStatus.PROCESSING:
        step2["detail"] = "Cửa hàng đã xác nhận thanh toán."
        step3["active"] = True
        step3["detail"] = "Đơn hàng đang được chuẩn bị tại cửa hàng."
        step3["timestamp"] = now
    elif status == OrderStatus.SHIPPED:
        step2["detail"] = "Cửa hàng đã xác nhận thanh toán."
        step3["active"] = True
        step3["detail"] = "Đơn hàng đã được chuẩn bị và bàn giao cho đơn vị vận chuyển."
        step3["timestamp"] = now
        step4["active"] = True
        step4["detail"] = "Đơn hàng đang trên đường giao tới bạn."
        step4["timestamp"] = now
    elif status == OrderStatus.DELIVERED:
        step2["detail"] = "Cửa hàng đã xác nhận thanh toán."
        step3["active"] = True
        step3["detail"] = "Đơn hàng đã được chuẩn bị và bàn giao cho đơn vị vận chuyển."
        step3["timestamp"] = now
        step4["active"] = True
        step4["detail"] = "Đơn hàng đã được giao thành công."
        step4["timestamp"] = now

    return [step1, step2, step3, step4]


def serialize_order(order_doc: dict) -> dict:
    return {
        "id": str(order_doc.get("_id")),
        "orderNumber": order_doc.get("orderNumber") or order_doc.get("order_number") or "",
        "user_id": order_doc.get("user_id"),
        "email": order_doc.get("email") or "",
        "items": order_doc.get("items") or [],
        "subtotal_amount": float(order_doc.get("subtotal_amount", 0) or 0),
        "shipping_amount": float(order_doc.get("shipping_amount", 0) or 0),
        "total_amount": float(order_doc.get("total_amount", 0) or 0),
        "status": order_doc.get("status") or OrderStatus.PENDING,
        "shipping_address": order_doc.get("shipping_address") or "",
        "contact_phone": order_doc.get("contact_phone") or "",
        "payment_method": order_doc.get("payment_method") or "",
        "trackingSteps": order_doc.get("trackingSteps") or order_doc.get("tracking_steps") or [],
        "created_at": order_doc.get("created_at"),
        "updated_at": order_doc.get("updated_at"),
    }
