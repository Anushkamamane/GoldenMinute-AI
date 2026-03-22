import { useState } from "react";
import styles from "./EmergencyPage.module.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function EmergencyPage({ onBack }) {
  const [speech,   setSpeech]   = useState("");
  const [city,     setCity]     = useState("pune");
  const [caller,   setCaller]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");

  const sendEmergency = async () => {
    if (!speech.trim()) { setError("Please describe the emergency."); return; }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch(`${API}/api/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speech, caller: caller || "unknown", city }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Cannot reach server. Make sure backend is running.");
    }
    setLoading(false);
  };

  const getSeverityColor = (s) => ({
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
              placeholder="mere papa ko chest mein dard ho raha hai... / chest pain, not breathing... / khuneecha swas ghene aahe..."
              value={speech}
              onChange={e => { setSpeech(e.target.value); setError(""); }}
              rows={4}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>City</label>
              <select value={city} onChange={e => setCity(e.target.value)}>
                <option>pune</option>
                <option>mumbai</option>
                <option>delhi</option>
                <option>nagpur</option>
                <option>agra</option>
                <option>jaipur</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Your Phone (optional)</label>
              <input
                placeholder="+919876543210"
                value={caller}
                onChange={e => setCaller(e.target.value)}
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.sendBtn}
            onClick={sendEmergency}
            disabled={loading}
          >
            {loading ? "⏳ Contacting AI..." : "🚨 Send Emergency Alert"}
          </button>

          <div className={styles.callNote}>
            OR call <strong>108</strong> for ambulance immediately
          </div>
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
              <div className={styles.noVol}>
                ⚠️ No volunteers found nearby. Please call 108 immediately.
              </div>
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