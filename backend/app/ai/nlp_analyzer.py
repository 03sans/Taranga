import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except BaseException:
    # Fallback if download failed
    import os
    import sys
    os.system(f"{sys.executable} -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Define target keywords for each LD
LD_KEYWORDS = {
    "dyslexia": ["read", "spell", "slow", "struggle", "reverse", "letter", "word", "aloud"],
    "dyscalculia": ["math", "number", "calculate", "time", "count", "logic", "sequence"],
    "dysgraphia": ["write", "messy", "grip", "space", "handwriting", "pencil", "draw"],
    "nvld": ["social", "cue", "routine", "clumsy", "awkward", "rigid", "interaction"],
    "apd": ["noise", "listen", "hear", "instruction", "focus", "sound", "distract"]
}

def analyze_observation_notes(text: str):
    """
    Analyzes teacher notes to extract potential indicators of learning difficulties.
    Returns a dictionary of potential flags.
    """
    doc = nlp(text.lower())
    
    # Extract lemmas from text
    lemmas = [token.lemma_ for token in doc if not token.is_stop and token.is_alpha]
    
    flags = {key: 0 for key in LD_KEYWORDS.keys()}
    found_keywords = {key: [] for key in LD_KEYWORDS.keys()}
    
    for lemma in lemmas:
        for ld_type, keywords in LD_KEYWORDS.items():
            if lemma in keywords:
                flags[ld_type] += 1
                if lemma not in found_keywords[ld_type]:
                    found_keywords[ld_type].append(lemma)
                    
    # Generate a summary based on flags
    detected_lds = [ld for ld, count in flags.items() if count > 0]
    
    return {
        "detected_indicators": detected_lds,
        "keyword_matches": found_keywords,
        "flag_counts": flags,
        "analyzed_text_length": len(text)
    }

# Quick test if run directly
if __name__ == "__main__":
    test_note = "The student struggles to read aloud and her handwriting is consistently messy. She reverses letters sometimes."
    print("Testing NLP Analyzer with note:", test_note)
    print("Results:", analyze_observation_notes(test_note))
