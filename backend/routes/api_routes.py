"""
GoldenMinute AI – Dashboard API Routes
These endpoints serve the React frontend with stats, logs, and volunteer data.
Add these routes to server.py or import this blueprint.
"""

from flask import Blueprint, jsonify, request
from backend.database.logs import CallLogger
from backend.database.volunteer_lookup import VolunteerLookup

api_bp = Blueprint("api", __name__, url_prefix="/api")
logger_svc   = CallLogger()
vol_svc      = VolunteerLookup()


@api_bp.route("/stats", methods=["GET"])
def get_stats():
    """Return summary stats for the dashboard."""
    try:
        logs = logger_svc.get_recent_calls(limit=200)
        total  = len(logs)
        saved  = sum(1 for l in logs if l.get("volunteer_name"))
        return jsonify({
            "total":       total,
            "saved":       saved,
            "volunteers":  4,
            "avgResponse": 3.8,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/logs", methods=["GET"])
def get_logs():
    """Return recent call logs."""
    limit = int(request.args.get("limit", 50))
    try:
        logs = logger_svc.get_recent_calls(limit=limit)
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/volunteers", methods=["GET"])
def get_volunteers():
    """Return all volunteers from Firestore."""
    try:
        from backend.database.firebase_config import get_db
        db   = get_db()
        docs = db.collection("volunteers").stream()
        vols = [{"id": d.id, **d.to_dict()} for d in docs]
        return jsonify(vols)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/volunteers", methods=["POST"])
def add_volunteer():
    """Register a new volunteer."""
    data = request.get_json()
    try:
        doc_id = vol_svc.register_volunteer(data)
        return jsonify({"id": doc_id, "status": "registered"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/volunteers/<vol_id>/availability", methods=["PATCH"])
def update_availability(vol_id):
    data      = request.get_json()
    available = data.get("available", True)
    try:
        from backend.database.firebase_config import get_db
        get_db().collection("volunteers").document(vol_id).update({"available": available})
        return jsonify({"status": "updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
