import { useState, useEffect, useRef } from "react";
import styles from "./VolunteerPortal.module.css";

const API = "http://localhost:5000";

export default function VolunteerPortal({ onLogout }) {
  const [tab, setTab]             = useState("login");
  const [volunteer, setVolunteer] = useState(null);
  const [alerts, setAlerts]       = useState([]);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginError, setLoginError] = useState("");
  const [status, setStatus]       = useState("");
  const [locating, setLocating]   = useState(false);
  const [form, setForm]           = useState({
    name: "", phone: "", email: "", area: "", city: "pune",
    address: "", lat: "", lon: "", certified: false,
  });
  const pollRef = useRef(null);

  // Auto-detect location
  const detectLocation = () => {
    setLocating(true);
    setStatus("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        setStatus("Location detected!");
        setTimeout(() => setStatus(""), 2000);
      },
      () => {
        setLocating(false);
        setStatus("Could not detect. Enter coordinates manually.");
      }
    );
  };

  // Login with phone number
  const loginWithPhone = async () => {
    if (!loginPhone) { setLoginError("Enter your phone number."); return; }
    setLoginError("");
    try {
      const res  = await fetch(`${API}/api/volunteers`);
      const vols = await res.json();
      const found = vols.find(v =>
        v.phone?.replace(/\s/g,"") === loginPhone.replace(/\s/g,"")
      );
      if (found) {
        localStorage.setItem("gm_volunteer", JSON.stringify(found));
        setVolunteer(found);
        startPolling(found);
      } else {
        setLoginError("Phone number not found. Please sign up first.");
      }
    } catch (e) {
      setLoginError("Server error. Make sure backend is running.");
    }
  };

  // Register volunteer
  const register = async () => {
    if (!form.name || !form.phone || !form.email || !form.lat || !form.lon) {
      setStatus("Please fill all required fields and detect location.");
      return;
    }
    setStatus("Registering...");
    try {
      const res  = await fetch(`${API}/api/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lon: parseFloat(form.lon),
          available: true,
          certified: form.certified,
          calls_handled: 0,
        }),
      });
      const data = await res.json();
      if (data.id) {
        const vol = { ...form, id: data.id, available: true };
        localStorage.setItem("gm_volunteer", JSON.stringify(vol));
        setVolunteer(vol);
        setStatus("");
        startPolling(vol);
      } else {
        setStatus("Registration failed. Try again.");
      }
    } catch (e) {
      setStatus("Server error. Make sure backend is running.");
    }
  };

  // Poll for nearby emergencies every 5 seconds
  const startPolling = (vol) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/api/logs?limit=20`);
        const logs = await res.json();
        const recent = logs.filter(l => {
          const age = (Date.now() - new Date(l.started_at).getTime()) / 60000;
          return age < 10;
        });
        setAlerts(prev => {
          const newOnes = recent.filter(r => !prev.find(p => p.id === r.id));
          return [...newOnes, ...prev].slice(0, 20);
        });
      } catch {}
    }, 5000);
  };

  useEffect(() => {
    const saved = localStorage.getItem("gm_volunteer");
    if (saved) {
      const vol = JSON.parse(saved);
      setVolunteer(vol);
      startPolling(vol);
    }
    return () => clearInterval(pollRef.current);
  }, []);

  const logout = () => {
    localStorage.removeItem("gm_volunteer");
    setVolunteer(null);
    setAlerts([]);
    clearInterval(pollRef.current);
    if (onLogout) onLogout();
  };

  const toggleAvailable = async () => {
    if (!volunteer) return;
    const newVal = !volunteer.available;
    const updated = { ...volunteer, available: newVal };
    setVolunteer(updated);
    localStorage.setItem("gm_volunteer", JSON.stringify(updated));
    await fetch(`${API}/api/volunteers/${volunteer.id}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: newVal }),
    });
  };

  // ── LOGGED IN VIEW ──────────────────────────────────────────────────────────
  if (volunteer) {
    return (
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.logo}>♥ GoldenMinute</div>
          <div className={styles.subtitle}>Volunteer Portal</div>
          <div className={styles.headerRight}>
            <span className={styles.volName}>{volunteer.name}</span>
            <button className={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>

        <div className={styles.dashboard}>
          <div className={styles.statusBar}>
            <div className={styles.volInfo}>
              <div className={styles.avatar}>{volunteer.name[0]}</div>
              <div>
                <div className={styles.volNameBig}>{volunteer.name}</div>
                <div className={styles.volMeta}>{volunteer.area}, {volunteer.city} · {volunteer.phone}</div>
              </div>
            </div>
            <div className={styles.toggleWrap}>
              <span className={styles.toggleLabel}>
                {volunteer.available ? "Available" : "Unavailable"}
              </span>
              <div
                className={`${styles.toggle} ${volunteer.available ? styles.toggleOn : ""}`}
                onClick={toggleAvailable}
              >
                <div className={styles.toggleThumb} />
              </div>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statVal}>{alerts.length}</div>
              <div className={styles.statLabel}>Active Alerts</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statVal}>{volunteer.calls_handled || 0}</div>
              <div className={styles.statLabel}>Calls Handled</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statVal}>{volunteer.certified ? "Yes" : "No"}</div>
              <div className={styles.statLabel}>CPR Certified</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statVal} style={{ color: volunteer.available ? "#2DC653" : "#e63946" }}>
                {volunteer.available ? "Online" : "Offline"}
              </div>
              <div className={styles.statLabel}>Status</div>
            </div>
          </div>

          <div className={styles.alertsSection}>
            <div className={styles.alertsHeader}>
              <div className={styles.alertsTitle}>
                <div className={styles.liveDot} />
                Nearby Emergency Alerts
              </div>
              <span className={styles.pollNote}>Auto-refreshing every 5 seconds</span>
            </div>

            {alerts.length === 0 ? (
              <div className={styles.noAlerts}>
                <div className={styles.noAlertsIcon}>✓</div>
                <div>No active emergencies nearby</div>
                <div className={styles.noAlertsSub}>You will be notified when someone needs help in your area</div>
              </div>
            ) : (
              <div className={styles.alertsList}>
                {alerts.map((a, i) => (
                  <div key={a.id || i} className={`${styles.alertCard} ${i === 0 ? styles.alertNew : ""}`}>
                    <div className={styles.alertTop}>
                      <span className={styles.alertBadge}>
                        {(a.last_emergency || "emergency").replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span className={styles.alertTime}>{timeAgo(a.started_at)}</span>
                    </div>
                    <div className={styles.alertBody}>
                      <div className={styles.alertRow}>
                        <span>📍</span>
                        <span>Caller: {a.caller || "Unknown"}</span>
                      </div>
                      <div className={styles.alertRow}>
                        <span>🚨</span>
                        <span>Emergency: {(a.last_emergency || "Unknown").replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <button className={styles.respondBtn}>I am Responding →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── AUTH VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.logo}>♥ GoldenMinute</div>
        <div className={styles.subtitle}>Volunteer Portal</div>
        <button className={styles.logoutBtn} onClick={onLogout} style={{ marginLeft: "auto" }}>
          ← Back
        </button>
      </div>

      <div className={styles.authWrap}>
        <div className={styles.authCard}>
          <div className={styles.authTabs}>
            <button className={`${styles.authTab} ${tab === "login" ? styles.active : ""}`} onClick={() => setTab("login")}>
              Login
            </button>
            <button className={`${styles.authTab} ${tab === "signup" ? styles.active : ""}`} onClick={() => setTab("signup")}>
              Sign Up
            </button>
          </div>

          {/* ── LOGIN TAB ── */}
          {tab === "login" && (
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Your Registered Phone Number</label>
                <input
                  placeholder="+919876543210"
                  value={loginPhone}
                  onChange={e => { setLoginPhone(e.target.value); setLoginError(""); }}
                  onKeyDown={e => e.key === "Enter" && loginWithPhone()}
                />
              </div>
              {loginError && <div className={styles.statusMsg}>{loginError}</div>}
              <button className={styles.submitBtn} onClick={loginWithPhone}>
                Login as Volunteer
              </button>
              <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(238,240,244,0.4)", marginTop: "8px" }}>
                New volunteer? Click Sign Up above.
              </p>
            </div>
          )}

          {/* ── SIGNUP TAB ── */}
          {tab === "signup" && (
            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Full Name *</label>
                  <input placeholder="Rajan Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Phone Number *</label>
                  <input placeholder="+919876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Email Address *</label>
                <input placeholder="your@gmail.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Area / Locality</label>
                  <input placeholder="Kothrud" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>City</label>
                  <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                    <option>pune</option>
                    <option>mumbai</option>
                    <option>delhi</option>
                    <option>nagpur</option>
                    <option>agra</option>
                    <option>jaipur</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>Full Address</label>
                <input placeholder="123, Main St, Kothrud, Pune" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className={styles.locationRow}>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Latitude *</label>
                  <input placeholder="18.5204" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Longitude *</label>
                  <input placeholder="73.8567" value={form.lon} onChange={e => setForm(f => ({ ...f, lon: e.target.value }))} />
                </div>
                <button className={styles.locBtn} onClick={detectLocation} disabled={locating}>
                  {locating ? "Detecting..." : "Auto Detect"}
                </button>
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.certified} onChange={e => setForm(f => ({ ...f, certified: e.target.checked }))} />
                I am CPR / First Aid certified
              </label>
              {status && <div className={styles.statusMsg}>{status}</div>}
              <button className={styles.submitBtn} onClick={register}>Register as Volunteer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  return `${Math.round(diff / 60)}m ago`;
}