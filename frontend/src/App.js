import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import VolunteerPortal from "./pages/VolunteerPortal";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("login");

  useEffect(() => {
    const admin = localStorage.getItem("gm_admin");
    const vol   = localStorage.getItem("gm_volunteer");
    if (admin)    setPage("dashboard");
    else if (vol) setPage("volunteer");
    else          setPage("login");
  }, []);

  if (page === "dashboard") {
    return (
      <Dashboard
        onLogout={() => {
          localStorage.removeItem("gm_admin");
          setPage("login");
        }}
      />
    );
  }

  if (page === "volunteer") {
    return (
      <VolunteerPortal
        onLogout={() => {
          localStorage.removeItem("gm_volunteer");
          setPage("login");
        }}
      />
    );
  }

  return (
    <Login
      onLogin={() => {
        localStorage.setItem("gm_admin", "1");
        setPage("dashboard");
      }}
      onVolunteer={() => setPage("volunteer")}
    />
  );
}