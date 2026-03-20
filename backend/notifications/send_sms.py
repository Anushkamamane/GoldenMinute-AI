import os, logging, smtplib, requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
logger = logging.getLogger(__name__)

EMERGENCY_HINDI = {
    "cardiac_arrest": "Dil ka daura", "choking": "Sans rukna",
    "stroke": "Lakwa", "seizure": "Daura padna",
    "severe_bleeding": "Khoon bahna", "burns": "Jalna",
    "poisoning": "Zeher khana", "unconscious": "Behoshi",
    "breathing_difficulty": "Sans lene mein takleef",
    "stomach_pain": "Pet dard", "fever": "Bukhar",
    "fracture": "Haddi tootna", "other": "Medical Emergency",
}

class SMSNotifier:
    def __init__(self):
        self.gmail      = os.environ.get("ALERT_EMAIL", "")
        self.gmail_pass = os.environ.get("GMAIL_APP_PASSWORD", "")

    def _build_message(self, emergency_type, location, caller_number, distance):
        return (
            f"GOLDEN MINUTE ALERT!\n"
            f"Emergency: {emergency_type.replace('_',' ').title()} ({EMERGENCY_HINDI.get(emergency_type,'Emergency')})\n"
            f"Location: {location}\n"
            f"Caller: ****{caller_number[-4:]}\n"
            f"Distance: {distance} km\n"
            f"Please reach immediately! Call 108."
        )

    def alert_volunteer(self, volunteer, emergency_type, caller_number, location):
        message  = self._build_message(emergency_type, location, caller_number, volunteer.get("distance_km","?"))
        name     = volunteer.get("name", "Volunteer")
        email    = volunteer.get("email", "")

        if not email:
            logger.error(f"No email for volunteer {name}")
            return False

        return self._send_email(email, f"GOLDEN MINUTE ALERT — {emergency_type.replace('_',' ').title()}", message, name)

    def send_confirmation_to_caller(self, caller_number, volunteer_name, eta_mins=4):
        body = f"GoldenMinute: {volunteer_name} is coming! ETA ~{eta_mins} min. Call 108."
        self._send_email(self.gmail, "Help is on the way!", body, "Caller")

    def _send_email(self, to_email, subject, message, name):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = self.gmail
            msg["To"]      = to_email
            html = f"""
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
              <div style="background:#e63946;color:white;padding:15px;border-radius:8px;text-align:center">
                <h2 style="margin:0">GOLDEN MINUTE ALERT</h2>
              </div>
              <div style="background:#f8f8f8;padding:15px;margin-top:10px;border-radius:8px">
                <p><b>Dear {name},</b></p>
                <pre style="font-size:15px;white-space:pre-wrap;font-family:sans-serif">{message}</pre>
              </div>
              <div style="background:#0f2418;color:#2dc653;padding:10px;border-radius:8px;margin-top:10px;text-align:center">
                <p style="margin:0">GoldenMinute AI — Saving Lives</p>
              </div>
            </div>"""
            msg.attach(MIMEText(message, "plain"))
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.ehlo()
                server.starttls()
                server.login(self.gmail, self.gmail_pass)
                server.sendmail(self.gmail, to_email, msg.as_string())
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Email error: {e}")
            return False