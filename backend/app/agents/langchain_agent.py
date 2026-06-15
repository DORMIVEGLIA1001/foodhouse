from __future__ import annotations

import re
import unicodedata
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import get_settings
from app.repositories.store import store
from app.services.order_service import order_service
from app.services.preferences_service import preferences_service
from app.services.reservation_service import reservation_service


settings = get_settings()

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except Exception:  # pragma: no cover
    ChatGoogleGenerativeAI = None


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return text.lower()


def extract_quantity(text: str) -> int:
    match = re.search(r"\b(\d+)\b", text)
    if not match:
        return 1
    try:
        return max(1, min(20, int(match.group(1))))
    except ValueError:
        return 1


class LangChainRestaurantAgent:
    def __init__(self) -> None:
        self.llm = self._build_llm()

    def _build_llm(self) -> ChatGoogleGenerativeAI | None:
        if not settings.gemini_api_key or ChatGoogleGenerativeAI is None:
            return None
        return ChatGoogleGenerativeAI(
            model=settings.model_name,
            google_api_key=settings.gemini_api_key,
            temperature=0.4,
        )

    async def reply(self, messages: list[dict[str, Any]], context: dict[str, Any] | None = None) -> dict[str, Any]:
        handled = await self._handle_structured_actions(messages, context or {})
        if handled is not None:
            return handled

        if self.llm is None:
            return await self._fallback_reply(messages)

        menu_context = "\n".join(
            f"- {dish['name']}: {dish['description']} ({dish['price']} VND)"
            for dish in store.dishes[:24]
        )
        prefs = store.preferences
        transcript = "\n".join(f"{msg['sender']}: {msg['text']}" for msg in messages[-16:])
        prompt = [
            SystemMessage(
                content=(
                    "Ban la tro ly am thuc Huong Viet AI. Tra loi bang tieng Viet, lich su, ngan gon va huu ich. "
                    "Day la mot cuoc tro chuyen tren web, khong huong nguoi dung sang goi dien hay SMS. "
                    "Neu khach hoi mon an, chi dua tren menu that ben duoi. "
                    "Neu khach muon dat mon, thanh toan, tra cuu don, huy don hoac dat ban, uu tien ho tro tiep trong chat. "
                    "Khong duoc invent mon ngoai menu.\n"
                    f"Khau vi da luu: {prefs.get('dietaryNotes') or 'chua co'}.\n"
                    f"Mon yeu thich: {', '.join(prefs.get('favorites', [])) or 'chua co'}.\n"
                    f"Menu hien co:\n{menu_context}"
                )
            ),
            HumanMessage(content=transcript),
        ]

        try:
            result = await self.llm.ainvoke(prompt)
            text = getattr(result, "content", None) or str(result)
            return {"text": text, "actions": []}
        except Exception:
            return await self._fallback_reply(messages)

    async def _handle_structured_actions(self, messages: list[dict[str, Any]], context: dict[str, Any]) -> dict[str, Any] | None:
        if not messages:
            return None

        last_text_raw = messages[-1]["text"]
        last_text = normalize_text(last_text_raw)
        actions: list[dict[str, Any]] = []

        if "khong hanh" in last_text or "di ung" in last_text:
            preferences = preferences_service.update_preferences(dietary_notes=last_text_raw)
            actions.append({"type": "updatePreferences", "preferences": preferences})
            return {
                "text": "Mình đã lưu ghi chú khẩu vị để các gợi ý sau phù hợp hơn cho bạn.",
                "actions": actions,
            }

        if "thich" in last_text or "yeu thich" in last_text:
            favorites = self._detect_dish_names(last_text)
            if favorites:
                current = store.preferences.get("favorites", [])
                preferences = preferences_service.update_preferences(
                    favorites=list(dict.fromkeys([*current, *favorites]))
                )
                actions.append({"type": "updatePreferences", "preferences": preferences})
                return {
                    "text": f"Mình đã lưu món bạn yêu thích: {', '.join(favorites)}.",
                    "actions": actions,
                }

        if "dat ban" in last_text:
            if any(token in last_text for token in ["toi nay", "19", "20", "2 nguoi", "4 nguoi", "ban"]):
                reservation = await reservation_service.create_reservation(
                    {
                        "customerName": context.get("customerName") or "Khach tu chat",
                        "phoneNumber": context.get("phoneNumber") or "0900000000",
                        "numberOfGuests": 2,
                        "reservationTime": "19:00 toi nay",
                        "customerEmail": context.get("customerEmail") or "",
                        "sittingArea": "Trong nha am cung",
                    }
                )
                actions.append({"type": "bookTable", "reservation": reservation})
                return {
                    "text": f"Mình đã tạo đặt bàn tạm với mã {reservation['id']} lúc {reservation['reservationTime']}.",
                    "actions": actions,
                }
            return {
                "text": "Mình có thể đặt bàn ngay. Bạn chỉ cần cho mình giờ đến và số lượng khách.",
                "actions": [],
            }

        if self._is_order_status_intent(last_text):
            order = self._find_referenced_order(last_text)
            if order:
                return {
                    "text": self._format_order_status(order),
                    "actions": [{"type": "orderStatus", "order": order}],
                }
            return {
                "text": "Mình chưa xác định được đơn hàng cần tra cứu. Bạn gửi mình mã đơn dạng HV-xxxx nhé.",
                "actions": [],
            }

        if self._is_cancel_order_intent(last_text):
            order = self._find_referenced_order(last_text)
            if order:
                updated = order_service.cancel_order(order["id"])
                actions.append({"type": "cancelOrder", "order": updated})
                return {
                    "text": f"Mình đã hủy đơn {updated['id']} cho bạn.",
                    "actions": actions,
                }
            return {
                "text": "Mình cần mã đơn HV-xxxx để hủy đơn giúp bạn.",
                "actions": [],
            }

        if self._is_pay_order_intent(last_text):
            order = self._find_referenced_order(last_text)
            if order:
                if order["trackingStatus"] == "cancelled":
                    return {
                        "text": f"Đơn {order['id']} đã bị hủy nên chưa thể thanh toán. Bạn vui lòng tạo đơn mới giúp mình.",
                        "actions": [],
                    }
                updated = order_service.pay_order(order["id"], self._detect_payment_method(last_text))
                actions.append({"type": "payOrder", "order": updated})
                return {
                    "text": (
                        f"Mình đã ghi nhận thanh toán cho đơn {updated['id']} bằng {updated['paymentMethod']}. "
                        "Quán sẽ chuẩn bị đơn ngay cho bạn."
                    ),
                    "actions": actions,
                }
            return {
                "text": "Mình cần mã đơn HV-xxxx để thanh toán giúp bạn. Ví dụ: thanh toán đơn HV-1234 bằng MoMo.",
                "actions": [],
            }

        if self._is_place_order_intent(last_text):
            matched_dishes = self._match_dishes_from_text(last_text)
            if matched_dishes:
                quantity = extract_quantity(last_text)
                items = [{"dishId": dish["id"], "quantity": quantity} for dish in matched_dishes]
                order = await order_service.create_order(
                    {
                        "items": items,
                        "customerName": context.get("customerName") or "Khach tu chat",
                        "phoneNumber": context.get("phoneNumber") or "0900000000",
                        "address": context.get("address") or "Ha Noi",
                        "deliveryType": context.get("deliveryType") or "delivery",
                        "paymentMethod": context.get("paymentMethod") or "cash",
                        "customerEmail": context.get("customerEmail") or "",
                    }
                )
                actions.append({"type": "placeOrder", "order": order})
                dish_names = ", ".join(item["name"] for item in order["items"])
                return {
                    "text": (
                        f"Mình đã tạo đơn tạm mã {order['id']} cho món {dish_names}. "
                        "Bạn có thể nhắn ngay trong chat để thanh toán, theo dõi đơn hoặc cập nhật thông tin giao nhận tiếp."
                    ),
                    "actions": actions,
                }
            return {
                "text": "Mình hiểu bạn muốn đặt món nhưng chưa xác định được món nào trong menu. Bạn nhắn lại tên món giúp mình nhé.",
                "actions": [],
            }

        return None

    def _is_place_order_intent(self, text: str) -> bool:
        keywords = ["dat mon", "goi mon", "mua mon", "cho toi", "lay cho toi", "order"]
        return any(keyword in text for keyword in keywords)

    def _is_order_status_intent(self, text: str) -> bool:
        keywords = ["don hang", "ma don", "trang thai don", "kiem tra don", "tra cuu don"]
        return any(keyword in text for keyword in keywords)

    def _is_cancel_order_intent(self, text: str) -> bool:
        keywords = ["huy don", "bo don", "khong lay don"]
        return any(keyword in text for keyword in keywords)

    def _is_pay_order_intent(self, text: str) -> bool:
        keywords = ["thanh toan", "tra tien", "chuyen khoan", "quet ma", "momo", "zalopay", "da thanh toan"]
        return any(keyword in text for keyword in keywords)

    def _detect_payment_method(self, text: str) -> str:
        if "zalo" in text:
            return "zalopay"
        if "momo" in text:
            return "momo"
        if "tien mat" in text or "cash" in text:
            return "cash"
        return "cash"

    def _match_dishes_from_text(self, normalized_text: str) -> list[dict]:
        matches: list[dict] = []
        for dish in store.dishes:
            dish_name = normalize_text(dish["name"])
            tokens = [token for token in dish_name.split() if len(token) >= 3]
            if dish_name in normalized_text or all(token in normalized_text for token in tokens[:2]):
                matches.append(dish)
                continue
            if sum(token in normalized_text for token in tokens) >= max(1, min(2, len(tokens))):
                matches.append(dish)

        unique_matches: list[dict] = []
        seen_ids: set[str] = set()
        for dish in matches:
            if dish["id"] not in seen_ids:
                seen_ids.add(dish["id"])
                unique_matches.append(dish)
        return unique_matches

    def _detect_dish_names(self, normalized_text: str) -> list[str]:
        return [dish["name"] for dish in self._match_dishes_from_text(normalized_text)]

    def _find_referenced_order(self, normalized_text: str) -> dict | None:
        match = re.search(r"\bhv[-\s]?[a-z0-9]+\b", normalized_text, re.IGNORECASE)
        if match:
            raw = match.group(0).upper().replace(" ", "")
            target = raw.replace("HV", "HV-") if "-" not in raw else raw
            target = target.replace("HV--", "HV-")
            for order in store.orders:
                if order["id"].upper() == target:
                    return order

        if store.orders:
            return store.orders[-1]
        return None

    def _format_order_status(self, order: dict) -> str:
        return (
            f"Đơn {order['id']} hiện ở trạng thái {order['trackingStatus']}, "
            f"thanh toán {order['paymentStatus']}, tổng tiền {order['total']}đ."
        )

    async def _fallback_reply(self, messages: list[dict[str, Any]]) -> dict[str, Any]:
        menu_lines = ", ".join(dish["name"] for dish in store.dishes[:6])
        return {
            "text": (
                f"Hương Việt hiện có các món nổi bật: {menu_lines}. "
                "Bạn muốn mình gợi ý món, đặt món, thanh toán đơn hay đặt bàn ngay trong chat?"
            ),
            "actions": [],
        }


restaurant_agent = LangChainRestaurantAgent()
