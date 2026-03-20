"""
GoldenMinute AI – Webhook Handler (no Twilio)
Simple request data extractor for incoming POST payloads.
"""

import logging
from flask import request

logger = logging.getLogger(__name__)


class WebhookHandler:
    def validate(self) -> bool:
        """
        No external signature to validate (not using Twilio).
        Add your own HMAC or API-key check here if needed.
        """
        return True

    def extract_call_data(self) -> dict:
        """Extract fields from JSON or form POST body."""
        data = request.get_json(silent=True) or request.form.to_dict()
        return {
            "call_sid":   data.get("call_sid", ""),
            "caller":     data.get("caller", ""),
            "city":       data.get("city", "unknown"),
            "speech":     data.get("speech", ""),
            "confidence": data.get("confidence", "1.0"),
        }
