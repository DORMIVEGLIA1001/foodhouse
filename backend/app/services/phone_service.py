from __future__ import annotations

from datetime import datetime

import httpx

from app.core.config import get_settings
from app.repositories.store import store
from app.services.utils import normalize_phone


class PhoneService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def debug_twilio(self) -> dict:
        configured = bool(
            self.settings.twilio_account_sid
            and self.settings.twilio_auth_token
            and self.settings.twilio_phone_number
        )
        return {
            "success": True,
            "accountSid": self.settings.twilio_account_sid,
            "configFromNum": self.settings.twilio_phone_number,
            "verifiedNumbers": [],
            "inboundNumbers": [],
            "message": "Twilio da duoc cau hinh." if configured else "Twilio chua duoc cau hinh day du.",
        }

    async def trigger_call(self, order_id: str, phone_number: str, customer_name: str | None = None) -> dict:
        order = store.find_order(order_id)
        if not order:
            raise ValueError("Khong tim thay don hang")

        if not self._is_configured():
            call_sid = store.next_call_sid()
            order["callStatus"] = "calling"
            order["callSid"] = call_sid
            order["callLog"].append(f"Bat dau goi mo phong toi {phone_number}.")
            return {
                "success": True,
                "callSid": call_sid,
                "simulated": True,
                "message": f"Da kich hoat cuoc goi mo phong cho {customer_name or order['customerName']}.",
            }

        normalized_to = normalize_phone(phone_number)
        twiml = self._build_test_call_twiml(customer_name or order["customerName"], order_id)

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{self.settings.twilio_account_sid}/Calls.json",
                auth=(self.settings.twilio_account_sid, self.settings.twilio_auth_token),
                data={
                    "To": normalized_to,
                    "From": self._normalized_from_number(),
                    "Twiml": twiml,
                },
            )
            data = response.json()

        if not response.is_success:
            return {
                "success": False,
                "simulated": False,
                "error": data,
            }

        call_sid = data.get("sid") or store.next_call_sid()
        order["callStatus"] = "calling"
        order["callSid"] = call_sid
        order["callLog"].append(f"Bat dau goi that toi {normalized_to} luc {datetime.utcnow().isoformat()}.")
        return {
            "success": True,
            "callSid": call_sid,
            "simulated": False,
            "message": f"Da goi toi {customer_name or order['customerName']}.",
            "providerResponse": data,
        }

    def simulate_action(self, order_id: str, action: str) -> dict:
        order = store.find_order(order_id)
        if not order:
            raise ValueError("Khong tim thay don hang")
        action_map = {
            "ringing": "ringing",
            "answer": "answered",
            "confirm": "confirmed",
            "cancel": "cancelled",
            "fail": "failed",
        }
        status = action_map.get(action, "idle")
        order["callStatus"] = status
        order["callLog"].append(f"Call state -> {status}")
        if status == "confirmed" and order["trackingStatus"] == "pending":
            order["trackingStatus"] = "preparing"
        if status == "cancelled":
            order["trackingStatus"] = "cancelled"
        return {"success": True, "order": order}

    async def send_sms(self, to_phone_number: str, body_text: str) -> dict:
        normalized_to = normalize_phone(to_phone_number)

        if not self._is_configured():
            return {
                "success": True,
                "simulated": True,
                "to": normalized_to,
                "body": body_text,
                "message": "Tin nhan da duoc ghi nhan o che do mo phong.",
            }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{self.settings.twilio_account_sid}/Messages.json",
                auth=(self.settings.twilio_account_sid, self.settings.twilio_auth_token),
                data={
                    "To": normalized_to,
                    "From": self._normalized_from_number(),
                    "Body": body_text,
                },
            )
            data = response.json()

        if not response.is_success:
            return {
                "success": False,
                "simulated": False,
                "to": normalized_to,
                "error": data,
            }

        return {
            "success": True,
            "simulated": False,
            "to": normalized_to,
            "body": body_text,
            "sid": data.get("sid"),
            "status": data.get("status"),
            "providerResponse": data,
        }

    def simulation_reply(self, current_text: str, step: int, order_detail: str) -> dict:
        text = current_text.lower()
        if any(keyword in text for keyword in ["dong y", "xac nhan", "ok", "duoc"]):
            reply = "Cam on anh chi da xac nhan. Nha hang se tien hanh chuan bi don ngay."
        elif any(keyword in text for keyword in ["doi", "thay", "sua"]):
            reply = f"Em da ghi nhan yeu cau dieu chinh. Thong tin hien tai: {order_detail}"
        elif any(keyword in text for keyword in ["huy", "khong lay"]):
            reply = "Em da ghi nhan yeu cau huy. Nhan vien se kiem tra va xac nhan lai ngay."
        else:
            reply = "Em da nghe ro. Nha hang se tiep tuc xu ly don va cap nhat cho anh chi."
        return {"success": True, "text": reply, "step": step}

    def _is_configured(self) -> bool:
        return bool(
            self.settings.twilio_account_sid
            and self.settings.twilio_auth_token
            and self.settings.twilio_phone_number
        )

    def _normalized_from_number(self) -> str:
        return self.settings.twilio_phone_number.replace(" ", "")

    def _build_test_call_twiml(self, customer_name: str, order_id: str) -> str:
        return (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            "<Response>"
            f"<Say voice=\"alice\" language=\"vi-VN\">Xin chao {customer_name}. Day la cuoc goi kiem tra tu FoodHouse cho don hang {order_id}. "
            "Neu ban nghe duoc cuoc goi nay, nghia la Twilio da duoc ket noi thanh cong. Cam on ban.</Say>"
            "</Response>"
        )


phone_service = PhoneService()
