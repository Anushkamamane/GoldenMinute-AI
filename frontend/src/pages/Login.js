import { useState } from "react";
import styles from "./Login.module.css";

export default function Login({ onLogin, onVolunteer }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const submit = () => {
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

        <button
          onClick={onVolunteer}
          style={{
            width:"100%", background:"transparent",
            border:"1px solid rgba(45,198,83,0.4)", color:"#2dc653",
            borderRadius:"8px", padding:"10px", fontFamily:"inherit",
            fontSize:"13px", cursor:"pointer", marginBottom:"1rem"
          }}
        >
          Join as Volunteer →
        </button>

        <p className={styles.note}>
          🚨 For emergencies, open the emergency form directly
        </p>
      </div>
    </div>
  );
}