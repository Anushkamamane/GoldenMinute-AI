/**
 * GoldenMinute AI – API Service
 * Connects the React dashboard to the Flask backend.
 *
 * Default behavior uses React dev-server proxy (package.json -> proxy).
 * Set REACT_APP_API_URL only when you need an explicit backend origin.
 */

const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

/** Fetch summary stats for the dashboard overview. */
export async function fetchStats() {
  return apiFetch("/api/stats");
}

/** Fetch recent call logs (latest 50). */
export async function fetchLogs(limit = 50) {
  return apiFetch(`/api/logs?limit=${limit}`);
}

/** Fetch all registered volunteers. */
export async function fetchVolunteers() {
  return apiFetch("/api/volunteers");
}

/** Register a new volunteer. */
export async function registerVolunteer(data) {
  return apiFetch("/api/volunteers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Toggle volunteer availability. */
export async function setVolunteerAvailability(volunteerId, available) {
  return apiFetch(`/api/volunteers/${volunteerId}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ available }),
  });
}
