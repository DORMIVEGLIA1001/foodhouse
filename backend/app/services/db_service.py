from __future__ import annotations

from urllib.parse import quote, urlparse

import asyncpg

from app.core.config import get_settings


class DatabaseService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def check(self) -> dict:
        db_url = self.settings.database_url or self.settings.direct_url
        if not db_url:
            return {
                "success": False,
                "message": "Chua cau hinh DATABASE_URL hoac DIRECT_URL.",
            }

        parsed = urlparse(db_url)
        masked_url = f"{parsed.scheme}://{parsed.username or 'user'}:***@{parsed.hostname or 'host'}:{parsed.port or 5432}{parsed.path}"
        try:
            conn = await asyncpg.connect(dsn=self._repair_dsn(db_url), timeout=5)
            version = await conn.fetchval("select version();")
            now_time = await conn.fetchval("select now();")
            await conn.close()
            return {
                "success": True,
                "message": "Ket noi co so du lieu thanh cong.",
                "maskedUrl": masked_url,
                "dbVersion": version,
                "now": str(now_time),
            }
        except Exception as exc:
            return {
                "success": False,
                "message": "Khong the ket noi co so du lieu.",
                "maskedUrl": masked_url,
                "error": str(exc),
            }

    def _repair_dsn(self, db_url: str) -> str:
        parsed = urlparse(db_url)
        if parsed.username and parsed.password and parsed.hostname:
            safe_password = quote(parsed.password, safe="")
            auth = f"{parsed.username}:{safe_password}"
            host = parsed.hostname
            if parsed.port:
                host = f"{host}:{parsed.port}"
            query = f"?{parsed.query}" if parsed.query else ""
            return f"{parsed.scheme}://{auth}@{host}{parsed.path}{query}"

        scheme_sep = "://"
        if scheme_sep not in db_url:
            return db_url

        scheme, remainder = db_url.split(scheme_sep, 1)
        if "@" not in remainder or ":" not in remainder:
            return db_url

        userinfo, hostpart = remainder.rsplit("@", 1)
        if ":" not in userinfo:
            return db_url

        username, raw_password = userinfo.split(":", 1)
        safe_password = quote(raw_password, safe="")
        return f"{scheme}{scheme_sep}{username}:{safe_password}@{hostpart}"


db_service = DatabaseService()
