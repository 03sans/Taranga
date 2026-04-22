import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, multilabel_confusion_matrix, hamming_loss
import os

# Constants from training
FEATURE_COLS = [
    "q1_reading_pace", "q2_spelling_errors", "q3_letter_reversal", "q4_phonological",
    "q5_math_operations", "q6_number_memory", "q7_time_concept", "q8_counting_patterns",
    "q9_writing_quality", "q10_pencil_grip", "q11_word_spacing", "q12_copying_accuracy",
    "q13_social_cues", "q14_spatial_reasoning", "q15_routine_flexibility", "q16_nonverbal_comprehension",
    "q17_background_noise", "q18_verbal_instructions", "q19_sound_discrimination", "q20_listening_retention",
]
LABEL_COLS = ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]

def run_evaluation():
    model_path = "app/ai/models/ml_model.joblib"
    data_path = "data/synthetic_dataset.csv"

    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
    if not os.path.exists(data_path):
        print(f"Error: Data not found at {data_path}")
        return

    # Load model and data
    model = joblib.load(model_path)
    df = pd.read_csv(data_path)

    X = df[FEATURE_COLS]
    y_true = df[LABEL_COLS]
    y_pred = model.predict(X)

    # 1. Classification Report
    report = classification_report(y_true, y_pred, target_names=LABEL_COLS, output_dict=True, zero_division=0)
    
    print("# AI Model Evaluation Metrics\n")
    print("## Classification Report")
    print("| Domain | Precision | Recall | F1-Score | Support |")
    print("| :--- | :--- | :--- | :--- | :--- |")
    for label in LABEL_COLS:
        metrics = report[label]
        print(f"| {label.capitalize()} | {metrics['precision']:.3f} | {metrics['recall']:.3f} | {metrics['f1-score']:.3f} | {int(metrics['support'])} |")
    
    print(f"\n**Global Hamming Loss**: {hamming_loss(y_true, y_pred):.4f}\n")

    # 2. Confusion Matrices
    print("## Binary Confusion Matrices")
    mcm = multilabel_confusion_matrix(y_true, y_pred)
    
    for i, label in enumerate(LABEL_COLS):
        matrix = mcm[i]
        tn, fp, fn, tp = matrix.ravel()
        print(f"\n### {label.capitalize()}")
        print("| | Predicted Negative | Predicted Positive |")
        print("| :--- | :--- | :--- |")
        print(f"| **Actual Negative** | {tn} (TN) | {fp} (FP) |")
        print(f"| **Actual Positive** | {fn} (FN) | {tp} (TP) |")

if __name__ == "__main__":
    run_evaluation()
