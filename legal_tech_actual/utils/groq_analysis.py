import json
import re
import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")
client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """
You are a world-class AI legal analyst specializing in contract review for startups, freelancers, and small businesses.
You must analyze the provided contract text and return a comprehensive JSON analysis.

STRICT OUTPUT FORMAT — return ONLY this JSON, no markdown, no extra text:
{
  "is_legal_document": <boolean, true if the text is a legal contract/agreement, false otherwise>,
  "summary": "<4-6 sentence plain English overview. IF is_legal_document is false, explain politely that this is not a legal document and you cannot analyze it.>",
  "contract_type": "<e.g. Service Agreement, NDA, etc. OR 'Non-Legal' if applicable>",
  "parties": ["<Party 1 name and role>", "<Party 2 name and role>"],
  "risk_score": <integer 1-10, where 10 is highest risk. Set to 0 if not a legal document.>,
  "risk_summary": "<2-3 sentence explanation of the overall risk level.>",
  "risky_clauses": [
    {
      "title": "<Short title>",
      "clause": "<Quote>",
      "severity": "<High|Medium|Low>",
      "reason": "<Explanation>"
    }
  ],
  "key_obligations": ["<Obligation>"],
  "recommendations": ["<Suggestion>"],
  "deadlines": ["<Timeline>"],
  "missing_protections": ["<Missing Clause>"],
  "favorable_clauses": ["<Fair Clause>"]
}

Rules:
- CRITICAL: If the provided text is NOT a legal contract, agreement, or document with legal implications (e.g., it is a grocery list, a story, a personal letter, math problems, code, or nonsense), you MUST set 'is_legal_document' to false and provide a polite rejection message in the 'summary' field. Set all other lists to [] and risk_score to 0.
- Provide at least 3-5 risky_clauses, 3-5 recommendations, 2-4 key_obligations, 2-4 missing_protections if it is a legal document.
- Be as specific as possible. Quote actual text from the contract where possible.
- If something is not present in the contract, write "Not specified in the contract" for that field.
- VERY IMPORTANT FOR RISK SCORE: Calculate the risk_score (1-10) dynamically based on the severity and frequency of the risky clauses found.
  * 1-3 = Low Risk (Standard, well-balanced contract with minor or no risky clauses)
  * 4-6 = Medium Risk (Slightly one-sided, missing standard protections, or containing a few medium severity risky clauses)
  * 7-10 = High Risk (Highly one-sided, draconian clauses, unlimited liability, highly unfair terms, multiple high-severity risky clauses)
- Do NOT just default to 8. Read the contract and assign an accurate score.
"""

def analyze_contract(text: str) -> dict:
    """Analyzes contract text with LLaMA via Groq and returns structured JSON."""
    
    # Truncate to safe token range (~12000 chars ≈ 3000 tokens for 8k context window)
    truncated_text = text[:12000]
    if len(text) > 12000:
        truncated_text += "\n\n[Note: Document was truncated for analysis. Additional content may not be reflected above.]"

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this contract:\n\n{truncated_text}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.15,
            response_format={"type": "json_object"},
            max_tokens=4096,
        )

        raw = response.choices[0].message.content
        
        # Strip markdown fences just in case
        raw = re.sub(r"^```json\s*", "", raw.strip())
        raw = re.sub(r"```\s*$", "", raw.strip())

        result = json.loads(raw)
        
        # Ensure all required keys exist with fallback defaults
        defaults = {
            "is_legal_document": True,
            "summary": "Summary not available.",
            "contract_type": "Unknown",
            "parties": [],
            "risk_score": 0,
            "risk_summary": "Risk summary not available.",
            "risky_clauses": [],
            "key_obligations": [],
            "recommendations": [],
            "deadlines": [],
            "missing_protections": [],
            "favorable_clauses": [],
        }
        for key, default in defaults.items():
            if key not in result:
                result[key] = default

        return result

    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON. Raw output: {raw[:200]}")
    except Exception as e:
        raise Exception(f"Groq API error during analysis: {str(e)}")
