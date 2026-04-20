"""
Unit tests for Taranga AI modules and core utilities.
Tests: adaptive_engine, nlp_analyzer, synthesizer, security, explainer.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone

# ─────────────────────────────────────────────────────────────────────────────
# ADAPTIVE ENGINE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestAdaptiveEngine:
    """Test the adaptive screening session logic."""

    @pytest.fixture
    def session(self):
        """Create a fresh adaptive session."""
        from app.ai.adaptive_engine import create_session, _SESSIONS
        _SESSIONS.clear()
        sess = create_session(student_id=1, student_name="Test Student")
        return sess

    def test_session_initialization(self, session):
        """Verify session initializes with correct defaults."""
        assert session.student_id == 1
        assert session.student_name == "Test Student"
        assert session.phase == 1
        assert session.current_question_number == 0
        assert len(session.answers) == 0

    def test_next_question_phase1(self, session):
        """Phase 1 should return gateway questions first."""
        q = session.next_question()
        assert q is not None
        assert q["tier"] == 1
        assert q["question_number"] == 1
        assert 1 <= q["question_number"] <= 5

    def test_record_answer_valid_range(self, session):
        """Recording an answer should clamp to 1-5 range."""
        q = session.next_question()
        session.record_answer(q["id"], 3)
        assert session.answers[q["id"]] == 3

    def test_record_answer_clamping(self, session):
        """Scores outside 1-5 should be clamped."""
        q = session.next_question()
        session.record_answer(q["id"], 10)
        assert session.answers[q["id"]] == 5

        session.record_answer(q["id"], -1)
        assert session.answers[q["id"]] == 1

    def test_gateway_suspicion_tracking(self, session):
        """Gateway answers should update domain suspicion."""
        q = session.next_question()
        domain = q["domain"]
        session.record_answer(q["id"], 5)
        assert session.gateway_suspicion[domain] == 5

    def test_session_completion(self, session):
        """Complete a full session (20 questions)."""
        for i in range(20):
            q = session.next_question()
            if q is None:
                break
            session.record_answer(q["id"], 3)

        assert session.is_complete()
        assert session.current_question_number >= 20

    def test_feature_vector_generation(self, session):
        """Feature vector should aggregate answers across features."""
        for i in range(20):
            q = session.next_question()
            if q is None:
                break
            session.record_answer(q["id"], 3)

        fv = session.get_feature_vector()
        assert len(fv) == 20
        assert all(isinstance(v, float) for v in fv.values())
        assert all(1 <= v <= 5 for v in fv.values())

    def test_feature_vector_imputation(self, session):
        """Unanswered features should be imputed."""
        q1 = session.next_question()
        session.record_answer(q1["id"], 5)

        # Skip ahead to completion
        for _ in range(19):
            q = session.next_question()
            if q:
                session.record_answer(q["id"], 1)

        fv = session.get_feature_vector()
        assert all(k in fv for k in ["q1_reading_pace", "q5_math_operations", "q20_listening_retention"])

    def test_routing_summary(self, session):
        """Routing summary should reflect question allocation."""
        for i in range(20):
            q = session.next_question()
            if q is None:
                break
            session.record_answer(q["id"], 3)

        summary = session.get_routing_summary()
        assert "total_questions" in summary
        assert "gateway_suspicion" in summary
        assert "domain_ranking" in summary
        assert summary["total_questions"] >= 20


# ─────────────────────────────────────────────────────────────────────────────
# NLP ANALYZER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestNLPAnalyzer:
    """Test NLP observation analysis."""

    def test_analyze_dyslexia_indicators(self):
        """Test detection of dyslexia keywords."""
        from app.ai.nlp_analyzer import analyze_observation_notes
        text = "The student struggles to read aloud and reverses letters frequently."
        result = analyze_observation_notes(text)

        assert "dyslexia" in result["detected_indicators"]
        assert result["flag_counts"]["dyslexia"] > 0

    def test_analyze_dyscalculia_indicators(self):
        """Test detection of dyscalculia keywords."""
        from app.ai.nlp_analyzer import analyze_observation_notes
        text = "Math is very difficult. The student struggles with counting and number memory."
        result = analyze_observation_notes(text)

        assert "dyscalculia" in result["detected_indicators"]
        assert result["flag_counts"]["dyscalculia"] > 0

    def test_analyze_multiple_indicators(self):
        """Test detection of multiple LD types."""
        from app.ai.nlp_analyzer import analyze_observation_notes
        text = "Struggles with reading, writing is messy, and math is hard."
        result = analyze_observation_notes(text)

        # Should detect at least some indicators
        assert len(result["detected_indicators"]) > 0
        assert result["analyzed_text_length"] > 0

    def test_analyze_no_indicators(self):
        """Empty or generic text should have no indicators."""
        from app.ai.nlp_analyzer import analyze_observation_notes
        text = "The student is doing well in school."
        result = analyze_observation_notes(text)

        # May or may not detect anything, but structure should be present
        assert "detected_indicators" in result
        assert isinstance(result["flag_counts"], dict)

    def test_keyword_matching(self):
        """Test that keywords are properly extracted."""
        from app.ai.nlp_analyzer import analyze_observation_notes
        text = "The student has poor spelling and reads slowly."
        result = analyze_observation_notes(text)

        assert "keyword_matches" in result
        assert isinstance(result["keyword_matches"], dict)


# ─────────────────────────────────────────────────────────────────────────────
# SECURITY TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestSecurity:
    """Test password hashing and JWT token generation."""

    def test_hash_password(self):
        """Hashed password should differ from plaintext."""
        from app.core.security import hash_password, verify_password
        pwd = "Test123!"
        hashed = hash_password(pwd)

        assert hashed != pwd
        assert len(hashed) > 20

    def test_verify_password_correct(self):
        """Correct password should verify."""
        from app.core.security import hash_password, verify_password
        pwd = "TestPassword123!"
        hashed = hash_password(pwd)

        assert verify_password(pwd, hashed) is True

    def test_verify_password_incorrect(self):
        """Wrong password should not verify."""
        from app.core.security import hash_password, verify_password
        pwd = "TestPassword123!"
        wrong = "WrongPassword456!"
        hashed = hash_password(pwd)

        assert verify_password(wrong, hashed) is False

    def test_create_access_token(self):
        """Token should be creatable and decodable."""
        from app.core.security import create_access_token, verify_access_token
        user_id = "123"
        token = create_access_token(user_id)

        assert isinstance(token, str)
        assert len(token) > 20
        decoded_id = verify_access_token(token)
        assert decoded_id == user_id

    def test_token_expiry(self):
        """Expired tokens should fail verification."""
        from app.core.security import verify_access_token
        from jose import jwt

        # Create manually an expired token
        import os
        secret = os.getenv("SECRET_KEY", "super-secret-key-change-this-later")
        algo = "HS256"
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {"sub": "123", "exp": expire}
        expired_token = jwt.encode(payload, secret, algorithm=algo)

        with pytest.raises(ValueError):
            verify_access_token(expired_token)

    def test_invalid_token(self):
        """Invalid tokens should raise error."""
        from app.core.security import verify_access_token

        with pytest.raises(ValueError):
            verify_access_token("not.a.valid.token")


# ─────────────────────────────────────────────────────────────────────────────
# SYNTHESIZER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestSynthesizer:
    """Test synthetic data generation."""

    def test_generate_synthetic_data_shape(self):
        """Generated dataset should have correct shape."""
        from app.ai.synthesizer import generate_synthetic_data
        import pandas as pd
        import tempfile
        import os

        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            with patch('builtins.print'):
                generate_synthetic_data(num_samples=100)

            df = pd.read_csv("data/synthetic_dataset.csv")
            assert len(df) == 100
            assert len(df.columns) == 25  # 20 features + 5 labels

    def test_generate_synthetic_data_values(self):
        """Generated features should be in valid range."""
        from app.ai.synthesizer import generate_synthetic_data
        import pandas as pd
        import tempfile
        import os

        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            with patch('builtins.print'):
                generate_synthetic_data(num_samples=50)

            df = pd.read_csv("data/synthetic_dataset.csv")
            for col in ["q1_reading_pace", "q10_pencil_grip", "q20_listening_retention"]:
                assert df[col].min() >= 1
                assert df[col].max() <= 5

    def test_synthetic_data_labels(self):
        """Labels should be binary (0 or 1)."""
        from app.ai.synthesizer import generate_synthetic_data
        import pandas as pd
        import tempfile
        import os

        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            with patch('builtins.print'):
                generate_synthetic_data(num_samples=50)

            df = pd.read_csv("data/synthetic_dataset.csv")
            for label in ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]:
                assert set(df[label].unique()).issubset({0, 1})


# ─────────────────────────────────────────────────────────────────────────────
# EXPLAINER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestExplainer:
    """Test narrative generation (when model is not available)."""

    def test_generate_narrative_high_probability(self):
        """High probability should indicate strong likelihood."""
        from app.ai.explainer import generate_narrative

        narrative = generate_narrative("dyslexia", 0.85, [])
        assert "high likelihood" in narrative.lower()
        assert "85%" in narrative
        assert "specialist" in narrative.lower()

    def test_generate_narrative_moderate_probability(self):
        """Moderate probability should indicate cautious monitoring."""
        from app.ai.explainer import generate_narrative

        narrative = generate_narrative("dyscalculia", 0.55, [])
        assert "moderate likelihood" in narrative.lower()
        assert "monitoring" in narrative.lower()

    def test_generate_narrative_low_probability(self):
        """Low probability should indicate low concern."""
        from app.ai.explainer import generate_narrative

        narrative = generate_narrative("nvld", 0.15, [])
        assert "low likelihood" in narrative.lower()

    def test_generate_narrative_with_factors(self):
        """Narrative with factors should include factor labels."""
        from app.ai.explainer import generate_narrative

        factors = [
            {"label": "slow reading pace", "impact": 0.25},
            {"label": "letter reversals", "impact": 0.18},
        ]
        narrative = generate_narrative("dyslexia", 0.70, factors)

        assert "slow reading pace" in narrative
        assert "letter reversals" in narrative

    def test_feature_labels_exist(self):
        """Feature labels should be defined for all features."""
        from app.ai.explainer import FEATURE_LABELS, FEATURE_NAMES

        for feat in FEATURE_NAMES:
            assert feat in FEATURE_LABELS
            assert isinstance(FEATURE_LABELS[feat], str)
            assert len(FEATURE_LABELS[feat]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
