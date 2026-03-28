import joblib
import os
import shap
import pandas as pd
import numpy as np

# Load model globally to save time in API calls
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/ml_model.joblib')

try:
    if os.path.exists(MODEL_PATH):
        ml_model = joblib.load(MODEL_PATH)
    else:
        ml_model = None
except BaseException:
    ml_model = None

# We trained a MultiOutputClassifier(RandomForestClassifier)
# Feature columns from our synthesizer
FEATURE_NAMES = [
    'q1_reading_slow', 'q2_spelling_errors', 'q3_letter_reversal',
    'q4_math_struggle', 'q5_number_memory', 'q6_time_concept',
    'q7_messy_writing', 'q8_pencil_grip', 'q9_spacing_words',
    'q10_social_cues', 'q11_spatial_tasks', 'q12_routine_change',
    'q13_background_noise', 'q14_verbal_instructions', 'q15_similar_sounds'
]
LABEL_NAMES = ['dyslexia', 'dyscalculia', 'dysgraphia', 'nvld', 'apd']

def explain_prediction(features_dict: dict):
    """
    Takes a single row of features (a screening response dictionary) and returns
    the predictions along with the top contributing features (SHAP values).
    """
    if not ml_model:
        return {"error": "Model not loaded"}
        
    # Convert dictionary to DataFrame for predicting
    df_features = pd.DataFrame([features_dict], columns=FEATURE_NAMES)
    
    predictions = ml_model.predict_proba(df_features)
    
    # predict_proba returns a list of arrays (one for each label in MultiOutputClassifier)
    prob_scores = {
        LABEL_NAMES[i]: round(predictions[i][0][1], 2) # probability of class 1
        for i in range(len(LABEL_NAMES))
    }
    
    explanations = {}
    
    # Generate SHAP explanations for each label independently since it's a MultiOutputClassifier
    for i, label in enumerate(LABEL_NAMES):
        clf = ml_model.estimators_[i]
        
        # Use TreeExplainer for Random Forest
        explainer = shap.TreeExplainer(clf)
        # expected shape is (1, num_features, multi_class_outputs)
        shap_values = explainer.shap_values(df_features)
        
        # For a binary random forest, shap_values is typically a list of two arrays [class 0, class 1]
        # or a single 3D array (if tree structure is different depending on shap version). 
        # Usually it's shap_values[1] for positive class.
        if isinstance(shap_values, list):
            sv_positive = shap_values[1][0]
        else:
            sv_positive = shap_values[0, :, 1] if len(shap_values.shape) > 2 else shap_values[0]
            
        # Pair feature names with their SHAP values
        feature_impacts = list(zip(FEATURE_NAMES, sv_positive))
        
        # Sort by absolute impact (highest first)
        feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Get top 3 driving features
        top_features = [{"feature": f[0], "impact_score": round(f[1], 3)} for f in feature_impacts[:3]]
        
        explanations[label] = {
            "prediction_probability": prob_scores[label],
            "top_contributing_features": top_features
        }
        
    return explanations

# Quick Test
if __name__ == "__main__":
    test_features = {
        'q1_reading_slow': 5, 'q2_spelling_errors': 4, 'q3_letter_reversal': 5,
        'q4_math_struggle': 1, 'q5_number_memory': 2, 'q6_time_concept': 1,
        'q7_messy_writing': 4, 'q8_pencil_grip': 5, 'q9_spacing_words': 3,
        'q10_social_cues': 1, 'q11_spatial_tasks': 1, 'q12_routine_change': 2,
        'q13_background_noise': 1, 'q14_verbal_instructions': 1, 'q15_similar_sounds': 2
    }
    print("Testing SHAP Explainer...")
    res = explain_prediction(test_features)
    for ld, explanation in res.items():
        print(f"\n{ld.upper()}: {explanation['prediction_probability']*100}% likely")
        for f in explanation['top_contributing_features']:
            print(f"  - {f['feature']}: {f['impact_score']}")
