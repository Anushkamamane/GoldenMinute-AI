import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./App.css";

export default function App() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!localStorage.getItem("gm_admin"));
  }, []);

  return authed
    ? <Dashboard onLogout={() => { localStorage.removeItem("gm_admin"); setAuthed(false); }} />
    : <Login onLogin={() => { localStorage.setItem("gm_admin", "1"); setAuthed(true); }} />;
}
