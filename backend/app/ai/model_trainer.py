import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, hamming_loss
import joblib
import os

FEATURE_COLS = [
    "q1_reading_pace", "q2_spelling_errors", "q3_letter_reversal", "q4_phonological",
    "q5_math_operations", "q6_number_memory", "q7_time_concept", "q8_counting_patterns",
    "q9_writing_quality", "q10_pencil_grip", "q11_word_spacing", "q12_copying_accuracy",
    "q13_social_cues", "q14_spatial_reasoning", "q15_routine_flexibility", "q16_nonverbal_comprehension",
    "q17_background_noise", "q18_verbal_instructions", "q19_sound_discrimination", "q20_listening_retention",
]
LABEL_COLS = ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]


def train_model(data_path: str = "data/synthetic_dataset.csv"):
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Run synthesizer.py first.")
        return

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} samples, {len(FEATURE_COLS)} features.")

    X = df[FEATURE_COLS]
    y = df[LABEL_COLS]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ── Train RandomForest ───────────────────────────────────────────────
    print("\nTraining RandomForest (200 trees)...")
    rf = MultiOutputClassifier(
        RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        ),
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    rf_hl    = hamming_loss(y_test, rf_preds)
    print(f"  Hamming Loss: {rf_hl:.4f}")

    # ── Train GradientBoosting ───────────────────────────────────────────
    print("\nTraining GradientBoosting (200 estimators)...")
    gb = MultiOutputClassifier(
        GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=4,
            random_state=42,
        )
    )
    gb.fit(X_train, y_train)
    gb_preds = gb.predict(X_test)
    gb_hl    = hamming_loss(y_test, gb_preds)
    print(f"  Hamming Loss: {gb_hl:.4f}")

    # ── Pick winner ──────────────────────────────────────────────────────
    best_model, best_name = (rf, "RandomForest") if rf_hl <= gb_hl else (gb, "GradientBoosting")
    best_preds = rf_preds if rf_hl <= gb_hl else gb_preds
    print(f"\n✅ Best model: {best_name} (Hamming Loss: {min(rf_hl, gb_hl):.4f})")

    print("\nClassification Report:")
    print(classification_report(y_test, best_preds, target_names=LABEL_COLS, zero_division=0))

    # ── Save ─────────────────────────────────────────────────────────────
    os.makedirs("app/ai/models", exist_ok=True)
    model_path = "app/ai/models/ml_model.joblib"
    joblib.dump(best_model, model_path)
    print(f"\nModel saved → {model_path}")


if __name__ == "__main__":
    train_model()
