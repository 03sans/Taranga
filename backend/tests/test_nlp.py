import pytest
from app.ai.nlp_analyzer import analyze_observation_notes

def test_nlp_dyslexia_detection():
    text = "The student struggles to read aloud and sometimes reverses letters like b and d."
    results = analyze_observation_notes(text)
    assert "dyslexia" in results["detected_indicators"]
    assert results["flag_counts"]["dyslexia"] >= 2
    assert "read" in results["keyword_matches"]["dyslexia"]
    assert "reverse" in results["keyword_matches"]["dyslexia"]

def test_nlp_multiple_detection():
    text = "Handwriting is very messy and pencil grip is awkward. Also finds basic math very difficult."
    results = analyze_observation_notes(text)
    assert "dysgraphia" in results["detected_indicators"]
    assert "dyscalculia" in results["detected_indicators"]
    assert "write" in results["keyword_matches"]["dysgraphia"] or "messy" in results["keyword_matches"]["dysgraphia"]
    assert "math" in results["keyword_matches"]["dyscalculia"]

def test_nlp_no_indicators():
    text = "The student is doing well in class and participates actively in all group discussions."
    results = analyze_observation_notes(text)
    assert len(results["detected_indicators"]) == 0
    assert all(count == 0 for count in results["flag_counts"].values())

def test_nlp_empty_text():
    results = analyze_observation_notes("")
    assert len(results["detected_indicators"]) == 0
    assert results["analyzed_text_length"] == 0
