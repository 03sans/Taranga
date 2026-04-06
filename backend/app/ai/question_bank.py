"""
Question bank for the adaptive LD screening.

Structure:
  - 60 questions total: 12 per LD domain, 4 per tier
  - tier 1: Gateway — broad, one per domain, shown to every student
  - tier 2: Deep-dive — targeted, shown when suspicion is high
  - tier 3: Confirmatory — mild, shown when suspicion is low

Each question maps 1:1 to one of the 20 model features.
Answer scale: 1 = Never, 2 = Rarely, 3 = Sometimes, 4 = Often, 5 = Always

IMPORTANT: Questions are in teacher-observation voice
("the student…" / "this student…").
"""

ANSWER_SCALE = [
    "Never",
    "Rarely",
    "Sometimes",
    "Often",
    "Always / Severely",
]

# Domain colour codes (used by the frontend)
DOMAIN_META = {
    "dyslexia":    {"label": "Dyslexia",    "color": "#6366F1", "emoji": "📖"},
    "dyscalculia": {"label": "Dyscalculia", "color": "#F59E0B", "emoji": "🔢"},
    "dysgraphia":  {"label": "Dysgraphia",  "color": "#10B981", "emoji": "✏️"},
    "nvld":        {"label": "NVLD",        "color": "#8B5CF6", "emoji": "🧩"},
    "apd":         {"label": "APD",         "color": "#EF4444", "emoji": "👂"},
}

QUESTIONS = [
    # ═══════════════════════════════════════════════════════════════════
    # DYSLEXIA  (features: q1–q4)
    # ═══════════════════════════════════════════════════════════════════

    # Tier 1 — Gateway
    {
        "id": "dy_t1_1", "domain": "dyslexia", "tier": 1,
        "feature": "q1_reading_pace",
        "text": "The student reads aloud noticeably slower than their classmates of the same age.",
    },

    # Tier 2 — Deep-dive
    {
        "id": "dy_t2_1", "domain": "dyslexia", "tier": 2,
        "feature": "q2_spelling_errors",
        "text": "The student makes frequent, consistent spelling mistakes that do not improve with standard instruction.",
    },
    {
        "id": "dy_t2_2", "domain": "dyslexia", "tier": 2,
        "feature": "q3_letter_reversal",
        "text": "The student confuses visually similar letters such as b/d, p/q, or writes them in reverse.",
    },
    {
        "id": "dy_t2_3", "domain": "dyslexia", "tier": 2,
        "feature": "q4_phonological",
        "text": "The student has difficulty identifying rhymes, blending sounds, or breaking words into syllables.",
    },

    # Tier 3 — Confirmatory
    {
        "id": "dy_t3_1", "domain": "dyslexia", "tier": 3,
        "feature": "q1_reading_pace",
        "text": "The student loses their place frequently when reading sentences or paragraphs.",
    },
    {
        "id": "dy_t3_2", "domain": "dyslexia", "tier": 3,
        "feature": "q2_spelling_errors",
        "text": "The student spells the same word differently within the same piece of writing.",
    },
    {
        "id": "dy_t3_3", "domain": "dyslexia", "tier": 3,
        "feature": "q3_letter_reversal",
        "text": "The student omits or adds letters/words when copying text from the board.",
    },
    {
        "id": "dy_t3_4", "domain": "dyslexia", "tier": 3,
        "feature": "q4_phonological",
        "text": "The student struggles to decode unfamiliar words by sounding them out.",
    },

    # Extra deep-dive (used to fill phase 2 slots for top-ranked dyslexia)
    {
        "id": "dy_t2_4", "domain": "dyslexia", "tier": 2,
        "feature": "q2_spelling_errors",
        "text": "Despite targeted spelling support, the student continues to make the same recurring errors.",
    },

    # ═══════════════════════════════════════════════════════════════════
    # DYSCALCULIA  (features: q5–q8)
    # ═══════════════════════════════════════════════════════════════════

    # Tier 1
    {
        "id": "dc_t1_1", "domain": "dyscalculia", "tier": 1,
        "feature": "q5_math_operations",
        "text": "The student struggles to perform basic arithmetic (addition, subtraction) compared to peers.",
    },

    # Tier 2
    {
        "id": "dc_t2_1", "domain": "dyscalculia", "tier": 2,
        "feature": "q6_number_memory",
        "text": "The student cannot reliably recall multi-digit numbers, phone numbers, or sequences.",
    },
    {
        "id": "dc_t2_2", "domain": "dyscalculia", "tier": 2,
        "feature": "q7_time_concept",
        "text": "The student has difficulty reading an analogue clock or understanding the sequence of days/months.",
    },
    {
        "id": "dc_t2_3", "domain": "dyscalculia", "tier": 2,
        "feature": "q8_counting_patterns",
        "text": "The student cannot reliably count on from a given number or skip-count (e.g., by 2s or 5s).",
    },

    # Tier 3
    {
        "id": "dc_t3_1", "domain": "dyscalculia", "tier": 3,
        "feature": "q5_math_operations",
        "text": "The student uses finger-counting for simple calculations that peers perform mentally.",
    },
    {
        "id": "dc_t3_2", "domain": "dyscalculia", "tier": 3,
        "feature": "q6_number_memory",
        "text": "The student confuses similar-looking numbers (e.g., 6/9, 17/71) frequently.",
    },
    {
        "id": "dc_t3_3", "domain": "dyscalculia", "tier": 3,
        "feature": "q7_time_concept",
        "text": "The student struggles to estimate how long a task will take or to plan using time.",
    },
    {
        "id": "dc_t3_4", "domain": "dyscalculia", "tier": 3,
        "feature": "q8_counting_patterns",
        "text": "The student has difficulty understanding mathematical patterns or sequences.",
    },
    {
        "id": "dc_t2_4", "domain": "dyscalculia", "tier": 2,
        "feature": "q5_math_operations",
        "text": "The student cannot reliably identify which of two numbers is larger.",
    },

    # ═══════════════════════════════════════════════════════════════════
    # DYSGRAPHIA  (features: q9–q12)
    # ═══════════════════════════════════════════════════════════════════

    # Tier 1
    {
        "id": "dg_t1_1", "domain": "dysgraphia", "tier": 1,
        "feature": "q9_writing_quality",
        "text": "The student's handwriting is consistently difficult to read, even when they are trying their best.",
    },

    # Tier 2
    {
        "id": "dg_t2_1", "domain": "dysgraphia", "tier": 2,
        "feature": "q10_pencil_grip",
        "text": "The student holds their pencil or pen in an unusual, awkward grip, or applies excessive pressure.",
    },
    {
        "id": "dg_t2_2", "domain": "dysgraphia", "tier": 2,
        "feature": "q11_word_spacing",
        "text": "The student's written work shows inconsistent spacing between words or letters.",
    },
    {
        "id": "dg_t2_3", "domain": "dysgraphia", "tier": 2,
        "feature": "q12_copying_accuracy",
        "text": "The student makes many errors when copying text from the board or a book.",
    },

    # Tier 3
    {
        "id": "dg_t3_1", "domain": "dysgraphia", "tier": 3,
        "feature": "q9_writing_quality",
        "text": "The student's letter sizes and shapes are highly inconsistent within the same piece of work.",
    },
    {
        "id": "dg_t3_2", "domain": "dysgraphia", "tier": 3,
        "feature": "q10_pencil_grip",
        "text": "The student frequently complains of hand or wrist pain when writing.",
    },
    {
        "id": "dg_t3_3", "domain": "dysgraphia", "tier": 3,
        "feature": "q11_word_spacing",
        "text": "The student writes letters outside the ruled lines or struggles to stay within margins.",
    },
    {
        "id": "dg_t3_4", "domain": "dysgraphia", "tier": 3,
        "feature": "q12_copying_accuracy",
        "text": "The student writes significantly slower than peers, leaving tasks unfinished.",
    },
    {
        "id": "dg_t2_4", "domain": "dysgraphia", "tier": 2,
        "feature": "q9_writing_quality",
        "text": "The student's oral answers are significantly better than their written work.",
    },

    # ═══════════════════════════════════════════════════════════════════
    # NVLD  (features: q13–q16)
    # ═══════════════════════════════════════════════════════════════════

    # Tier 1
    {
        "id": "nv_t1_1", "domain": "nvld", "tier": 1,
        "feature": "q13_social_cues",
        "text": "The student has difficulty reading non-verbal social cues such as facial expressions or body language.",
    },

    # Tier 2
    {
        "id": "nv_t2_1", "domain": "nvld", "tier": 2,
        "feature": "q14_spatial_reasoning",
        "text": "The student struggles with tasks requiring spatial reasoning, such as maps, puzzles, or geometry.",
    },
    {
        "id": "nv_t2_2", "domain": "nvld", "tier": 2,
        "feature": "q15_routine_flexibility",
        "text": "The student becomes noticeably distressed or disoriented when routines change unexpectedly.",
    },
    {
        "id": "nv_t2_3", "domain": "nvld", "tier": 2,
        "feature": "q16_nonverbal_comprehension",
        "text": "The student has difficulty inferring meaning from diagrams, charts, or pictures.",
    },

    # Tier 3
    {
        "id": "nv_t3_1", "domain": "nvld", "tier": 3,
        "feature": "q13_social_cues",
        "text": "The student takes jokes or sarcasm literally, missing the social intent.",
    },
    {
        "id": "nv_t3_2", "domain": "nvld", "tier": 3,
        "feature": "q14_spatial_reasoning",
        "text": "The student frequently gets lost navigating the school building or playground.",
    },
    {
        "id": "nv_t3_3", "domain": "nvld", "tier": 3,
        "feature": "q15_routine_flexibility",
        "text": "The student insists on rigid procedures for tasks and resists alternative approaches.",
    },
    {
        "id": "nv_t3_4", "domain": "nvld", "tier": 3,
        "feature": "q16_nonverbal_comprehension",
        "text": "The student struggles to understand visual instructions (e.g., diagrams in science or maths).",
    },
    {
        "id": "nv_t2_4", "domain": "nvld", "tier": 2,
        "feature": "q13_social_cues",
        "text": "The student has difficulty maintaining age-appropriate friendships or peer relationships.",
    },

    # ═══════════════════════════════════════════════════════════════════
    # APD  (features: q17–q20)
    # ═══════════════════════════════════════════════════════════════════

    # Tier 1
    {
        "id": "ap_t1_1", "domain": "apd", "tier": 1,
        "feature": "q17_background_noise",
        "text": "The student is easily distracted or overwhelmed by background noise compared to classmates.",
    },

    # Tier 2
    {
        "id": "ap_t2_1", "domain": "apd", "tier": 2,
        "feature": "q18_verbal_instructions",
        "text": "The student regularly fails to follow multi-step verbal instructions without written support.",
    },
    {
        "id": "ap_t2_2", "domain": "apd", "tier": 2,
        "feature": "q19_sound_discrimination",
        "text": "The student confuses words that sound similar (e.g., 'thin' / 'fin', 'bear' / 'pear').",
    },
    {
        "id": "ap_t2_3", "domain": "apd", "tier": 2,
        "feature": "q20_listening_retention",
        "text": "The student cannot recall information presented verbally, even seconds after hearing it.",
    },

    # Tier 3
    {
        "id": "ap_t3_1", "domain": "apd", "tier": 3,
        "feature": "q17_background_noise",
        "text": "The student frequently asks for instructions to be repeated in noisy environments.",
    },
    {
        "id": "ap_t3_2", "domain": "apd", "tier": 3,
        "feature": "q18_verbal_instructions",
        "text": "The student frequently responds with 'what?' or 'huh?' when spoken to clearly.",
    },
    {
        "id": "ap_t3_3", "domain": "apd", "tier": 3,
        "feature": "q19_sound_discrimination",
        "text": "The student mishears words in songs, stories, or class discussions in a predictable pattern.",
    },
    {
        "id": "ap_t3_4", "domain": "apd", "tier": 3,
        "feature": "q20_listening_retention",
        "text": "The student needs instructions written down to complete tasks they understood verbally just moments before.",
    },
    {
        "id": "ap_t2_4", "domain": "apd", "tier": 2,
        "feature": "q17_background_noise",
        "text": "The student performs noticeably better on tasks in a quiet room than in a typical classroom.",
    },
]

# Build lookup maps at import time
QUESTION_BY_ID = {q["id"]: q for q in QUESTIONS}
QUESTIONS_BY_DOMAIN_TIER = {}
for q in QUESTIONS:
    key = (q["domain"], q["tier"])
    QUESTIONS_BY_DOMAIN_TIER.setdefault(key, []).append(q)

# Gateway questions (one per domain, tier 1)
GATEWAY_ORDER = ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]
GATEWAY_QUESTIONS = [
    QUESTIONS_BY_DOMAIN_TIER[domain, 1][0] for domain in GATEWAY_ORDER
]
