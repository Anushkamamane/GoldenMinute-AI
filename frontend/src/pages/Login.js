import { useState } from "react";
import styles from "./Login.module.css";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const submit = () => {
    // In production: validate against Firebase Auth or backend JWT
    if (password === "admin123") {
      onLogin();
    } else {
      setError("Invalid credentials. (Demo: admin123)");
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>♥</div>
        <h1 className={styles.title}>GoldenMinute AI</h1>
        <p className={styles.sub}>Emergency Response Dashboard</p>

        <div className={styles.field}>
          <label className={styles.label}>Admin Password</label>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Enter password"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={submit}>Access Dashboard</button>

        <p className={styles.note}>
          🚨 For emergencies, give a missed call to <strong>1800-XXX-XXXX</strong> (toll free)
        </p>
      </div>
    </div>
  );
}
