import { useState } from "react";
import styles from "./MapView.module.css";

// Project volunteer coords to a simple SVG viewport
function project(lat, lon, viewW = 560, viewH = 340) {
  const latMin = 18.50, latMax = 18.55;
  const lonMin = 73.83, lonMax = 73.88;
  const x = ((lon - lonMin) / (lonMax - lonMin)) * (viewW - 60) + 30;
  const y = ((latMax - lat) / (latMax - latMin)) * (viewH - 60) + 30;
  return { x: Math.round(x), y: Math.round(y) };
}

export default function MapView({ volunteers = [] }) {
  const [hovered, setHovered] = useState(null);
  const W = 560, H = 340;

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: "var(--green)" }} /> Available
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: "var(--muted)" }} /> Busy
        </span>
        <span className={styles.note}>Showing Pune region (demo coordinates)</span>
      </div>

      <div className={styles.mapWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
          {/* Grid */}
          {[0,1,2,3,4].map(i => (
            <line key={`hg${i}`} x1={30} y1={30 + i * 70} x2={W-30} y2={30 + i * 70}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[0,1,2,3,4,5,6].map(i => (
            <line key={`vg${i}`} x1={30 + i * 75} y1={30} x2={30 + i * 75} y2={H-30}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Coverage rings */}
          {volunteers.filter(v => v.available).map(v => {
            const { x, y } = project(v.lat, v.lon, W, H);
            return (
              <circle key={`ring-${v.id}`} cx={x} cy={y} r={55}
                fill="rgba(45,198,83,0.04)" stroke="rgba(45,198,83,0.12)"
                strokeWidth="1" strokeDasharray="4 4" />
            );
          })}

          {/* Volunteer markers */}
          {volunteers.map(v => {
            const { x, y } = project(v.lat, v.lon, W, H);
            const color = v.available ? "#2DC653" : "rgba(238,240,244,0.25)";
            const isHov = hovered === v.id;

            return (
              <g key={v.id}
                onMouseEnter={() => setHovered(v.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {isHov && (
                  <circle cx={x} cy={y} r={22}
                    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                )}
                <circle cx={x} cy={y} r={10}
                  fill={v.available ? "rgba(45,198,83,0.15)" : "rgba(255,255,255,0.05)"}
                  stroke={color} strokeWidth={1.5} />
                <circle cx={x} cy={y} r={4} fill={color} />
                <text x={x} y={y + 22} textAnchor="middle"
                  fill="rgba(238,240,244,0.7)" fontSize="10"
                  fontFamily="IBM Plex Sans, sans-serif">
                  {v.name.split(" ")[0]}
                </text>
                {isHov && (
                  <g>
                    <rect x={x - 70} y={y - 52} width={140} height={42}
                      rx={6} fill="#161C2A" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <text x={x} y={y - 35} textAnchor="middle"
                      fill="#EEF0F4" fontSize="11" fontFamily="IBM Plex Sans, sans-serif" fontWeight="500">
                      {v.name}
                    </text>
                    <text x={x} y={y - 20} textAnchor="middle"
                      fill="rgba(238,240,244,0.5)" fontSize="10" fontFamily="IBM Plex Sans, sans-serif">
                      {v.calls_handled} calls · {v.available ? "Available" : "Busy"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Area labels */}
          {[
            { label: "Kothrud", x: 80,  y: 310 },
            { label: "Deccan",  x: 200, y: 310 },
            { label: "Shivajinagar", x: 360, y: 310 },
            { label: "Karve Nagar", x: 490, y: 310 },
          ].map(a => (
            <text key={a.label} x={a.x} y={a.y} textAnchor="middle"
              fill="rgba(238,240,244,0.2)" fontSize="9" fontFamily="IBM Plex Sans, sans-serif">
              {a.label}
            </text>
          ))}
        </svg>
      </div>

      <div className={styles.volList}>
        {volunteers.map(v => (
          <div key={v.id}
            className={`${styles.volItem} ${hovered === v.id ? styles.volActive : ""}`}
            onMouseEnter={() => setHovered(v.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className={styles.volDot}
              style={{ background: v.available ? "var(--green)" : "var(--muted)" }} />
            <div className={styles.volName}>{v.name}</div>
            <div className={styles.volArea}>{v.area}</div>
            <div className={styles.volCalls}>{v.calls_handled} calls</div>
          </div>
        ))}
      </div>
    </div>
  );
}
