from __future__ import annotations

from datetime import datetime
from hashlib import sha256
import hmac

from app.core.config import get_settings


class PaymentService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def create_momo(self, order_id: str, amount: int, return_url: str | None = None) -> dict:
        partner_code = self.settings.momo_partner_code or "MOMO"
        access_key = self.settings.momo_access_key or "demo-access-key"
        secret_key = self.settings.momo_secret_key or "demo-secret-key"
        request_id = f"{order_id}-{int(datetime.utcnow().timestamp())}"
        redirect_url = return_url or "https://example.com"
        raw_signature = (
            f"accessKey={access_key}&amount={amount}&extraData=&ipnUrl={redirect_url}&"
            f"orderId={order_id}&orderInfo=Thanh toan don hang {order_id}&partnerCode={partner_code}&"
            f"redirectUrl={redirect_url}&requestId={request_id}&requestType=captureWallet"
        )
        signature = hmac.new(secret_key.encode(), raw_signature.encode(), sha256).hexdigest()
        return {
            "success": True,
            "realApi": False,
            "payload": {
                "partnerCode": partner_code,
                "requestId": request_id,
                "orderId": order_id,
                "amount": amount,
                "signature": signature,
            },
            "signature": signature,
            "apiUrl": "https://test-payment.momo.vn/v2/gateway/api/create",
            "data": {"payUrl": f"https://test-payment.momo.vn/pay/{order_id}", "resultCode": 0},
        }

    def create_zalopay(self, order_id: str, amount: int) -> dict:
        app_id = self.settings.zalopay_app_id or "2553"
        key1 = self.settings.zalopay_key1 or "demo-zalo-key"
        app_time = int(datetime.utcnow().timestamp() * 1000)
        app_trans_id = f"{datetime.utcnow():%y%m%d}_{order_id}"
        raw_mac = f"{app_id}|{app_trans_id}|HuongVietAI|{amount}|{app_time}|{{}}|[]"
        mac = hmac.new(key1.encode(), raw_mac.encode(), sha256).hexdigest()
        return {
            "success": True,
            "realApi": False,
            "payload": {
                "app_id": int(app_id),
                "app_trans_id": app_trans_id,
                "amount": amount,
                "app_time": app_time,
                "mac": mac,
            },
            "mac": mac,
            "apiUrl": "https://sb-openapi.zalopay.vn/v2/create",
            "data": {"order_url": f"https://sandbox.zalopay.vn/pay/{order_id}", "return_code": 1},
        }


payment_service = PaymentService()

