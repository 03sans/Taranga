"""
Adaptive screening engine — Heuristic-Routed Adaptive Testing (HRAT).

Session lifecycle:
    1. start_session()   → returns gateway Q1
    2. submit_answer()   → returns next question or None if complete
    3. finalize()        → returns {feature_vector, routing_summary}

Routing algorithm (20 questions total):
    Phase 1 (Q 1–5):   One gateway question per LD domain.
    Phase 2 (Q 6–17):  Rank domains by gateway suspicion.
                        Rank 1 & 2 get 4 deep-dive questions each.
                        Rank 3    gets 2 deep-dive questions.
                        Rank 4 & 5 get 1 confirmatory question each.
    Phase 3 (Q 18–20): 3 fill questions from highest-suspicion domains
                        that still have unanswered features.
"""

import uuid
from collections import defaultdict
from typing import Optional

from app.ai.question_bank import (
    QUESTIONS,
    GATEWAY_QUESTIONS,
    GATEWAY_ORDER,
    QUESTIONS_BY_DOMAIN_TIER,
    QUESTION_BY_ID,
    DOMAIN_META,
    ANSWER_SCALE,
)

# ── In-memory session store ────────────────────────────────────────────────
_SESSIONS: dict[str, "AdaptiveSession"] = {}

DOMAIN_TO_FEATURES = {
    "dyslexia":    ["q1_reading_pace", "q2_spelling_errors", "q3_letter_reversal", "q4_phonological"],
    "dyscalculia": ["q5_math_operations", "q6_number_memory", "q7_time_concept", "q8_counting_patterns"],
    "dysgraphia":  ["q9_writing_quality", "q10_pencil_grip", "q11_word_spacing", "q12_copying_accuracy"],
    "nvld":        ["q13_social_cues", "q14_spatial_reasoning", "q15_routine_flexibility", "q16_nonverbal_comprehension"],
    "apd":         ["q17_background_noise", "q18_verbal_instructions", "q19_sound_discrimination", "q20_listening_retention"],
}

FEATURE_NAMES = [f for features in DOMAIN_TO_FEATURES.values() for f in features]

TOTAL_QUESTIONS = 20
PHASE1_COUNT = 5   # one gateway per domain


class AdaptiveSession:
    def __init__(self, student_id: int, student_name: str = ""):
        self.session_id   = str(uuid.uuid4())
        self.student_id   = student_id
        self.student_name = student_name

        # Answers: {question_id: score (1–5)}
        self.answers: dict[str, int] = {}

        # Feature accumulator: {feature_key: [scores]}
        self.feature_scores: dict[str, list[int]] = defaultdict(list)

        # Gateway suspicion: {domain: score (1–5)}
        self.gateway_suspicion: dict[str, int] = {}

        # Questions already asked (by id)
        self.asked_ids: set[str] = set()

        # Planned question queue (built after phase 1)
        self.queue: list[dict] = []

        # Phase tracker
        self.phase = 1
        self.current_question_number = 0

        # Phase 1: load gateway questions
        self._remaining_gateways = list(GATEWAY_QUESTIONS)

    # ── Public API ──────────────────────────────────────────────────────────

    def next_question(self) -> Optional[dict]:
        """Return the next question to ask, or None if screening is complete."""
        if self.current_question_number >= TOTAL_QUESTIONS:
            return None

        # Phase 1: gateway questions
        if self._remaining_gateways:
            q = self._remaining_gateways.pop(0)
            self.asked_ids.add(q["id"])
            self.current_question_number += 1
            return self._format(q)

        # Build phase 2+3 queue once phase 1 is done
        if self.phase == 1:
            self.phase = 2
            self._build_queue()

        if not self.queue:
            return None

        q = self.queue.pop(0)
        self.asked_ids.add(q["id"])
        self.current_question_number += 1
        return self._format(q)

    def record_answer(self, question_id: str, score: int) -> None:
        """Record an answer (score 1–5) for a given question id."""
        score = max(1, min(5, int(score)))  # clamp
        self.answers[question_id] = score

        q = QUESTION_BY_ID.get(question_id)
        if q:
            feature = q["feature"]
            self.feature_scores[feature].append(score)

            # Track gateway suspicion
            if q["tier"] == 1:
                self.gateway_suspicion[q["domain"]] = score

    def is_complete(self) -> bool:
        return self.current_question_number >= TOTAL_QUESTIONS

    def get_feature_vector(self) -> dict[str, float]:
        """
        Aggregate answers into the 20 model features.
        If a feature had multiple questions, take the max (worst case).
        If a feature was never asked, impute the domain average or 1.
        """
        vector: dict[str, float] = {}
        domain_avgs = {
            domain: (
                sum(self.gateway_suspicion.get(domain, 1) for _ in [1]) / 1
            )
            for domain in DOMAIN_TO_FEATURES
        }

        for domain, features in DOMAIN_TO_FEATURES.items():
            for feat in features:
                scores = self.feature_scores.get(feat, [])
                if scores:
                    vector[feat] = float(max(scores))
                else:
                    # Impute: use gateway suspicion for this domain, or 1
                    vector[feat] = float(self.gateway_suspicion.get(domain, 1))

        return vector

    def get_routing_summary(self) -> dict:
        """Return metadata about how the session was routed (for the report)."""
        ranked = sorted(self.gateway_suspicion.items(), key=lambda x: x[1], reverse=True)
        return {
            "total_questions": self.current_question_number,
            "gateway_suspicion": self.gateway_suspicion,
            "domain_ranking": [d for d, _ in ranked],
            "questions_per_domain": {
                domain: sum(
                    1 for qid in self.answered_question_ids()
                    if QUESTION_BY_ID.get(qid, {}).get("domain") == domain
                )
                for domain in DOMAIN_TO_FEATURES
            },
        }

    def answered_question_ids(self) -> list[str]:
        return list(self.answers.keys())

    def progress(self) -> dict:
        return {
            "answered": self.current_question_number,
            "total": TOTAL_QUESTIONS,
            "percent": round(self.current_question_number / TOTAL_QUESTIONS * 100),
            "suspicion": {
                d: {
                    "score": self.gateway_suspicion.get(d, 0),
                    "label": DOMAIN_META[d]["label"],
                    "color": DOMAIN_META[d]["color"],
                }
                for d in DOMAIN_TO_FEATURES
            },
        }

    # ── Internal ────────────────────────────────────────────────────────────

    def _build_queue(self):
        """
        After gateway phase, build the ordered question queue for phases 2+3.

        Allocation (15 remaining questions after 5 gateways):
          Ranks 1 & 2: 4 deep-dive questions each  →  8 questions
          Rank  3:     2 deep-dive questions        →  2 questions
          Ranks 4 & 5: 1 confirmatory question each →  2 questions
          Fill  slots: 3 questions from top domains →  3 questions
          Total = 8 + 2 + 2 + 3 = 15 ✓
        """
        ranked = sorted(
            DOMAIN_TO_FEATURES.keys(),
            key=lambda d: self.gateway_suspicion.get(d, 1),
            reverse=True,
        )
        allocation = {
            ranked[0]: 4,
            ranked[1]: 4,
            ranked[2]: 2,
            ranked[3]: 1,
            ranked[4]: 1,
        }
        q_list: list[dict] = []

        for domain, count in allocation.items():
            # Prefer tier-2, then tier-3 questions not already asked
            pool = [
                q for q in QUESTIONS
                if q["domain"] == domain
                and q["id"] not in self.asked_ids
                and q["tier"] in (2, 3)
            ]
            # Sort: tier 2 first, then tier 3
            pool.sort(key=lambda x: x["tier"])
            q_list.extend(pool[:count])

        # Phase 3 fill: 3 more from top 2 domains (any tier not asked yet)
        for domain in ranked[:2]:
            pool = [
                q for q in QUESTIONS
                if q["domain"] == domain
                and q["id"] not in {x["id"] for x in q_list}
                and q["id"] not in self.asked_ids
            ]
            pool.sort(key=lambda x: x["tier"])
            q_list.extend(pool[:2])   # up to 2 more per top domain

        # Deduplicate while preserving order, cap at 15
        seen = set()
        self.queue = []
        for q in q_list:
            if q["id"] not in seen:
                seen.add(q["id"])
                self.queue.append(q)
            if len(self.queue) >= (TOTAL_QUESTIONS - PHASE1_COUNT):
                break

    def _format(self, q: dict) -> dict:
        """Return the question dict with metadata for the API response."""
        return {
            "id":           q["id"],
            "domain":       q["domain"],
            "domain_label": DOMAIN_META[q["domain"]]["label"],
            "domain_color": DOMAIN_META[q["domain"]]["color"],
            "domain_emoji": DOMAIN_META[q["domain"]]["emoji"],
            "tier":         q["tier"],
            "feature":      q["feature"],
            "text":         q["text"],
            "answer_scale": ANSWER_SCALE,
            "question_number": self.current_question_number,
            "total":           TOTAL_QUESTIONS,
        }


# ── Session management helpers ─────────────────────────────────────────────

def create_session(student_id: int, student_name: str = "") -> AdaptiveSession:
    session = AdaptiveSession(student_id, student_name)
    _SESSIONS[session.session_id] = session
    return session


def get_session(session_id: str) -> Optional[AdaptiveSession]:
    return _SESSIONS.get(session_id)


def delete_session(session_id: str) -> None:
    _SESSIONS.pop(session_id, None)


# ── CLI self-test ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== Adaptive Engine Self-Test ===\n")
    session = create_session(student_id=1, student_name="Test Student")

    import random
    random.seed(99)

    while not session.is_complete():
        q = session.next_question()
        if q is None:
            break
        score = random.randint(1, 5)
        session.record_answer(q["id"], score)
        print(f"Q{q['question_number']:>2} [{q['domain_label']:<12} tier {q['tier']}] score={score}  {q['text'][:70]}…")

    print(f"\nFeature vector:")
    for k, v in session.get_feature_vector().items():
        print(f"  {k:<35}: {v}")

    print(f"\nRouting summary:")
    import json
    print(json.dumps(session.get_routing_summary(), indent=2))
