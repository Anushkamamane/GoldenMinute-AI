import styles from "./VolunteerCard.module.css";

export default function VolunteerCard({ volunteer: v }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.avatar}>{v.name[0]}</div>
        <div className={styles.info}>
          <div className={styles.name}>{v.name}</div>
          <div className={styles.area}>{v.area}</div>
        </div>
        <div
          className={styles.badge}
          style={{
            background: v.available ? "var(--green-dim)" : "rgba(255,255,255,0.05)",
            color: v.available ? "var(--green)" : "var(--muted)",
          }}
        >
          {v.available ? "Available" : "Busy"}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Phone</span>
          <span>{v.phone}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Calls Handled</span>
          <span className={styles.highlight}>{v.calls_handled}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Certified</span>
          <span style={{ color: v.certified ? "var(--green)" : "var(--red)" }}>
            {v.certified ? "✓ CPR Certified" : "✗ Not Certified"}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Coordinates</span>
          <span className={styles.coords}>
            {v.lat?.toFixed(4)}, {v.lon?.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
