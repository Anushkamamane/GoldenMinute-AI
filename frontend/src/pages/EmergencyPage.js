import { useState, useEffect } from "react";
import styles from "./EmergencyPage.module.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function EmergencyPage({ onBack }) {
  const [speech,    setSpeech]    = useState("");
  const [city,      setCity]      = useState("pune");
  const [caller,    setCaller]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");
  const [locMode,   setLocMode]   = useState("current");
  const [locStatus, setLocStatus] = useState("Detecting your location...");
  const [gpsCoords, setGpsCoords] = useState({ lat: null, lon: null });

  const getLocation = () => {
    setLocStatus("Detecting your location...");
    if (!navigator.geolocation) {
      setLocStatus("GPS not supported. Use city mode.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        setGpsCoords({ lat, lon });
        setLocStatus(`Lat ${lat}, Lon ${lon}`);
      },
      () => setLocStatus("GPS denied. Use city mode below."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  const sendEmergency = async () => {
    if (!speech.trim()) { setError("Please describe the emergency."); return; }
    if (locMode === "manual" && !city.trim()) { setError("Please enter your city."); return; }
    setLoading(true); setResult(null); setError("");

    const payload = {
      speech,
      caller: caller || "unknown",
      city:   locMode === "manual" ? city : "unknown",
    };
    if (locMode === "current" && gpsCoords.lat) {
      payload.lat = gpsCoords.lat;
      payload.lon = gpsCoords.lon;
    }

    try {
      const res  = await fetch(`${API}/api/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Cannot reach server. Make sure backend is running.");
    }
    setLoading(false);
  };

  const getSeverityColor = s => ({
    critical: "#e63946", high: "#f4a261", medium: "#f9c74f", low: "#2dc653"
  }[s] || "#e63946");

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <div className={styles.headerTitle}>🚨 Emergency Help</div>
      </div>

      <div className={styles.content}>
        <div className={styles.heroCard}>
          <div className={styles.heroIcon}>🫀</div>
          <div className={styles.heroText}>
            <div className={styles.heroTitle}>GoldenMinute AI</div>
            <div className={styles.heroSub}>Describe your emergency in Hindi, English or Marathi</div>
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.field}>
            <label>Describe the Emergency *</label>
            <textarea
              placeholder="mere papa ko chest mein dard ho raha hai... / chest pain, not breathing..."
              value={speech}
              onChange={e => { setSpeech(e.target.value); setError(""); }}
              rows={4}
            />
          </div>

          <div className={styles.locationCard}>
            <label>Location Mode</label>
            <div className={styles.radioRow}>
              <label className={styles.radioLabel}>
                <input type="radio" value="current" checked={locMode === "current"} onChange={() => setLocMode("current")} />
                Use Current Location (GPS)
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="manual" checked={locMode === "manual"} onChange={() => setLocMode("manual")} />
                Enter City Manually
              </label>
            </div>

            {locMode === "current" && (
              <div className={styles.field} style={{ marginTop: "8px" }}>
                <label>Detected Location</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input value={locStatus} readOnly style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", color: "var(--muted)", fontSize: "13px" }} />
                  <button className={styles.locBtn} onClick={getLocation}>📍 Refresh</button>
                </div>
              </div>
            )}

            {locMode === "manual" && (
              <div className={styles.field} style={{ marginTop: "8px" }}>
                <label>City</label>
                <select value={city} onChange={e => setCity(e.target.value)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", color: "var(--text)", fontSize: "14px" }}>
                  <option>pune</option>
                  <option>mumbai</option>
                  <option>delhi</option>
                  <option>nagpur</option>
                  <option>agra</option>
                  <option>jaipur</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Your Phone (optional)</label>
            <input placeholder="+919876543210" value={caller} onChange={e => setCaller(e.target.value)} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.sendBtn} onClick={sendEmergency} disabled={loading}>
            {loading ? "⏳ Contacting AI..." : "🚨 Send Emergency Alert"}
          </button>

          <div className={styles.callNote}>OR call <strong>108</strong> for ambulance immediately</div>
        </div>

        {result && (
          <div className={styles.resultCard}>
            <div className={styles.emergencyBadge} style={{ background: getSeverityColor(result.emergency?.severity) + "22", color: getSeverityColor(result.emergency?.severity) }}>
              {(result.emergency?.type || "").replace(/_/g, " ").toUpperCase()} — {(result.emergency?.severity || "").toUpperCase()}
            </div>
            <div className={styles.guidanceSection}>
              <div className={styles.guidanceTitle}>First Aid Guidance</div>
              <div className={styles.guidanceText}>{result.guidance}</div>
            </div>
            {result.volunteers && result.volunteers.length > 0 ? (
              <div className={styles.volunteerSection}>
                <div className={styles.volunteerTitle}>Volunteers Alerted</div>
                {result.volunteers.map((v, i) => (
                  <div key={i} className={styles.volunteerRow}>
                    <div className={styles.volAvatar}>{v.name?.[0]}</div>
                    <div className={styles.volInfo}>
                      <div className={styles.volName}>{v.name}</div>
                      <div className={styles.volDist}>{v.distance_km} km away</div>
                    </div>
                    <div className={styles.volStatus} style={{ color: v.sms_sent ? "#2dc653" : "#e63946" }}>
                      {v.sms_sent ? "✓ Alerted" : "✗ Failed"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noVol}>⚠️ No volunteers nearby. Call 108 immediately.</div>
            )}
            <button className={styles.sendBtn} onClick={() => { setResult(null); setSpeech(""); }} style={{ marginTop: "1rem", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
              Send Another Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}