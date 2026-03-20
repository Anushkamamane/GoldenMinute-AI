<<<<<<< HEAD
# 🚨 GoldenMinute AI — Life-Saving Emergency Assistant

> AI-powered emergency response system that guides families through cardiac emergencies and alerts nearby trained volunteers — **before the ambulance arrives.**

---

## ✅ Winning Pitch

> *"GoldenMinute AI uses AI + local volunteer networks to save lives during cardiac emergencies — giving families real-time voice guidance and immediate help within the Golden Minute, before professional help even arrives."*

---

## 📁 Project Structure

```
GoldenMinute-AI/
├── backend/
│   ├── ai/
│   │   ├── emergency_detection.py   ← Claude API: identifies emergency type
│   │   └── guidance_generator.py    ← Claude API: generates first-aid steps
│   ├── telephony/
│   │   ├── call_handler.py          ← TwiML greeting + listen
│   │   └── webhook.py               ← Twilio signature validation
│   ├── database/
│   │   ├── firebase_config.py       ← Firebase init
│   │   ├── volunteer_lookup.py      ← Nearest volunteer (Haversine)
│   │   └── logs.py                  ← Call logging to Firestore
│   ├── notifications/
│   │   └── send_sms.py              ← Twilio SMS alerts to volunteers
│   ├── routes/
│   │   └── api_routes.py            ← REST API for React dashboard
│   ├── requirements.txt
│   └── server.py                    ← Flask main app
├── frontend/
│   └── src/
│       ├── pages/Dashboard.js       ← Main admin dashboard
│       ├── pages/Login.js           ← Auth screen
│       ├── components/MapView.js    ← Live volunteer map
│       ├── components/EmergencyLog.js
│       ├── components/VolunteerCard.js
│       └── services/apiService.js   ← Fetch from backend
├── data/
│   ├── volunteers.csv               ← Seed data
│   └── logs_sample.csv
└── .env.example
```

---

## 🚀 Setup & Run

### 1. Clone & environment

```bash
git clone https://github.com/your-team/GoldenMinute-AI.git
cd GoldenMinute-AI
cp .env.example .env
# Fill in your real API keys in .env
```

### 2. Backend (Python / Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python server.py                # Runs on http://localhost:5000
```

### 3. Frontend (React)

```bash
cd frontend
npm install
npm start                       # Runs on http://localhost:3000
```

### 4. Expose backend to Twilio (dev)

```bash
# Install ngrok: https://ngrok.com
ngrok http 5000

# Copy the https URL and set in Twilio console:
# Webhook URL: https://xxxx.ngrok.io/incoming-call
```

---

## 🔑 API Keys Required

| Service | Where to Get |
|---------|-------------|
| **Twilio** Account SID + Auth Token + Phone Number | [twilio.com/console](https://console.twilio.com) |
| **Anthropic Claude** API Key | [console.anthropic.com](https://console.anthropic.com) |
| **Firebase** Service Account JSON | Firebase Console → Project Settings → Service Accounts |

---

## 📞 Call Flow

```
Missed call → Twilio callback
    → TwiML greeting (Hindi/English)
    → User speaks emergency
    → Google Speech-to-Text
    → Claude API → emergency type + severity + language
    → Claude API → step-by-step first-aid guidance
    → Google TTS → spoken back to caller
    → Firebase → nearest volunteer (Haversine distance)
    → Twilio SMS → volunteer alerted instantly
    → Volunteer arrives ~4 min → ambulance still en route
```

---

## 🗄️ Firebase Data Model

### Collection: `volunteers`
```json
{
  "name": "Rajan Sharma",
  "phone": "+919876543210",
  "lat": 18.525,
  "lon": 73.858,
  "available": true,
  "certified": true,
  "calls_handled": 14,
  "area": "Kothrud, Pune",
  "preferred_language": "hi"
}
```

### Collection: `call_logs`
```json
{
  "call_sid": "CAxxxx",
  "caller": "+919800001111",
  "started_at": "2024-01-15T06:12:00Z",
  "status": "completed",
  "duration_s": 312,
  "interactions": [
    {
      "speech": "mere papa ko chest mein dard ho raha hai",
      "emergency_type": "cardiac_arrest",
      "severity": "critical",
      "language": "hi",
      "volunteer_name": "Rajan Sharma",
      "volunteer_dist": 1.2
    }
  ]
}
```

---

## 🎯 Demo Script (Competition)

1. **Show the dashboard** — stats, volunteer map, recent logs
2. **Simulate a call:**
   - Give missed call to Twilio number
   - AI calls back: *"Namaste. Aap ne GoldenMinute AI ko call kiya hai..."*
   - Say: *"Mere papa ko chest mein bahut dard ho raha hai"*
   - AI responds with CPR guidance in Hindi
3. **Show SMS received** by volunteer on a second phone
4. **Explain impact:**
   - Volunteer arrives in ~4 min vs ambulance in 40+ min
   - This is the **Golden Minute** — the difference between life and death

---

## 🧑‍💻 Team Roles

| Role | Files |
|------|-------|
| AI Developer | `backend/ai/emergency_detection.py`, `guidance_generator.py` |
| Backend / Telephony | `backend/server.py`, `telephony/`, `notifications/` |
| Database | `backend/database/` |
| Frontend | `frontend/src/` |
| Demo / Design | `demo/`, `docs/`, README |

---

## 📊 Impact

- 🫀 **1.4 million** cardiac deaths annually in India
- ⏱️ **4 min** — volunteer response vs **40+ min** ambulance ETA in rural areas
- 📱 Works on **₹500 keypad phones** — no smartphone required
- 🌐 **3 languages** — Hindi, Marathi, English
- 💸 **Near-zero cost** — Twilio free tier + Firebase free tier

---

## 📄 License

MIT — Built for social good. Use freely, save lives.
=======
# GoldenMinute-AI
>>>>>>> e2a1efeceaffd7db1c1f39305452e7e8afa41265
