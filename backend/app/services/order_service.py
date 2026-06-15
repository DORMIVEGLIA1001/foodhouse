from __future__ import annotations

from app.repositories.store import store
from app.services.email_service import email_service
from app.services.utils import now_iso


def render_order_confirmation_email(order: dict) -> str:
    items_html = "".join(
        f"""
        <tr style="border-bottom: 1px solid #f2eee9;">
          <td style="padding: 14px 0; font-family: Arial, sans-serif; font-size: 14px; color: #444;">{item['name']}</td>
          <td style="padding: 14px 0; font-family: Arial, sans-serif; font-size: 14px; color: #444; text-align: center;">{item['quantity']}</td>
          <td style="padding: 14px 0; font-family: Arial, sans-serif; font-size: 14px; color: #444; text-align: right; font-weight: bold;">{(item['price'] * item['quantity']):,} đ</td>
        </tr>
        """
        for item in order["items"]
    )
    delivery_label = order["address"] if order["deliveryType"] == "delivery" else "An tai nha hang Huong Viet"
    payment_label = (
        "ZALOPAY" if order["paymentMethod"] == "zalopay"
        else "MOMO" if order["paymentMethod"] == "momo"
        else "TIEN MAT"
    )

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 36px; border: 1px solid #e6ddcf; border-radius: 20px; background: #fcfbf8; color: #444;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="margin: 0; color: #9a6a31; font-family: Georgia, serif; font-size: 34px; letter-spacing: 1px;">NHÀ HÀNG HƯƠNG VIỆT</h1>
        <p style="margin: 10px 0 0; color: #b48a5d; font-size: 12px; letter-spacing: 5px; text-transform: uppercase;">Tinh hoa ẩm thực Việt Nam</p>
        <div style="width: 74px; height: 2px; background: #b07a3d; margin: 22px auto 0;"></div>
      </div>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 22px;">Chào <strong>{order['customerName']}</strong> quý mến,</p>
      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 28px;">
        Cảm ơn bạn đã lựa chọn tin yêu và đặt hàng tại Nhà hàng Hương Việt. Chúng tôi vô cùng trân trọng cơ hội được phục vụ hương vị ấm cúng đến bàn ăn gia đình bạn! Đơn hàng của bạn đã được ghi nhận thành công trên hệ thống của chúng tôi.
      </p>

      <div style="background: #fbf7f0; border: 1px solid #eadbc8; border-radius: 18px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 18px; color: #9a6a31; font-family: Georgia, serif; font-size: 24px;">Chi Tiết Đơn Hàng #{order['id']}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-top: 1px solid #eadbc8; border-bottom: 2px solid #eadbc8;">
              <th style="padding: 16px 0 12px; text-align: left; font-size: 13px; color: #9a6a31; text-transform: uppercase;">Món ăn</th>
              <th style="padding: 16px 0 12px; text-align: center; font-size: 13px; color: #9a6a31; text-transform: uppercase;">SL</th>
              <th style="padding: 16px 0 12px; text-align: right; font-size: 13px; color: #9a6a31; text-transform: uppercase;">Đơn giá</th>
            </tr>
          </thead>
          <tbody>
            {items_html}
          </tbody>
        </table>
        <div style="margin-top: 22px; padding-top: 18px; border-top: 1px solid #eadbc8; text-align: right; color: #a06a2c; font-family: Georgia, serif; font-size: 24px; font-weight: bold;">
          Tổng thanh toán: {order['total']:,} đ
        </div>
      </div>

      <div style="background: #f6f6f6; border-radius: 14px; padding: 20px 22px; margin-bottom: 28px; line-height: 1.9; font-size: 14px;">
        <div>📍 <strong>Địa chỉ giao:</strong> {delivery_label}</div>
        <div>📞 <strong>Số điện thoại:</strong> {order['phoneNumber']}</div>
        <div>💳 <strong>Hình thức:</strong> {payment_label}</div>
        <div>🔔 <strong>Tình trạng:</strong> Tiếp nhận và chuẩn bị</div>
      </div>

      <div style="text-align: center; border-top: 1px solid #ebe5dc; padding-top: 24px;">
        <p style="margin: 0 0 10px; color: #777; font-size: 15px;">Chúc quý khách có một bữa ăn ngon miệng và hạnh phúc!</p>
        <p style="margin: 0; color: #9c9c9c; font-size: 13px;">🏡 36 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội | 📞 Hotline: 024-3999999</p>
      </div>
    </div>
    """


class OrderService:
    def list_orders(self) -> list[dict]:
        return store.orders

    async def create_order(self, payload: dict) -> dict:
        items = payload["items"]
        if not items:
            raise ValueError("Thieu mon dat")

        mapped_items = []
        for item in items:
            dish = store.find_dish(item["dishId"])
            mapped_items.append(
                {
                    "dishId": item["dishId"],
                    "name": dish["name"] if dish else item.get("name", "Mon dac biet"),
                    "price": dish["price"] if dish else item.get("price", 50000),
                    "quantity": item["quantity"],
                }
            )

        subtotal = sum(item["price"] * item["quantity"] for item in mapped_items)
        total = max(0, subtotal - int(payload.get("discount", 0) or 0))
        order = {
            "id": store.next_order_id(),
            "items": mapped_items,
            "total": total,
            "customerName": payload["customerName"],
            "phoneNumber": payload["phoneNumber"],
            "customerEmail": payload.get("customerEmail", ""),
            "address": payload.get("address", ""),
            "deliveryType": payload.get("deliveryType", "delivery"),
            "trackingStatus": "pending",
            "paymentMethod": payload.get("paymentMethod", "cash"),
            "paymentStatus": "unpaid",
            "createdAt": now_iso(),
            "driverLocation": dict(store.delivery_route[0]),
            "manualDriverStep": 0,
            "callStatus": "idle",
            "callSid": None,
            "callLog": [],
        }
        store.orders.append(order)

        if order["customerEmail"]:
            email_result = await email_service.send_email(
                order["customerEmail"],
                f"[Huong Viet] Xac nhan don hang {order['id']}",
                render_order_confirmation_email(order),
            )
            order["emailConfirmation"] = {
                "success": bool(email_result.get("success")),
                "provider": email_result.get("provider"),
                "id": email_result.get("id"),
                "error": email_result.get("error"),
            }
        else:
            order["emailConfirmation"] = {
                "success": False,
                "provider": "none",
                "error": "Chua co email khach hang de gui xac nhan.",
            }
        return order

    def pay_order(self, order_id: str, payment_method: str) -> dict:
        order = store.find_order(order_id)
        if not order:
            raise ValueError("Khong tim thay don hang")
        order["paymentStatus"] = "paid"
        order["paymentMethod"] = payment_method or order["paymentMethod"]
        order["trackingStatus"] = "preparing"
        return order

    def cancel_order(self, order_id: str) -> dict:
        order = store.find_order(order_id)
        if not order:
            raise ValueError("Khong tim thay don hang")
        order["trackingStatus"] = "cancelled"
        return order

    async def update_status(
        self,
        order_id: str,
        tracking_status: str | None = None,
        payment_status: str | None = None,
        manual_driver_step: int | None = None,
    ) -> dict:
        order = store.find_order(order_id)
        if not order:
            raise ValueError("Khong tim thay don hang")
        if tracking_status:
            order["trackingStatus"] = tracking_status
        if payment_status:
            order["paymentStatus"] = payment_status
        if manual_driver_step is not None:
            order["manualDriverStep"] = manual_driver_step
            route = store.delivery_route
            index = max(0, min(manual_driver_step, len(route) - 1))
            order["driverLocation"] = {"lat": route[index]["lat"], "lng": route[index]["lng"]}
        if order.get("customerEmail") and tracking_status:
            await email_service.send_email(
                order["customerEmail"],
                f"[Huong Viet] Cap nhat don hang {order['id']}",
                f"<p>Don hang {order['id']} hien o trang thai: <strong>{tracking_status}</strong>.</p>",
            )
        return order


order_service = OrderService()
