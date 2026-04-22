import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except BaseException:
    # Fallback if download failed
    import os
    import sys
    os.system(f"{sys.executable} -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Define target keywords with weights for each LD
# Weight 1: Weak/Generic, Weight 2: Medium/Domain, Weight 3: Strong/Pathognomonic
LD_KEYWORDS = {
    "dyslexia": {
        "reverse": 3, "phonological": 3, "decode": 3, "letter": 2, "word": 2, 
        "aloud": 2, "spell": 2, "read": 2, "struggle": 1, "slow": 1, "pace": 1
    },
    "dyscalculia": {
        "arithmetic": 3, "digit": 3, "calculate": 3, "math": 2, "number": 2, 
        "count": 2, "time": 2, "sequence": 2, "formula": 1, "logic": 1
    },
    "dysgraphia": {
        "letter formation": 3, "pencil grip": 3, "tracing": 3, "handwriting": 2, 
        "messy": 2, "pencil": 2, "write": 2, "space": 2, "grip": 2, "draw": 1
    },
    "nvld": {
        "social cue": 3, "spatial": 3, "body language": 3, "clumsy": 2, 
        "awkward": 2, "routine": 2, "cue": 2, "social": 2, "interaction": 2, "rigid": 1
    },
    "apd": {
        "sound discrimination": 3, "auditory": 3, "background noise": 3, 
        "noise": 2, "listen": 2, "hear": 2, "instruction": 2, "sound": 2, "distract": 1, "focus": 1
    }
}

NEGATION_WORDS = {"no", "not", "never", "without", "hardly", "none", "unable"}

def analyze_observation_notes(text: str):
    """
    Analyzes teacher notes using weighted keywords and negation detection.
    """
    doc = nlp(text.lower())
    
    # Track results
    scores = {key: 0.0 for key in LD_KEYWORDS.keys()}
    flag_counts = {key: 0 for key in LD_KEYWORDS.keys()}
    found_keywords = {key: [] for key in LD_KEYWORDS.keys()}
    
    # Process tokens
    tokens = [t for t in doc]
    
    for i, token in enumerate(tokens):
        # We check both the token text and its lemma
        val = token.text
        lemma = token.lemma_
        
        for ld_type, keywords in LD_KEYWORDS.items():
            # Check if this token (or lemma) matches any keyword
            for kw, weight in keywords.items():
                if kw == val or kw == lemma:
                    # Check for negation in a 3-word window preceding this token
                    is_negated = False
                    start_look = max(0, i - 3)
                    for j in range(start_look, i):
                        if tokens[j].text in NEGATION_WORDS:
                            is_negated = True
                            break
                    
                    if not is_negated:
                        flag_counts[ld_type] += 1
                        scores[ld_type] += weight
                        if kw not in found_keywords[ld_type]:
                            found_keywords[ld_type].append(kw)
    
    # Normalize scores to 0-100 range (capped)
    # A score of 10.0 (e.g. 3 strong matches + 1 medium) ~ 90% confidence
    final_probabilities = {}
    for ld, total_weight in scores.items():
        prob = min(total_weight * 10, 95.0)  # Sensitivity cap
        final_probabilities[ld] = prob

    detected_lds = [ld for ld, prob in final_probabilities.items() if prob >= 20.0]
    
    return {
        "detected_indicators": detected_lds,
        "keyword_matches": found_keywords,
        "flag_counts": flag_counts,
        "probabilities": final_probabilities,
        "analyzed_text_length": len(text)
    }

if __name__ == "__main__":
    # Test cases
    test_positive = "The student reverses letters and struggles with reading. Also has very messy handwriting."
    test_negation = "The student has no math problems and does not struggle with numbers."
    
    print("--- Testing Positive Case ---")
    print(analyze_observation_notes(test_positive))
    
    print("\n--- Testing Negation Case ---")
    print(analyze_observation_notes(test_negation))
