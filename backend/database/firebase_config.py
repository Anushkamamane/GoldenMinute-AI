"""
GoldenMinute AI – Firebase Configuration
Uses Firebase Realtime Database via REST API (no service account needed —
the Web SDK config keys from your .env are sufficient).

Your Firebase project uses Realtime Database (asia-southeast1), not Firestore,
so we call the REST API directly with the database URL from .env.
"""

import os
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Read from environment
_DATABASE_URL = os.environ.get(
    "FIREBASE_DATABASE_URL",
    "https://goldenminute-7e47e-default-rtdb.asia-southeast1.firebasedatabase.app"
)
_API_KEY = os.environ.get("FIREBASE_API_KEY", "")


class RealtimeDB:
    """
    Thin wrapper around Firebase Realtime Database REST API.
    No service account JSON required — uses the web API key.
    For read/write rules: set your DB rules to allow authenticated or open access during dev.
    """

    def __init__(self):
        self.base = _DATABASE_URL.rstrip("/")

    def get(self, path: str) -> dict | list | None:
        """GET /path.json"""
        try:
            resp = requests.get(f"{self.base}/{path}.json", timeout=8)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Firebase GET {path} failed: {e}")
            return None

    def set(self, path: str, data: dict) -> bool:
        """PUT /path.json — overwrites node"""
        try:
            resp = requests.put(
                f"{self.base}/{path}.json",
                json=data,
                timeout=8,
            )
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Firebase SET {path} failed: {e}")
            return False

    def push(self, path: str, data: dict) -> str | None:
        """POST /path.json — pushes new child, returns generated key"""
        try:
            resp = requests.post(
                f"{self.base}/{path}.json",
                json=data,
                timeout=8,
            )
            resp.raise_for_status()
            return resp.json().get("name")  # Firebase-generated key
        except Exception as e:
            logger.error(f"Firebase PUSH {path} failed: {e}")
            return None

    def update(self, path: str, data: dict) -> bool:
        """PATCH /path.json — merges partial update"""
        try:
            resp = requests.patch(
                f"{self.base}/{path}.json",
                json=data,
                timeout=8,
            )
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Firebase PATCH {path} failed: {e}")
            return False

    def delete(self, path: str) -> bool:
        """DELETE /path.json"""
        try:
            resp = requests.delete(f"{self.base}/{path}.json", timeout=8)
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Firebase DELETE {path} failed: {e}")
            return False


# Singleton instance used across the app
_db_instance: RealtimeDB | None = None


def get_db() -> RealtimeDB:
    global _db_instance
    if _db_instance is None:
        _db_instance = RealtimeDB()
        logger.info(f"Firebase Realtime DB ready: {_DATABASE_URL}")
    return _db_instance