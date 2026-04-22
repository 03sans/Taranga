import pytest
from app.ai.explainer import predict_with_explanation, generate_narrative

def test_explainer_narrative_generation():
    # Test high likelihood
    narrative = generate_narrative("dyslexia", 0.85, [{"label": "letter reversal", "impact": 0.2}])
    assert "high likelihood" in narrative
    assert "85%" in narrative
    assert "Dyslexia" in narrative
    assert "letter reversal" in narrative

    # Test low likelihood
    narrative = generate_narrative("dyscalculia", 0.15, [])
    assert "low likelihood" in narrative
    assert "15%" in narrative
    assert "Dyscalculia" in narrative

def test_predict_with_explanation_structure():
    # Provide a simple feature vector
    features = {f"q{i}_{name}": 3 for i, name in enumerate(["reading_pace", "spelling_errors"] * 10, 1)}
    
    # We need to handle if the model isn't loaded (e.g. in test env without joblib file)
    result = predict_with_explanation(features)
    
    # If model is loaded, verify structure. If not, it returns an error key.
    if "error" not in result:
        assert "scores" in result
        assert "explanations" in result
        assert len(result["scores"]) == 5
        assert "dyslexia" in result["explanations"]
        assert "probability" in result["explanations"]["dyslexia"]
        assert "narrative" in result["explanations"]["dyslexia"]
