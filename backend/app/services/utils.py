from datetime import datetime


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def normalize_phone(phone_number: str) -> str:
    phone = "".join(phone_number.split())
    if phone.startswith("0"):
        return "+84" + phone[1:]
    if phone and not phone.startswith("+"):
        return "+" + phone
    return phone

