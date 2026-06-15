from app.repositories.store import store
from app.services.utils import now_iso


class DishService:
    def list_dishes(self) -> list[dict]:
        return store.dishes

    def add_review(self, dish_id: str, name: str, rating: int, text: str) -> dict:
        dish = store.find_dish(dish_id)
        if not dish:
            raise ValueError("Khong tim thay mon an")
        review = {
            "id": f"rev-{dish_id}-{len(dish['reviews']) + 1}",
            "name": name,
            "rating": rating,
            "text": text,
            "date": now_iso()[:10],
        }
        dish["reviews"].append(review)
        total = sum(item["rating"] for item in dish["reviews"])
        dish["rating"] = round(total / len(dish["reviews"]), 1)
        return dish

    def update_stock(self, dish_id: str, is_available: bool) -> dict:
        dish = store.find_dish(dish_id)
        if not dish:
            raise ValueError("Khong tim thay mon an")
        dish["isAvailable"] = is_available
        return dish

    def add_dish(self, payload: dict) -> dict:
        new_dish = {
            "id": f"dish-{len(store.dishes) + 1}-{now_iso().replace(':', '').replace('-', '')}",
            "rating": 5.0,
            "ingredients": [],
            "instructions": [],
            "nutrition": None,
            "reviews": [],
            "isAvailable": True,
            **payload,
        }
        store.dishes.append(new_dish)
        return new_dish

    def update_dish(self, dish_id: str, payload: dict) -> dict:
        dish = store.find_dish(dish_id)
        if not dish:
            raise ValueError("Khong tim thay mon an")
        dish.update(payload)
        return dish

    def delete_dish(self, dish_id: str) -> None:
        dish = store.find_dish(dish_id)
        if not dish:
            raise ValueError("Khong tim thay mon an")
        store.dishes = [item for item in store.dishes if item["id"] != dish_id]


dish_service = DishService()
