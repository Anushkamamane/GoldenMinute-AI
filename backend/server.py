"""
GoldenMinute AI – Main Backend Server
REST API — alerts ALL nearby volunteers, not just one.
"""

import os
import uuid
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

from ai.emergency_detection import EmergencyDetector
from ai.guidance_generator import GuidanceGenerator
from database.volunteer_lookup import VolunteerLookup
from notifications.send_sms import SMSNotifier
from database.logs import CallLogger

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PATCH,OPTIONS"
    return response

@app.route("/api/<path:p>", methods=["OPTIONS"])
@app.route("/<path:p>",     methods=["OPTIONS"])
def options_handler(p=""):
    return ("", 204)

detector     = EmergencyDetector()
guidance_gen = GuidanceGenerator()
volunteer_db = VolunteerLookup()
sms_notifier = SMSNotifier()
call_logger  = CallLogger()


@app.route("/api/emergency", methods=["POST"])
def handle_emergency():
    data     = request.get_json(silent=True) or request.form.to_dict()
    speech   = data.get("speech", "").strip()
    caller   = data.get("caller", "Unknown")
    city     = data.get("city", "unknown")
    call_sid = data.get("call_sid") or str(uuid.uuid4())

    if not speech:
        return jsonify({"error": "No speech text provided"}), 400

    logger.info(f"Emergency | SID:{call_sid} | caller:{caller} | city:{city}")
    logger.info(f"Speech: {speech}")

    # 1. Log call start
    call_logger.log_call_start(call_sid, caller)

    # 2. Detect emergency type
    emergency = detector.detect(speech)
    logger.info(f"Detected: {emergency}")

    # 3. Generate guidance
    guidance = guidance_gen.generate(
        emergency_type=emergency["type"],
        language=emergency["language"],
        severity=emergency["severity"],
    )

    # 4. Find ALL nearby volunteers
    all_volunteers = volunteer_db.find_all_nearby(caller, city)

    # 5. SMS every volunteer within 5km
    sms_results = []
    for volunteer in all_volunteers:
        sent = sms_notifier.alert_volunteer(
            volunteer=volunteer,
            emergency_type=emergency["type"],
            caller_number=caller,
            location=city,
        )
        sms_results.append({
            "name":        volunteer["name"],
            "phone":       volunteer["phone"],
            "distance_km": volunteer["distance_km"],
            "sms_sent":    sent,
        })
        logger.info(f"SMS {'OK' if sent else 'FAILED'} -> {volunteer['name']} ({volunteer['phone']})")

    # 6. Log interaction
    nearest = all_volunteers[0] if all_volunteers else None
    call_logger.log_interaction(call_sid, speech, emergency, nearest)

    return jsonify({
        "call_sid":       call_sid,
        "emergency":      emergency,
        "guidance":       guidance,
        "volunteers_alerted": len(sms_results),
        "volunteers":     sms_results,
        "sms_sent":       any(r["sms_sent"] for r in sms_results),
    })


@app.route("/api/call/start", methods=["POST"])
def call_start():
    data     = request.get_json(silent=True) or {}
    call_sid = data.get("call_sid", str(uuid.uuid4()))
    caller   = data.get("caller", "Unknown")
    call_logger.log_call_start(call_sid, caller)
    return jsonify({"call_sid": call_sid, "status": "started"})


@app.route("/api/call/end", methods=["POST"])
def call_end():
    data     = request.get_json(silent=True) or {}
    call_sid = data.get("call_sid", "")
    status   = data.get("status", "completed")
    duration = data.get("duration", "0")
    call_logger.log_call_end(call_sid, status, str(duration))
    return jsonify({"call_sid": call_sid, "status": "logged"})


@app.route("/api/stats", methods=["GET"])
def get_stats():
    logs  = call_logger.get_recent_calls(limit=200)
    total = len(logs)
    saved = sum(1 for l in logs if l.get("last_emergency"))
    avail = 0
    try:
        from database.firebase_config import get_db
        vols  = get_db().get("volunteers") or {}
        avail = sum(1 for v in vols.values() if isinstance(v, dict) and v.get("available"))
    except Exception:
        pass
    return jsonify({"total": total, "saved": saved, "volunteers": avail, "avgResponse": 3.8})


@app.route("/api/logs", methods=["GET"])
def get_logs():
    limit = int(request.args.get("limit", 50))
    return jsonify(call_logger.get_recent_calls(limit=limit))


@app.route("/api/volunteers", methods=["GET"])
def get_volunteers():
    try:
        from database.firebase_config import get_db
        data = get_db().get("volunteers") or {}
        vols = [{"id": k, **v} for k, v in data.items() if isinstance(v, dict)]
        return jsonify(vols)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/volunteers", methods=["POST"])
def add_volunteer():
    data = request.get_json(silent=True) or {}
    try:
        key = volunteer_db.register_volunteer(data)
        return jsonify({"id": key, "status": "registered"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/volunteers/<vol_id>/availability", methods=["PATCH"])
def update_availability(vol_id):
    data      = request.get_json(silent=True) or {}
    available = data.get("available", True)
    try:
        from database.firebase_config import get_db
        get_db().update(f"volunteers/{vol_id}", {"available": available})
        return jsonify({"status": "updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "GoldenMinute AI", "version": "2.0"})




@app.route("/", methods=["GET"])
def index():
    return """<!DOCTYPE html>
<html>
<head>
  <title>GoldenMinute AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #0b0e14; color: #eee; padding: 1.5rem; }
    h2 { color: #e63946; margin-bottom: 1.5rem; }
    label { font-size: 13px; color: #aaa; display: block; margin-bottom: 4px; margin-top: 12px; }
    textarea, input { width: 100%; padding: 10px; background: #161c2a; color: #eee; border: 1px solid #333; border-radius: 8px; font-size: 14px; }
    textarea { height: 80px; }
    button { width: 100%; margin-top: 16px; background: #e63946; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .result { margin-top: 16px; background: #0f2418; border-left: 3px solid #2dc653; padding: 1rem; border-radius: 8px; display: none; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e63946; color: white; margin-bottom: 8px; }
    .vol { margin-top: 10px; padding: 10px; background: #161c2a; border-radius: 8px; font-size: 13px; color: #aaa; }
    .error { background: #2a0f0f; border-left: 3px solid #e63946; padding: 1rem; border-radius: 8px; margin-top: 16px; color: #f99; font-size: 13px; display: none; }
    .loading { text-align: center; padding: 1rem; color: #aaa; display: none; }
  </style>
</head>
<body>
  <h2>🚨 GoldenMinute AI</h2>
  <label>Emergency (Hindi / English / Marathi)</label>
  <textarea id="speech" placeholder="mere papa ko chest mein dard ho raha hai..."></textarea>
  <label>City</label>
  <input id="city" value="pune" />
  <label>Your Phone Number</label>
  <input id="caller" placeholder="+919876543210" />
  <button onclick="send()">🚨 Send Emergency</button>
  <div class="loading" id="loading">⏳ Contacting AI...</div>
  <div class="result" id="result">
    <span class="badge" id="etype"></span>
    <h3 style="color:#2dc653;margin:8px 0">First Aid Guidance</h3>
    <p id="guidance" style="font-size:14px;line-height:1.7;color:#ccc;white-space:pre-line"></p>
    <div class="vol" id="vol"></div>
  </div>
  <div class="error" id="error"></div>
  <script>
    async function send() {
      const speech = document.getElementById('speech').value.trim();
      if (!speech) { alert('Please describe the emergency'); return; }
      document.getElementById('loading').style.display = 'block';
      document.getElementById('result').style.display = 'none';
      document.getElementById('error').style.display = 'none';
      try {
        const res = await fetch('/api/emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speech: speech,
            caller: document.getElementById('caller').value || 'unknown',
            city:   document.getElementById('city').value
          })
        });
        const data = await res.json();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('etype').textContent = data.emergency.type.replace(/_/g,' ').toUpperCase() + ' — ' + data.emergency.severity.toUpperCase();
        document.getElementById('guidance').textContent = data.guidance;
        document.getElementById('vol').innerHTML = data.volunteers && data.volunteers.length
          ? '🧑 ' + data.volunteers.map(v => '<b style=color:#2dc653>' + v.name + '</b> is ' + v.distance_km + ' km away — SMS ' + (v.sms_sent ? '✅ Sent' : '❌ Failed')).join('<br>🧑 ')
          : '⚠️ No volunteer found nearby. Please call 108 immediately.';
        document.getElementById('result').style.display = 'block';
      } catch(e) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').textContent = 'Error: ' + e.message;
        document.getElementById('error').style.display = 'block';
      }
    }
  </script>
</body>
</html>"""

if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    logger.info(f"GoldenMinute AI starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)