"""
GoldenMinute AI – Volunteer Lookup
Finds ALL available volunteers within radius using Firebase Realtime DB + Haversine.
"""

import math
import logging
from typing import Optional
from database.firebase_config import get_db

logger = logging.getLogger(__name__)

CITY_COORDS = {
    "agra":      (27.1767, 78.0081),
    "delhi":     (28.6139, 77.2090),
    "jaipur":    (26.9124, 75.7873),
    "mumbai":    (19.0760, 72.8777),
    "pune":      (18.5204, 73.8567),
    "lucknow":   (26.8467, 80.9462),
    "varanasi":  (25.3176, 82.9739),
    "nagpur":    (21.1458, 79.0882),
    "unknown":   (20.5937, 78.9629),
}


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class VolunteerLookup:
    MAX_RADIUS_KM = 5.0

    def find_nearest(self, caller_number: str, caller_city: str) -> Optional[dict]:
        """Returns the single nearest volunteer — used for response display."""
        volunteers = self.find_all_nearby(caller_number, caller_city)
        return volunteers[0] if volunteers else None

    def find_all_nearby(self, caller_number: str, caller_city: str) -> list:
        """
        Returns ALL available certified volunteers within MAX_RADIUS_KM,
        sorted by distance. Every one of them will get an SMS alert.
        """
        try:
            db = get_db()
            city_key = caller_city.lower().strip()
            caller_lat, caller_lon = CITY_COORDS.get(city_key, CITY_COORDS["unknown"])

            data = db.get("volunteers")
            if not data or not isinstance(data, dict):
                logger.warning("No volunteers found in Firebase.")
                return []

            nearby = []
            for vol_id, v in data.items():
                if not v.get("available") or not v.get("certified"):
                    continue
                vlat = v.get("lat")
                vlon = v.get("lon")
                if vlat is None or vlon is None:
                    continue

                dist = haversine_km(caller_lat, caller_lon, float(vlat), float(vlon))
                if dist <= self.MAX_RADIUS_KM:
                    nearby.append({**v, "id": vol_id, "distance_km": round(dist, 2)})

            # Sort by distance — closest first
            nearby.sort(key=lambda x: x["distance_km"])

            logger.info(f"Found {len(nearby)} volunteers within {self.MAX_RADIUS_KM}km of {caller_city}")
            for v in nearby:
                logger.info(f"  - {v['name']} ({v['distance_km']} km) {v['phone']}")

            return nearby

        except Exception as e:
            logger.error(f"VolunteerLookup error: {e}")
            return []

    def register_volunteer(self, data: dict) -> str:
        required = {"name", "phone", "lat", "lon"}
        missing  = required - data.keys()
        if missing:
            raise ValueError(f"Missing volunteer fields: {missing}")
        data.setdefault("available", True)
        data.setdefault("certified", True)
        data.setdefault("calls_handled", 0)
        db  = get_db()
        key = db.push("volunteers", data)
        if key:
            logger.info(f"Volunteer registered: {data['name']} | key={key}")
            return key
        raise RuntimeError("Failed to register volunteer in Firebase")

    def mark_unavailable(self, volunteer_id: str):
        db = get_db()
        db.update(f"volunteers/{volunteer_id}", {"available": False})
        logger.info(f"Volunteer {volunteer_id} marked unavailable")