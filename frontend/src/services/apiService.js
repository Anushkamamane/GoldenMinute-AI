/**
 * GoldenMinute AI – API Service
 * Connects the React dashboard to the Flask backend.
 * Set REACT_APP_API_URL in your .env file.
 */

const configuredBaseUrl = (process.env.REACT_APP_API_URL || "").trim();

// When the app is opened from a remote URL (codespaces/tunnels), browser
// localhost does not point to the backend container. In that case use relative
// /api paths so CRA proxy can forward requests in development.
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocalHost = host === "localhost" || host === "127.0.0.1";
const configuredToLocalHost = /localhost|127\.0\.0\.1/.test(configuredBaseUrl);

const BASE_URL = !isLocalHost && configuredToLocalHost ? "" : configuredBaseUrl;

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let res;

  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new Error(`Network error while calling ${url}. Check backend/proxy settings.`);
  }

  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
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
