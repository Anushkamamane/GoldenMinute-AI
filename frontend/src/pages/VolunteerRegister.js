import { useState } from "react";
import styles from "./VolunteerRegister.module.css";
import { registerVolunteer } from "../services/apiService";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "pa", label: "Punjabi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
];

const CITIES = [
  "Agra",
  "Delhi",
  "Jaipur",
  "Mumbai",
  "Pune",
  "Lucknow",
  "Varanasi",
  "Nagpur",
];

export default function VolunteerRegister({ onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "",
    preferred_language: "en",
    lat: "",
    lon: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [useCity, setUseCity] = useState(true);
  const [selectedCity, setSelectedCity] = useState("Pune");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            lat: latitude.toFixed(4),
            lon: longitude.toFixed(4),
          }));
          setUseCity(false);
          setError("");
        },
        (err) => {
          setError(`Location error: ${err.message}`);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  const useDefaultCity = () => {
    const cityCoords = {
      Pune: { lat: 18.5204, lon: 73.8567 },
      Delhi: { lat: 28.6139, lon: 77.209 },
      Mumbai: { lat: 19.076, lon: 72.8777 },
      Agra: { lat: 27.1767, lon: 78.0081 },
      Jaipur: { lat: 26.9124, lon: 75.7873 },
      Lucknow: { lat: 26.8467, lon: 80.9462 },
      Varanasi: { lat: 25.3176, lon: 82.9739 },
      Nagpur: { lat: 21.1458, lon: 79.0882 },
    };

    const coords = cityCoords[selectedCity] || cityCoords["Pune"];
    setFormData((prev) => ({
      ...prev,
      lat: coords.lat.toString(),
      lon: coords.lon.toString(),
    }));
    setUseCity(true);
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Valid phone number is required (at least 10 digits)");
      return false;
    }
    if (!formData.lat || !formData.lon) {
      setError("Location (latitude/longitude) is required");
      return false;
    }
    if (!formData.area.trim()) {
      setError("Area/Service location is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
        area: formData.area,
        preferred_language: formData.preferred_language,
      };

      const result = await registerVolunteer(submitData);

      if (result.id) {
        setSuccess(`✓ Registered successfully! ID: ${result.id}`);
        setFormData({
          name: "",
          phone: "",
          area: "",
          preferred_language: "en",
          lat: "",
          lon: "",
        });
        
        // Auto-navigate back after 2 seconds
        setTimeout(() => {
          onBack && onBack();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <div className={styles.logo}>♥</div>
          <h1 className={styles.title}>Volunteer Registration</h1>
          <p className={styles.sub}>Join GoldenMinute AI</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>Full Name *</label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Rajan Sharma"
            />
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label className={styles.label}>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className={styles.input}
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g., +919876543210"
            />
          </div>

          {/* Area */}
          <div className={styles.field}>
            <label className={styles.label}>Service Area *</label>
            <input
              type="text"
              name="area"
              className={styles.input}
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., Kothrud Pune"
            />
          </div>

          {/* Language */}
          <div className={styles.field}>
            <label className={styles.label}>Preferred Language</label>
            <select
              name="preferred_language"
              className={styles.select}
              value={formData.preferred_language}
              onChange={handleInputChange}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Section */}
          <div className={styles.locationSection}>
            <h3 className={styles.sectionTitle}>Location Details *</h3>

            {error && error.includes("Location") && (
              <p className={styles.error}>{error}</p>
            )}

            <div className={styles.locationOptions}>
              <button
                type="button"
                className={`${styles.btnOption} ${!useCity ? styles.active : ""}`}
                onClick={handleGetLocation}
              >
                📍 Use GPS Location
              </button>
              <button
                type="button"
                className={`${styles.btnOption} ${useCity ? styles.active : ""}`}
                onClick={useDefaultCity}
              >
                🏙️ Use City Default
              </button>
            </div>

            {useCity && (
              <div className={styles.field}>
                <label className={styles.label}>City</label>
                <select
                  className={styles.select}
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    useDefaultCity();
                  }}
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.coordFields}>
              <div className={styles.field}>
                <label className={styles.label}>Latitude</label>
                <input
                  type="number"
                  name="lat"
                  className={styles.input}
                  value={formData.lat}
                  onChange={handleInputChange}
                  placeholder="e.g., 18.5204"
                  step="0.0001"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Longitude</label>
                <input
                  type="number"
                  name="lon"
                  className={styles.input}
                  value={formData.lon}
                  onChange={handleInputChange}
                  placeholder="e.g., 73.8567"
                  step="0.0001"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && !error.includes("Location") && (
            <p className={styles.error}>{error}</p>
          )}

          {/* Success Message */}
          {success && <p className={styles.success}>{success}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register as Volunteer"}
          </button>
        </form>

        <p className={styles.note}>
          💚 Your quick response can save a life. Be part of the emergency response network.
        </p>
      </div>
    </div>
  );
}
