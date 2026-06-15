from __future__ import annotations

import random

from app.repositories.store import store
from app.services.email_service import email_service
from app.services.utils import now_iso


class ReservationService:
    def list_reservations(self) -> list[dict]:
        return store.reservations

    async def create_reservation(self, payload: dict) -> dict:
        reservation = {
            "id": store.next_reservation_id(),
            "customerName": payload["customerName"],
            "phoneNumber": payload["phoneNumber"],
            "customerEmail": payload.get("customerEmail", ""),
            "numberOfGuests": payload["numberOfGuests"],
            "reservationTime": payload["reservationTime"],
            "tableNumber": random.randint(1, 15),
            "sittingArea": payload.get("sittingArea") or "Trong nha am cung",
            "status": "confirmed",
            "createdAt": now_iso(),
        }
        store.reservations.append(reservation)
        if reservation["customerEmail"]:
            await email_service.send_email(
                reservation["customerEmail"],
                f"[Huong Viet] Xac nhan dat ban {reservation['id']}",
                f"<p>Ban da dat ban thanh cong vao {reservation['reservationTime']}.</p>",
            )
        return reservation

    def cancel_reservation(self, reservation_id: str) -> dict:
        reservation = store.find_reservation(reservation_id)
        if not reservation:
            raise ValueError("Khong tim thay dat ban")
        reservation["status"] = "cancelled"
        return reservation


reservation_service = ReservationService()

