from __future__ import annotations

import random
from datetime import datetime, timedelta
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.repositories.store import store
from app.services.email_service import email_service
from app.services.utils import normalize_phone


class AuthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def send_otp(self, phone_number: str) -> dict:
        phone = normalize_phone(phone_number)
        otp = f"{random.randint(100000, 999999)}"
        store.phone_otps[phone] = {
            "otp": otp,
            "expiresAt": datetime.utcnow() + timedelta(minutes=5),
        }
        return {
            "success": True,
            "message": "OTP da duoc tao o che do mo phong.",
            "simulatedCode": otp,
            "phoneNumber": phone,
        }

    def verify_otp(self, phone_number: str, otp: str) -> dict:
        phone = normalize_phone(phone_number)
        record = store.phone_otps.get(phone)
        if not record:
            raise ValueError("Khong tim thay OTP hoac OTP da het han")
        if datetime.utcnow() > record["expiresAt"]:
            store.phone_otps.pop(phone, None)
            raise ValueError("OTP da het han")
        if record["otp"] != otp.strip():
            raise ValueError("OTP khong chinh xac")
        store.phone_otps.pop(phone, None)
        return {"success": True, "message": "So dien thoai da duoc xac thuc thanh cong!"}

    async def register(self, payload: dict) -> dict:
        username = payload["username"].strip().lower()
        if store.find_user(username):
            raise ValueError("Ten dang nhap da ton tai")
        avatar = "".join(part[0] for part in payload["fullName"].split() if part)[:2].upper() or "US"
        user = {
            "username": username,
            "password": payload["password"],
            "fullName": payload["fullName"],
            "phoneNumber": payload["phoneNumber"],
            "address": payload.get("address", ""),
            "role": payload["role"],
            "avatar": avatar,
            "provider": "local",
            "email": username if "@" in username else "",
        }
        store.users.append(user)
        if user["email"]:
            await email_service.send_email(
                user["email"],
                "[Huong Viet] Chao mung thanh vien moi",
                f"<p>Chao mung {user['fullName']} den voi Huong Viet AI.</p>",
            )
        safe_user = {key: value for key, value in user.items() if key != "password"}
        return {"success": True, "user": safe_user}

    async def login(self, username: str, password: str) -> dict:
        normalized = username.strip().lower()
        user = store.find_user(normalized)
        if not user or user["password"] != password:
            raise ValueError("Ten dang nhap hoac mat khau khong chinh xac")
        if user.get("email"):
            await email_service.send_email(
                user["email"],
                "[Huong Viet] Dang nhap thanh cong",
                f"<p>Tai khoan {user['username']} vua dang nhap thanh cong.</p>",
        )
        safe_user = {key: value for key, value in user.items() if key != "password"}
        return {"success": True, "user": safe_user}

    async def login_with_facebook(self, access_token: str) -> dict:
        token = access_token.strip()
        if not token:
            raise ValueError("Thieu access token Facebook")
        if not self.settings.facebook_client_id:
            raise ValueError("He thong chua cau hinh FACEBOOK_CLIENT_ID")

        async with httpx.AsyncClient(timeout=15.0) as client:
            if self.settings.facebook_client_secret:
                debug_response = await client.get(
                    "https://graph.facebook.com/debug_token",
                    params={
                        "input_token": token,
                        "access_token": f"{self.settings.facebook_client_id}|{self.settings.facebook_client_secret}",
                    },
                )
                debug_payload = debug_response.json()
                debug_data = debug_payload.get("data", {}) if isinstance(debug_payload, dict) else {}
                if not debug_response.is_success or not debug_data.get("is_valid"):
                    raise ValueError("Token Facebook khong hop le hoac da het han")
                app_id = str(debug_data.get("app_id") or "")
                if app_id and app_id != self.settings.facebook_client_id:
                    raise ValueError("Token Facebook khong thuoc ung dung dang cau hinh")

            profile_response = await client.get(
                "https://graph.facebook.com/me",
                params={
                    "fields": "id,name,email,picture.type(large)",
                    "access_token": token,
                },
            )
            profile_payload = profile_response.json()
            if not profile_response.is_success or "error" in profile_payload:
                error_message = "Khong lay duoc thong tin tai khoan Facebook"
                if isinstance(profile_payload, dict):
                    error_info = profile_payload.get("error")
                    if isinstance(error_info, dict):
                        error_message = error_info.get("message") or error_message
                raise ValueError(error_message)

        facebook_id = str(profile_payload.get("id") or "").strip()
        full_name = str(profile_payload.get("name") or "Khach Facebook").strip()
        email = str(profile_payload.get("email") or f"facebook_{facebook_id}@facebook.local").strip().lower()
        avatar = (
            profile_payload.get("picture", {})
            .get("data", {})
            .get("url", "")
            if isinstance(profile_payload, dict)
            else ""
        )

        user = store.find_user(email)
        if not user:
            user = next(
                (
                    existing_user
                    for existing_user in store.users
                    if existing_user.get("provider") == "facebook" and existing_user.get("socialId") == facebook_id
                ),
                None,
            )

        if user:
            user.update(
                {
                    "fullName": full_name,
                    "provider": "facebook",
                    "email": email,
                    "avatar": avatar or user.get("avatar", "FB"),
                    "socialId": facebook_id,
                }
            )
        else:
            user = {
                "username": email,
                "password": f"facebook-oauth-{uuid4().hex}",
                "fullName": full_name,
                "phoneNumber": "",
                "address": "",
                "role": "customer",
                "avatar": avatar or "FB",
                "provider": "facebook",
                "email": email,
                "socialId": facebook_id,
            }
            store.users.append(user)

        safe_user = {key: value for key, value in user.items() if key != "password"}
        return {"success": True, "user": safe_user}


auth_service = AuthService()
