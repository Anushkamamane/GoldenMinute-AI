"""
GoldenMinute AI – Call Logger
Stores all call events, interactions, and outcomes in Firebase Realtime DB.

Data paths:
  /call_logs/{call_sid}            -> call metadata
  /call_logs/{call_sid}/interactions -> array of interaction records
"""

import logging
from datetime import datetime, timezone
from .firebase_config import get_db  # <-- fixed relative import

logger = logging.getLogger(__name__)


class CallLogger:
    ROOT = "call_logs"

    def log_call_start(self, call_sid: str, caller_number: str):
        try:
            db = get_db()
            db.set(f"{self.ROOT}/{call_sid}", {
                "call_sid":   call_sid,
                "caller":     caller_number,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "status":     "in_progress",
            })
        except Exception as e:
            logger.error(f"log_call_start error: {e}")

    def log_interaction(self, call_sid: str, speech: str, emergency: dict, volunteer: dict | None):
        try:
            db = get_db()
            # Push interaction as a child of the call
            db.push(f"{self.ROOT}/{call_sid}/interactions", {
                "timestamp":      datetime.now(timezone.utc).isoformat(),
                "speech":         speech,
                "emergency_type": emergency.get("type"),
                "severity":       emergency.get("severity"),
                "language":       emergency.get("language"),
                "volunteer_name": volunteer.get("name") if volunteer else None,
                "volunteer_dist": volunteer.get("distance_km") if volunteer else None,
            })
            # Also update the top-level last_emergency field
            db.update(f"{self.ROOT}/{call_sid}", {
                "last_emergency": emergency.get("type"),
            })
        except Exception as e:
            logger.error(f"log_interaction error: {e}")

    def log_call_end(self, call_sid: str, status: str, duration: str):
        try:
            db = get_db()
            db.update(f"{self.ROOT}/{call_sid}", {
                "ended_at":   datetime.now(timezone.utc).isoformat(),
                "status":     status,
                "duration_s": int(duration),
            })
        except Exception as e:
            logger.error(f"log_call_end error: {e}")

    def get_recent_calls(self, limit: int = 20) -> list:
        """
        Fetch call logs from Firebase, sorted by started_at descending.
        Firebase REST doesn't support server-side ordering without indexes,
        so we sort client-side after fetching.
        """
        try:
            db   = get_db()
            data = db.get(self.ROOT)
            if not data or not isinstance(data, dict):
                return []

            logs = [{"id": k, **v} for k, v in data.items() if isinstance(v, dict)]
            logs.sort(key=lambda x: x.get("started_at", ""), reverse=True)
            return logs[:limit]

        except Exception as e:
            logger.error(f"get_recent_calls error: {e}")
            return []