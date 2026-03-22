import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import EmergencyLog from "../components/EmergencyLog";
import VolunteerCard from "../components/VolunteerCard";
import { fetchStats, fetchLogs, fetchVolunteers } from "../services/apiService";
import styles from "./Dashboard.module.css";

// Demo data used when backend is not available
const DEMO_LOGS = [
  { id: "1", caller: "+91 98****2341", emergency_type: "cardiac_arrest", severity: "critical", language: "hi", started_at: new Date(Date.now() - 3 * 60000).toISOString(), volunteer_name: "Rajan Sharma", volunteer_dist: 1.2, status: "completed", duration_s: 312 },
  { id: "2", caller: "+91 70****8812", emergency_type: "choking",        severity: "high",     language: "en", started_at: new Date(Date.now() - 18 * 60000).toISOString(), volunteer_name: "Priya Nair", volunteer_dist: 0.8, status: "completed", duration_s: 187 },
  { id: "3", caller: "+91 62****4490", emergency_type: "stroke",         severity: "critical", language: "hi", started_at: new Date(Date.now() - 45 * 60000).toISOString(), volunteer_name: null, volunteer_dist: null, status: "completed", duration_s: 420 },
  { id: "4", caller: "+91 99****1103", emergency_type: "breathing_difficulty", severity: "high", language: "mr", started_at: new Date(Date.now() - 2 * 3600000).toISOString(), volunteer_name: "Amit Kulkarni", volunteer_dist: 2.1, status: "completed", duration_s: 245 },
];

const DEMO_VOLUNTEERS = [
  { id: "v1", name: "Rajan Sharma",   phone: "+91 98****2341", lat: 18.525, lon: 73.858, available: true,  certified: true, calls_handled: 14, area: "Kothrud, Pune" },
  { id: "v2", name: "Priya Nair",     phone: "+91 70****8812", lat: 18.512, lon: 73.847, available: true,  certified: true, calls_handled: 9,  area: "Deccan, Pune" },
  { id: "v3", name: "Amit Kulkarni",  phone: "+91 62****4490", lat: 18.530, lon: 73.863, available: false, certified: true, calls_handled: 22, area: "Shivajinagar, Pune" },
  { id: "v4", name: "Sunita Desai",   phone: "+91 77****5521", lat: 18.519, lon: 73.841, available: true,  certified: true, calls_handled: 6,  area: "Karve Nagar, Pune" },
];

export default function Dashboard({ onLogout }) {
  const [logs, setLogs]           = useState(DEMO_LOGS);
  const [volunteers, setVolunteers] = useState(DEMO_VOLUNTEERS);
  const [stats, setStats]         = useState({ total: 47, saved: 41, volunteers: 4, avgResponse: 3.8 });
  const [tab, setTab]             = useState("overview");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, l, v] = await Promise.all([fetchStats(), fetchLogs(), fetchVolunteers()]);
        if (s) setStats(s);
        if (l?.length) setLogs(l);
        if (v?.length) setVolunteers(v);
      } catch { /* use demo data */ }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const TABS = ["overview", "map", "volunteers", "logs"];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.heartIcon}>♥</span>
          <div>
            <div className={styles.brandName}>GoldenMinute</div>
            <div className={styles.brandSub}>AI Emergency Network</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.navBtn} ${tab === t ? styles.active : ""}`}
              onClick={() => setTab(t)}
            >
              {NAV_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        <div className={styles.liveBar}>
          <div className="live-dot" />
          <span>System Active</span>
        </div>

        <button className={styles.logoutBtn} onClick={onLogout}>Sign out</button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>{TAB_TITLES[tab]}</h1>
          <div className={styles.headerRight}>
            <span className={styles.timestamp}>
              Last updated: {new Date().toLocaleTimeString("en-IN")}
            </span>
            <button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(238,240,244,0.5)",padding:"6px 14px",borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit",marginLeft:"12px"}}>← Logout</button>
          </div>
        </header>

        <div className={styles.content}>
          {tab === "overview" && <Overview stats={stats} logs={logs} volunteers={volunteers} />}
          {tab === "map"       && <MapView volunteers={volunteers} />}
          {tab === "volunteers" && (
            <div className={styles.volGrid}>
              {volunteers.map(v => <VolunteerCard key={v.id} volunteer={v} />)}
            </div>
          )}
          {tab === "logs" && <EmergencyLog logs={logs} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ stats, logs, volunteers }) {
  const statCards = [
    { label: "Total Calls Today", value: stats.total, color: "var(--text)" },
    { label: "Lives Saved",        value: stats.saved, color: "var(--green)" },
    { label: "Active Volunteers",  value: volunteers.filter(v => v.available).length, color: "var(--amber)" },
    { label: "Avg Response (min)", value: stats.avgResponse, color: "var(--red)" },
  ];

  return (
    <div className="fade-in">
      <div className={styles.statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statVal} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={styles.twoCol}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Recent Emergencies</div>
          <EmergencyLog logs={logs.slice(0, 5)} compact />
        </div>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Volunteer Status</div>
          {volunteers.map(v => (
            <div key={v.id} className={styles.volRow}>
              <div className={styles.volAvatar}>{v.name[0]}</div>
              <div className={styles.volMeta}>
                <div className={styles.volName}>{v.name}</div>
                <div className={styles.volArea}>{v.area}</div>
              </div>
              <div
                className={styles.statusDot}
                style={{ background: v.available ? "var(--green)" : "var(--muted)" }}
                title={v.available ? "Available" : "Busy"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const NAV_ICONS = {
  overview:   "◈ ",
  map:        "◎ ",
  volunteers: "◉ ",
  logs:       "◷ ",
};

const TAB_TITLES = {
  overview:   "Command Overview",
  map:        "Live Volunteer Map",
  volunteers: "Volunteer Network",
  logs:       "Emergency Logs",
};