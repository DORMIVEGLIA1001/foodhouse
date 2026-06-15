from __future__ import annotations

from datetime import datetime

from app.repositories.store import store


class DriverService:
    def get_driver_map(self, order_id: str) -> dict:
        order = store.find_order(order_id)
        if not order:
            raise ValueError("Khong tim thay don hang")

        route = store.delivery_route
        current_step = order.get("manualDriverStep")
        if current_step is None:
            created_at = datetime.fromisoformat(order["createdAt"])
            elapsed_seconds = max(0, int((datetime.utcnow() - created_at).total_seconds()))
            current_step = min(elapsed_seconds // 8, len(route) - 1)
            order["manualDriverStep"] = current_step

        current_step = max(0, min(current_step, len(route) - 1))
        route_loc = route[current_step]
        order["driverLocation"] = {"lat": route_loc["lat"], "lng": route_loc["lng"]}

        tracking_status = order["trackingStatus"]
        if current_step >= len(route) - 1 and tracking_status not in ("cancelled", "delivered"):
            tracking_status = "delivered"
            order["trackingStatus"] = "delivered"
        elif tracking_status not in ("cancelled", "delivered"):
            tracking_status = "shipping"
            order["trackingStatus"] = "shipping"

        return {
            "success": True,
            "orderId": order_id,
            "trackingStatus": tracking_status,
            "currentStep": current_step,
            "totalSteps": len(route),
            "driverLocation": order["driverLocation"],
            "restaurantCoords": store.restaurant_coords,
            "deliveryCoords": {"lat": route[-1]["lat"], "lng": route[-1]["lng"]},
            "routeDetail": route_loc["detail"],
        }


driver_service = DriverService()

