"""
GoldenMinute AI – Guidance Generator
Generates multilingual step-by-step first-aid voice guidance.
Primary: Groq API (llama3, fast + free)   Fallback: Gemini 1.5 Flash
"""

import os
import logging
import requests

logger = logging.getLogger(__name__)

# Pre-written CPR script (used as fallback if Claude is unavailable)
FALLBACK_GUIDANCE = {
    "hi": {
        "cardiac_arrest": (
            "Turant CPR shuru karen. "
            "Pehle: Marz ki chhaati ko seedha rakhen. "
            "Doosre: Apne haath chhaati ke beech mein rakhen. "
            "Teesre: 30 baar haath se dabayen, har baar 5 centimeter andar tak. "
            "Chauthhe: 2 baar muh se saans den. "
            "Yeh cycle ambulance aane tak jaari rakhen. Himmat rakhein, aap zindagi bacha rahe hain."
        ),
        "choking": (
            "Ghutne waale ko seedha khada karen. "
            "Peeth par 5 baar zabardast thapkiyan maaren. "
            "Fir unke peeche se unke pet par haath rakh kar 5 baar kheenchen. "
            "Yeh tab tak dohrayen jab tak cheez bahar na aaye."
        ),
        "stroke": (
            "Marz ko seedha litayen. "
            "Sar ko thoda utha kar rakhen. "
            "Kuch bhi khane ya peene ko mat den. "
            "Ambulance ka intezaar karen aur marz ko hilane mat den."
        ),
    },
    "en": {
        "cardiac_arrest": (
            "Start CPR immediately. "
            "Step one: Lay the person flat on a firm surface. "
            "Step two: Place both hands on the center of their chest. "
            "Step three: Push hard and fast, 30 compressions, 2 inches deep. "
            "Step four: Give 2 rescue breaths. "
            "Repeat until ambulance arrives. You are saving a life — stay calm."
        ),
        "choking": (
            "Stand the person upright. "
            "Give 5 sharp back blows between the shoulder blades. "
            "Then perform 5 abdominal thrusts from behind. "
            "Repeat until the obstruction clears."
        ),
        "stroke": (
            "Lay the person down with head slightly raised. "
            "Do not give them food or water. "
            "Keep them still and calm. "
            "Wait for the ambulance without moving them."
        ),
    },
}


SYSTEM_PROMPT = """You are GoldenMinute AI, a calm and clear emergency medical assistant for India.
Generate short, spoken first-aid instructions for the given emergency.

Rules:
- Maximum 5 steps
- Each step starts with a number (Pehla, Doosra... for Hindi; Step 1, Step 2... for English)
- Use simple words a non-medical person can understand
- Speak with calm urgency — reassuring but direct
- Output plain text only (no markdown, no headers)
- End with an encouraging sentence
- Language must match the requested language code exactly"""


class GuidanceGenerator:
    def __init__(self):
        self.groq_key   = os.environ.get("GROQ_API_KEY", "")
        self.gemini_key = os.environ.get("GEMINI_API_KEY", "")
        self.groq_model = "llama-3.3-70b-versatile"

    def generate(
        self,
        emergency_type: str,
        language: str = "hi",
        severity: str = "critical",
    ) -> str:
        """
        Generate voice-optimized first-aid guidance.
        Tries Groq → Gemini → static fallback.
        """
        lang_label = {"hi": "Hindi", "mr": "Marathi", "en": "English"}.get(language, "Hindi")
        prompt = (
            f"Emergency: {emergency_type}\n"
            f"Severity: {severity}\n"
            f"Language: {lang_label}\n\n"
            "Generate calm, clear first-aid instructions in the specified language."
        )

        result = self._try_groq(prompt)
        if result:
            return result

        logger.warning("Groq guidance failed — trying Gemini")
        result = self._try_gemini(prompt)
        if result:
            return result

        logger.error("Both AI providers failed — using static script")
        return self._fallback(emergency_type, language)

    # ── Groq ──────────────────────────────────────────────────────────────────

    def _try_groq(self, prompt: str) -> str | None:
        if not self.groq_key:
            return None
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
                    "max_tokens":  400,
                    "temperature": 0.3,
                },
                timeout=8,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
            logger.info(f"Groq guidance: {text[:80]}...")
            return text
        except Exception as e:
            logger.error(f"Groq guidance error: {e}")
            return None

    # ── Gemini ────────────────────────────────────────────────────────────────

    def _try_gemini(self, prompt: str) -> str | None:
        if not self.gemini_key:
            return None
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-1.5-flash:generateContent?key={self.gemini_key}"
            )
            full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
            resp = requests.post(
                url,
                json={"contents": [{"parts": [{"text": full_prompt}]}]},
                timeout=10,
            )
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            logger.info(f"Gemini guidance: {text[:80]}...")
            return text
        except Exception as e:
            logger.error(f"Gemini guidance error: {e}")
            return None

    # ── Static fallback ───────────────────────────────────────────────────────

    def _fallback(self, emergency_type: str, language: str) -> str:
        lang_scripts = FALLBACK_GUIDANCE.get(language, FALLBACK_GUIDANCE["hi"])
        return lang_scripts.get(
            emergency_type,
            lang_scripts.get(
                "cardiac_arrest",
                "Please call 108 immediately. Keep the patient calm and still.",
            ),
        )
