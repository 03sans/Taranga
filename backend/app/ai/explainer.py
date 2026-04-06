"""
SHAP-based explainer for the LD screening model.

Provides:
  - predict_with_explanation(feature_dict) → scores + SHAP top features
  - generate_narrative(student_name, ld, probability, top_features) → human text
"""

import os
import joblib
import shap
import pandas as pd

# ── Feature names (must match training order) ───────────────────────────────
FEATURE_NAMES = [
    "q1_reading_pace", "q2_spelling_errors", "q3_letter_reversal", "q4_phonological",
    "q5_math_operations", "q6_number_memory", "q7_time_concept", "q8_counting_patterns",
    "q9_writing_quality", "q10_pencil_grip", "q11_word_spacing", "q12_copying_accuracy",
    "q13_social_cues", "q14_spatial_reasoning", "q15_routine_flexibility", "q16_nonverbal_comprehension",
    "q17_background_noise", "q18_verbal_instructions", "q19_sound_discrimination", "q20_listening_retention",
]

LABEL_NAMES = ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]

# Human-readable feature descriptions (for narrative generation)
FEATURE_LABELS: dict[str, str] = {
    "q1_reading_pace":            "slow reading pace",
    "q2_spelling_errors":         "frequent spelling errors",
    "q3_letter_reversal":         "letter/number reversals (b/d, p/q)",
    "q4_phonological":            "phonological awareness difficulties",
    "q5_math_operations":         "difficulty with basic arithmetic",
    "q6_number_memory":           "poor number memory",
    "q7_time_concept":            "confusion with time and sequencing",
    "q8_counting_patterns":       "difficulty with counting patterns",
    "q9_writing_quality":         "poor handwriting legibility",
    "q10_pencil_grip":            "awkward pencil grip or excessive pressure",
    "q11_word_spacing":           "inconsistent word/letter spacing",
    "q12_copying_accuracy":       "errors when copying text",
    "q13_social_cues":            "difficulty reading social cues",
    "q14_spatial_reasoning":      "weak spatial reasoning",
    "q15_routine_flexibility":    "distress when routines change",
    "q16_nonverbal_comprehension":"difficulty understanding non-verbal information",
    "q17_background_noise":       "distraction by background noise",
    "q18_verbal_instructions":    "difficulty following verbal instructions",
    "q19_sound_discrimination":   "confusion between similar sounds",
    "q20_listening_retention":    "poor verbal memory/retention",
}

LD_FULL_NAMES = {
    "dyslexia":    "Dyslexia",
    "dyscalculia": "Dyscalculia",
    "dysgraphia":  "Dysgraphia",
    "nvld":        "Non-Verbal Learning Disorder (NVLD)",
    "apd":         "Auditory Processing Disorder (APD)",
}

# ── Load model ──────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "ml_model.joblib")

try:
    ml_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
except Exception:
    ml_model = None


# ── Main prediction + explanation function ──────────────────────────────────
def predict_with_explanation(feature_dict: dict) -> dict:
    """
    Given a dict of {feature_key: score (1–5)}, returns:
      {
        "scores": {"dyslexia": 0.82, ...},
        "explanations": {
          "dyslexia": {
            "probability": 0.82,
            "top_factors": [
              {"feature": "q3_letter_reversal", "label": "letter/number reversals", "impact": 0.18},
              ...
            ],
            "narrative": "The student's responses suggest a 82% likelihood of Dyslexia ..."
          },
          ...
        }
      }
    """
    if ml_model is None:
        return {"error": "Model not loaded. Run model_trainer.py first."}

    df = pd.DataFrame([feature_dict], columns=FEATURE_NAMES)

    # Per-label probability (MultiOutputClassifier returns list of arrays)
    raw_proba = ml_model.predict_proba(df)
    scores = {
        LABEL_NAMES[i]: round(float(raw_proba[i][0][1]), 4)
        for i in range(len(LABEL_NAMES))
    }

    explanations = {}
    for i, ld in enumerate(LABEL_NAMES):
        clf = ml_model.estimators_[i]
        explainer = shap.TreeExplainer(clf)
        shap_values = explainer.shap_values(df)

        # Handle both list-format and array-format SHAP outputs
        if isinstance(shap_values, list):
            sv = shap_values[1][0]          # positive class
        else:
            sv = shap_values[0, :, 1] if len(shap_values.shape) > 2 else shap_values[0]

        # Pair features with SHAP impact scores, sort by absolute impact
        impacts = sorted(
            zip(FEATURE_NAMES, sv),
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        top_factors = [
            {
                "feature": f,
                "label":   FEATURE_LABELS.get(f, f),
                "impact":  round(float(v), 4),
            }
            for f, v in impacts[:4]   # top 4 driving features
            if abs(v) > 0.001
        ]

        prob = scores[ld]
        narrative = generate_narrative(ld, prob, top_factors)

        explanations[ld] = {
            "probability":  prob,
            "top_factors":  top_factors,
            "narrative":    narrative,
        }

    return {"scores": scores, "explanations": explanations}


# ── Narrative text generator ─────────────────────────────────────────────────
def generate_narrative(ld: str, probability: float, top_factors: list[dict]) -> str:
    """
    Generate a human-readable explanation sentence for a given LD and probability.

    Examples:
      "Responses suggest a high likelihood (82%) of Dyslexia. The strongest
       indicators were letter/number reversals, slow reading pace, and poor
       phonological awareness."
    """
    pct = round(probability * 100)
    full_name = LD_FULL_NAMES.get(ld, ld.title())

    if pct >= 70:
        likelihood = "a high likelihood"
        action = "A formal evaluation by a specialist is strongly recommended."
    elif pct >= 45:
        likelihood = "a moderate likelihood"
        action = "Closer monitoring and targeted support are advised."
    elif pct >= 25:
        likelihood = "a low-to-moderate likelihood"
        action = "Continue to monitor and consider follow-up observation."
    else:
        likelihood = "a low likelihood"
        action = "No immediate concern, but continue routine monitoring."

    if top_factors:
        factor_labels = [f["label"] for f in top_factors[:3]]
        if len(factor_labels) == 1:
            factor_str = factor_labels[0]
        elif len(factor_labels) == 2:
            factor_str = f"{factor_labels[0]} and {factor_labels[1]}"
        else:
            factor_str = f"{', '.join(factor_labels[:-1])}, and {factor_labels[-1]}"
        indicator_sentence = f" The primary indicators were: {factor_str}."
    else:
        indicator_sentence = ""

    return (
        f"The screening responses suggest {likelihood} ({pct}%) of {full_name}.{indicator_sentence} {action}"
    )


# ── CLI self-test ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_features = {
        "q1_reading_pace": 5, "q2_spelling_errors": 5, "q3_letter_reversal": 5,
        "q4_phonological": 4,
        "q5_math_operations": 1, "q6_number_memory": 1, "q7_time_concept": 2,
        "q8_counting_patterns": 1,
        "q9_writing_quality": 4, "q10_pencil_grip": 4, "q11_word_spacing": 3,
        "q12_copying_accuracy": 3,
        "q13_social_cues": 1, "q14_spatial_reasoning": 1, "q15_routine_flexibility": 1,
        "q16_nonverbal_comprehension": 1,
        "q17_background_noise": 1, "q18_verbal_instructions": 1, "q19_sound_discrimination": 1,
        "q20_listening_retention": 1,
    }
    result = predict_with_explanation(test_features)
    for ld, exp in result["explanations"].items():
        print(f"\n{ld.upper()} — {exp['probability']*100:.0f}%")
        print(f"  {exp['narrative']}")
        for f in exp["top_factors"]:
            print(f"    • {f['label']}: {f['impact']:+.3f}")
