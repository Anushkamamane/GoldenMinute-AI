import styles from "./Login.module.css";

export default function Login({ onLogin, onVolunteer, onEmergency }) {
  const [password, setPassword] = require("react").useState("");
  const [error, setError]       = require("react").useState("");

  const submit = () => {
    if (password === "admin123") onLogin();
    else setError("Invalid password. (Demo: admin123)");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>♥</div>
        <h1 className={styles.title}>GoldenMinute AI</h1>
        <p className={styles.sub}>Life-Saving Emergency Assistant</p>

        <div className={styles.optionsGrid}>
          <button className={styles.optionBtn} onClick={onEmergency}>
            <div className={styles.optionIcon} style={{ background: "rgba(230,57,70,0.15)", color: "#e63946" }}>🚨</div>
            <div className={styles.optionText}>
              <div className={styles.optionTitle}>Emergency Help</div>
              <div className={styles.optionSub}>I need immediate assistance</div>
            </div>
          </button>

          <button className={styles.optionBtn} onClick={onVolunteer}>
            <div className={styles.optionIcon} style={{ background: "rgba(45,198,83,0.15)", color: "#2dc653" }}>🧑‍⚕️</div>
            <div className={styles.optionText}>
              <div className={styles.optionTitle}>Volunteer Portal</div>
              <div className={styles.optionSub}>Register or login as volunteer</div>
            </div>
          </button>
        </div>

        <div className={styles.divider}><span>Admin Access</span></div>

        <div className={styles.field}>
          <label className={styles.label}>Admin Password</label>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Enter admin password"
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} onClick={submit}>Access Dashboard</button>

        <p className={styles.note}>
          🚨 Emergency? Click the red button above for instant AI guidance
        </p>
      </div>
    </div>
  );
}