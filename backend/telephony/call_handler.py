"""
GoldenMinute AI – Call Handler (no Twilio)
Placeholder kept for compatibility. Core logic is now in server.py /api/emergency.
"""


class CallHandler:
    def initiate_greeting(self) -> dict:
        """Returns a greeting payload (used by non-Twilio IVR integrations)."""
        return {
            "message_hi": "Namaste. Aap ne GoldenMinute AI ko call kiya hai. Kripya apni emergency batayein.",
            "message_en": "Hello, you have reached GoldenMinute AI. Please describe your emergency.",
            "action":     "/api/emergency",
            "method":     "POST",
        }
