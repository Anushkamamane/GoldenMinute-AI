import styles from "./EmergencyLog.module.css";

const EMERGENCY_LABELS = {
  cardiac_arrest:       "Cardiac Arrest",
  choking:              "Choking",
  stroke:               "Stroke",
  seizure:              "Seizure",
  severe_bleeding:      "Severe Bleeding",
  burns:                "Burns",
  poisoning:            "Poisoning",
  unconscious:          "Unconscious",
  breathing_difficulty: "Breathing Difficulty",
  other:                "Medical Emergency",
};

const SEVERITY_COLOR = {
  critical: "var(--red)",
  high:     "var(--amber)",
  medium:   "#60A5FA",
  low:      "var(--green)",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function fmtDuration(s) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function EmergencyLog({ logs = [], compact = false }) {
  if (!logs.length) {
    return <p className={styles.empty}>No emergency logs yet.</p>;
  }

  return (
    <div className={styles.wrap}>
      {!compact && (
        <div className={styles.tableHead}>
          <span>Time</span>
          <span>Emergency</span>
          <span>Severity</span>
          <span>Language</span>
          <span>Volunteer</span>
          <span>Duration</span>
          <span>Status</span>
        </div>
      )}
      {logs.map(log => (
        <div key={log.id} className={compact ? styles.compactRow : styles.row}>
          <span className={styles.time}>{timeAgo(log.started_at)}</span>
          <span className={styles.type}>
            {EMERGENCY_LABELS[log.emergency_type] || log.emergency_type}
          </span>
          {!compact && (
            <>
              <span
                className={styles.severity}
                style={{ color: SEVERITY_COLOR[log.severity] || "var(--text)" }}
              >
                {log.severity?.toUpperCase()}
              </span>
              <span className={styles.lang}>
                {{ hi: "Hindi", mr: "Marathi", en: "English" }[log.language] || log.language}
              </span>
              <span className={styles.volunteer}>
                {log.volunteer_name
                  ? `${log.volunteer_name} (${log.volunteer_dist} km)`
                  : <span className={styles.noVol}>None nearby</span>}
              </span>
              <span className={styles.dur}>{fmtDuration(log.duration_s)}</span>
            </>
          )}
          <span
            className={styles.status}
            style={{
              color: log.status === "completed" ? "var(--green)" : "var(--amber)",
            }}
          >
            {log.status}
          </span>
        </div>
      ))}
    </div>
  );
}
