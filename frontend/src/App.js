import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import VolunteerRegister from "./pages/VolunteerRegister";
import "./App.css";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("login"); // "login", "register", "dashboard"

  useEffect(() => {
    if (localStorage.getItem("gm_admin")) {
      setAuthed(true);
      setPage("dashboard");
    } else {
      setAuthed(false);
      setPage("login");
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem("gm_admin", "1");
    setAuthed(true);
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("gm_admin");
    setAuthed(false);
    setPage("login");
  };

  const goToRegister = () => {
    setPage("register");
  };

  const goToLogin = () => {
    setPage("login");
  };

  if (page === "dashboard" && authed) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (page === "register") {
    return <VolunteerRegister onBack={goToLogin} />;
  }

  return <Login onLogin={handleLogin} onRegister={goToRegister} />;
}
