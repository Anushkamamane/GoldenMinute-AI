"""
GoldenMinute AI – Emergency Detection
Groq (primary) + Gemini (fallback)
"""

import os
import json
import logging
import requests

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are GoldenMinute AI, an emergency medical assistant for India.
Analyze the caller's description and extract the emergency details.

Emergency types:
- cardiac_arrest: heart attack, chest pain, not breathing, collapsed
- choking: something stuck in throat, cant breathe, gasping
- stroke: face drooping, cant speak, sudden weakness, paralysis
- seizure: convulsions, fits, shaking uncontrollably
- severe_bleeding: heavy bleeding, deep cut, accident injury
- burns: fire, acid, hot water burns
- poisoning: ate something toxic, overdose, chemical exposure
- unconscious: fainted, unresponsive, not waking up
- breathing_difficulty: asthma attack, difficulty breathing
- stomach_pain: abdominal pain, stomach ache, vomiting, nausea
- fever: high temperature, body ache, chills
- fracture: broken bone, fall injury, cant move limb
- other: any other medical issue

Severity rules:
- critical: not breathing, unconscious, heart stopped, severe bleeding
- high: chest pain, stroke symptoms, choking, seizure
- medium: stomach pain, vomiting, fever, mild injury
- low: minor cuts, mild fever, general discomfort

ALWAYS respond with ONLY valid JSON:
{
  "type": "cardiac_arrest",
  "severity": "critical",
  "language": "hi",
  "symptoms": ["chest pain", "not breathing"],
  "confidence": 0.95
}

Language detection: hi=Hindi, mr=Marathi, en=English
Be accurate — stomach pain is NOT cardiac arrest. Match the type to the actual symptoms described."""


class EmergencyDetector:
    def __init__(self):
        self.groq_key   = os.environ.get("GROQ_API_KEY", "")
        self.gemini_key = os.environ.get("GEMINI_API_KEY", "")
        self.groq_model = "llama-3.3-70b-versatile"

    def detect(self, speech_text: str) -> dict:
        result = self._try_groq(speech_text)
        if result:
            return result
        logger.warning("Groq failed — trying Gemini")
        result = self._try_gemini(speech_text)
        if result:
            return result
        logger.error("Both AI providers failed — using static fallback")
        return self._fallback_emergency(speech_text)

    def _try_groq(self, speech_text: str) -> dict | None:
        if not self.groq_key:
            return None
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"},
                json={
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"Emergency call: {speech_text}"},
                    ],
                    "max_tokens": 300,
                    "temperature": 0.1,
                },
                timeout=8,
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            logger.info(f"Groq detected: {result}")
            return result
        except Exception as e:
            logger.error(f"Groq error: {e}")
            return None

    def _try_gemini(self, speech_text: str) -> dict | None:
        if not self.gemini_key:
            return None
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
            prompt = f"{SYSTEM_PROMPT}\n\nEmergency call: {speech_text}"
            resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
            resp.raise_for_status()
            raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            logger.info(f"Gemini detected: {result}")
            return result
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return None

    def _fallback_emergency(self, speech_text: str) -> dict:
        """Basic keyword fallback when both AIs fail."""
        text = speech_text.lower()
        if any(w in text for w in ["chest", "heart", "saans nahi", "not breathing", "collapsed"]):
            return {"type": "cardiac_arrest", "severity": "critical", "language": "hi", "symptoms": [], "confidence": 0.0}
        elif any(w in text for w in ["choke", "gala", "stuck", "throat"]):
            return {"type": "choking", "severity": "high", "language": "hi", "symptoms": [], "confidence": 0.0}
        elif any(w in text for w in ["stomach", "pet", "vomit", "ulti"]):
            return {"type": "stomach_pain", "severity": "medium", "language": "hi", "symptoms": [], "confidence": 0.0}
        elif any(w in text for w in ["behosh", "unconscious", "faint"]):
            return {"type": "unconscious", "severity": "critical", "language": "hi", "symptoms": [], "confidence": 0.0}
        else:
            return {"type": "other", "severity": "medium", "language": "hi", "symptoms": [], "confidence": 0.0}
