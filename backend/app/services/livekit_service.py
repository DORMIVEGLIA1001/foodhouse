import base64
import hashlib
import hmac
import json
import time

from app.core.config import get_settings


class LivekitService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def issue_token(self, room_name: str, identity: str) -> dict:
        if not (self.settings.livekit_url and self.settings.livekit_api_key and self.settings.livekit_api_secret):
            raise ValueError("LIVEKIT_URL, LIVEKIT_API_KEY hoac LIVEKIT_API_SECRET chua duoc cau hinh")
        token = self._sign_livekit_jwt(room_name.strip(), identity.strip())
        return {"success": True, "token": token, "url": self.settings.livekit_url}

    def _sign_livekit_jwt(self, room_name: str, identity: str) -> str:
        now = int(time.time())
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "iss": self.settings.livekit_api_key,
            "sub": identity,
            "nbf": now,
            "exp": now + 600,
            "video": {
                "roomJoin": True,
                "room": room_name,
                "canPublish": True,
                "canSubscribe": True,
                "canPublishData": True,
            },
        }
        encoded_header = self._b64url(json.dumps(header, separators=(",", ":")).encode())
        encoded_payload = self._b64url(json.dumps(payload, separators=(",", ":")).encode())
        signing_input = f"{encoded_header}.{encoded_payload}".encode()
        signature = hmac.new(
            self.settings.livekit_api_secret.encode(),
            signing_input,
            hashlib.sha256,
        ).digest()
        encoded_signature = self._b64url(signature)
        return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

    def _b64url(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


livekit_service = LivekitService()
