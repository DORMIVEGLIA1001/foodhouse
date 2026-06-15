from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta
from threading import Lock
from uuid import uuid4

from app.core.catalog import DEFAULT_USERS, DELIVERY_ROUTE, RESTAURANT_COORDS, seed_dishes


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.dishes = seed_dishes()
            self.orders = [
                {
                    "id": "HV-2026",
                    "items": [
                        {"dishId": "dish-1", "name": "Pho Bo Huong Viet", "price": 120000, "quantity": 1},
                        {"dishId": "dish-5", "name": "Ca Phe Trung", "price": 50000, "quantity": 1},
                    ],
                    "total": 170000,
                    "customerName": "Nguyen Van Hung",
                    "phoneNumber": "0901234567",
                    "customerEmail": "demo@huongviet.local",
                    "address": "Pho co Hang Ngang, Hoan Kiem, Ha Noi",
                    "deliveryType": "delivery",
                    "trackingStatus": "shipping",
                    "paymentMethod": "momo",
                    "paymentStatus": "paid",
                    "createdAt": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                    "driverLocation": dict(DELIVERY_ROUTE[2]),
                    "manualDriverStep": 2,
                    "callStatus": "confirmed",
                    "callSid": "CALL-DEMO-2026",
                    "callLog": ["Cuoc goi demo da duoc xac nhan."],
                }
            ]
            self.reservations: list[dict] = []
            self.preferences = {"dietaryNotes": "", "favorites": []}
            self.users = deepcopy(DEFAULT_USERS)
            self.phone_otps: dict[str, dict] = {}
            self.email_logs: list[dict] = []
            self.chat_histories: dict[str, list] = {}

    def next_order_id(self) -> str:
        return f"HV-{datetime.utcnow().strftime('%H%M%S')}-{uuid4().hex[:4]}"

    def next_reservation_id(self) -> str:
        return f"RE-{datetime.utcnow().strftime('%H%M%S')}-{uuid4().hex[:4]}"

    def next_call_sid(self) -> str:
        return f"CALL-{uuid4().hex[:10].upper()}"

    def find_dish(self, dish_id: str) -> dict | None:
        return next((dish for dish in self.dishes if dish["id"] == dish_id), None)

    def find_order(self, order_id: str) -> dict | None:
        return next((order for order in self.orders if order["id"] == order_id), None)

    def find_reservation(self, reservation_id: str) -> dict | None:
        return next((reservation for reservation in self.reservations if reservation["id"] == reservation_id), None)

    def find_user(self, username: str) -> dict | None:
        return next((user for user in self.users if user["username"] == username), None)

    @property
    def restaurant_coords(self) -> dict[str, float]:
        return deepcopy(RESTAURANT_COORDS)

    @property
    def delivery_route(self) -> list[dict]:
        return deepcopy(DELIVERY_ROUTE)


store = InMemoryStore()

