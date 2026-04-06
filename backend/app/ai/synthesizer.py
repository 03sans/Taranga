import pandas as pd
import numpy as np
import os

np.random.seed(42)


def generate_synthetic_data(num_samples: int = 3000):
    """
    Generate a synthetic LD screening dataset with 20 features (4 per LD).

    Features:
      Dyslexia    (q1–q4):  reading_pace, spelling_errors, letter_reversal, phonological
      Dyscalculia (q5–q8):  math_operations, number_memory, time_concept, counting_patterns
      Dysgraphia  (q9–q12): writing_quality, pencil_grip, word_spacing, copying_accuracy
      NVLD        (q13–q16):social_cues, spatial_reasoning, routine_flexibility, nonverbal_comp
      APD         (q17–q20):background_noise, verbal_instructions, sound_discrimination, listening_retention

    All features are scored 1–5 (1=never, 5=always/severely).
    Labels are binary (0/1) per LD.
    Comorbidity patterns modelled:
      - Dyslexia ↔ Dysgraphia: 45% co-occurrence
      - Dyscalculia ↔ NVLD:    30% co-occurrence
      - Dyslexia ↔ APD:        25% co-occurrence
    """

    data = []

    # Realistic prevalence rates (slightly higher than population for pre-screening context)
    PREV = {
        "dyslexia":    0.18,
        "dyscalculia": 0.12,
        "dysgraphia":  0.10,
        "nvld":        0.08,
        "apd":         0.10,
    }

    for _ in range(num_samples):
        # ── Primary LD assignments ─────────────────────────────────────────
        is_dyslexia    = np.random.rand() < PREV["dyslexia"]
        is_dyscalculia = np.random.rand() < PREV["dyscalculia"]
        is_dysgraphia  = np.random.rand() < PREV["dysgraphia"]
        is_nvld        = np.random.rand() < PREV["nvld"]
        is_apd         = np.random.rand() < PREV["apd"]

        # ── Comorbidity patterns ──────────────────────────────────────────
        if is_dyslexia and np.random.rand() < 0.45:
            is_dysgraphia = True           # dyslexia → dysgraphia overlap
        if is_dyslexia and np.random.rand() < 0.25:
            is_apd = True                  # dyslexia → APD overlap
        if is_dyscalculia and np.random.rand() < 0.30:
            is_nvld = True                 # dyscalculia → NVLD overlap

        # ── Helper: generate score ─────────────────────────────────────────
        def score(has_ld: bool, low=(1, 4), high=(3, 6)) -> int:
            """High score = more severe indicator."""
            return int(np.random.randint(*high)) if has_ld else int(np.random.randint(*low))

        row = {
            # Dyslexia features ──────────────────────────────────
            "q1_reading_pace":    score(is_dyslexia),
            "q2_spelling_errors": score(is_dyslexia),
            "q3_letter_reversal": score(is_dyslexia, low=(1, 3), high=(3, 6)),
            "q4_phonological":    score(is_dyslexia),

            # Dyscalculia features ───────────────────────────────
            "q5_math_operations":   score(is_dyscalculia),
            "q6_number_memory":     score(is_dyscalculia),
            "q7_time_concept":      score(is_dyscalculia, low=(1, 3), high=(3, 6)),
            "q8_counting_patterns": score(is_dyscalculia),

            # Dysgraphia features ────────────────────────────────
            "q9_writing_quality":    score(is_dysgraphia),
            "q10_pencil_grip":       score(is_dysgraphia),
            "q11_word_spacing":      score(is_dysgraphia, low=(1, 3), high=(3, 6)),
            "q12_copying_accuracy":  score(is_dysgraphia),

            # NVLD features ──────────────────────────────────────
            "q13_social_cues":            score(is_nvld),
            "q14_spatial_reasoning":      score(is_nvld),
            "q15_routine_flexibility":    score(is_nvld, low=(1, 3), high=(3, 6)),
            "q16_nonverbal_comprehension":score(is_nvld),

            # APD features ───────────────────────────────────────
            "q17_background_noise":       score(is_apd),
            "q18_verbal_instructions":    score(is_apd),
            "q19_sound_discrimination":   score(is_apd, low=(1, 3), high=(3, 6)),
            "q20_listening_retention":    score(is_apd),

            # Labels
            "dyslexia":    int(is_dyslexia),
            "dyscalculia": int(is_dyscalculia),
            "dysgraphia":  int(is_dysgraphia),
            "nvld":        int(is_nvld),
            "apd":         int(is_apd),
        }

        data.append(row)

    df = pd.DataFrame(data)

    os.makedirs("data", exist_ok=True)
    df.to_csv("data/synthetic_dataset.csv", index=False)

    total = len(df)
    print(f"✅ Generated {total} samples → data/synthetic_dataset.csv")
    print("\nLabel distribution:")
    for ld in ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]:
        n = df[ld].sum()
        print(f"  {ld:<20}: {n:4d} positive  ({n/total*100:.1f}%)")


if __name__ == "__main__":
    generate_synthetic_data(3000)
