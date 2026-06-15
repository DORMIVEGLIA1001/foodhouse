from __future__ import annotations

from datetime import datetime

import httpx

from app.core.config import get_settings
from app.repositories.store import store


class EmailService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def send_email(self, to: str, subject: str, html: str) -> dict:
        entry = {
            "id": f"email-{len(store.email_logs) + 1}",
            "to": to.strip(),
            "subject": subject,
            "html": html,
            "createdAt": datetime.utcnow().isoformat(),
            "success": True,
            "provider": "simulation",
        }

        if self.settings.resend_api_key:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {self.settings.resend_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "from": f"Huong Viet AI <{self.settings.resend_from_email}>",
                            "to": [to.strip()],
                            "subject": subject,
                            "html": html,
                        },
                    )
                    data = response.json()
                    entry["provider"] = "resend"
                    entry["response"] = data
                    entry["success"] = response.is_success
                    if not response.is_success and isinstance(data, dict):
                        entry["error"] = data.get("message") or data.get("name") or "Resend request failed"
            except Exception as exc:
                entry["success"] = False
                entry["error"] = str(exc)

        store.email_logs.insert(0, entry)
        return entry

    def history(self) -> list[dict]:
        return store.email_logs


email_service = EmailService()
