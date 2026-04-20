"""
System/Integration tests for Taranga backend using TestClient.
Tests full flows: registration → login → student screening → predictions.
"""

import pytest
import tempfile
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def db_engine():
    """Create an in-memory SQLite database for tests."""
    engine = create_engine("sqlite:///:memory:")
    from app.core.database import Base
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a test database session."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a TestClient with overridden database dependency."""
    from app.main import app
    from app.core.deps import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ─────────────────────────────────────────────────────────────────────────────
# AUTH & USER TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthentication:
    """Test user registration, login, and token validation."""

    def test_health_check(self, client):
        """Health endpoint should always respond."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_register_teacher(self, client):
        """Teacher registration should succeed."""
        payload = {
            "full_name": "John Teacher",
            "email": "john@example.com",
            "password": "SecurePass123!",
            "role": "teacher",
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["status"] == "success"

    def test_register_duplicate_email(self, client):
        """Registering with duplicate email should fail."""
        payload = {
            "full_name": "John Teacher",
            "email": "john@example.com",
            "password": "SecurePass123!",
            "role": "teacher",
        }
        client.post("/auth/register", json=payload)
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400

    def test_login_teacher(self, client):
        """Teacher login should return token."""
        # Register first
        payload = {
            "full_name": "Jane Teacher",
            "email": "jane@example.com",
            "password": "SecurePass123!",
            "role": "teacher",
        }
        client.post("/auth/register", json=payload)

        # Login
        response = client.post("/auth/login", json={
            "email": "jane@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "teacher"

    def test_login_invalid_credentials(self, client):
        """Login with wrong password should fail."""
        payload = {
            "full_name": "Bob Teacher",
            "email": "bob@example.com",
            "password": "SecurePass123!",
            "role": "teacher",
        }
        client.post("/auth/register", json=payload)

        response = client.post("/auth/login", json={
            "email": "bob@example.com",
            "password": "WrongPassword!"
        })
        assert response.status_code == 200
        assert "error" in response.json()

    def test_student_login(self, client, db_session):
        """Student login with username should work."""
        from app.models.user import User
        from app.core.security import hash_password

        # Create a student user manually
        student = User(
            full_name="Alice Student",
            email="alice@taranga.local",
            hashed_password=hash_password("StudentPass123!"),
            role="student",
            is_active=True,
        )
        db_session.add(student)
        db_session.commit()

        # Student login with username
        response = client.post("/auth/student-login", json={
            "username": "alice",
            "password": "StudentPass123!",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "student"

    def test_get_current_user(self, client, db_session):
        """Authenticated request should return current user."""
        from app.models.user import User
        from app.core.security import hash_password, create_access_token

        # Create a teacher
        teacher = User(
            full_name="Dr. Smith",
            email="smith@example.com",
            hashed_password=hash_password("Password123!"),
            role="teacher",
            is_active=True,
        )
        db_session.add(teacher)
        db_session.commit()

        token = create_access_token(str(teacher.id))
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "smith@example.com"
        assert data["role"] == "teacher"


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT & SCREENING TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestStudentAndScreening:
    """Test student creation, screening flow, and prediction."""

    @pytest.fixture
    def teacher_token(self, client, db_session):
        """Create a teacher and return their token."""
        from app.models.user import User
        from app.core.security import hash_password, create_access_token

        teacher = User(
            full_name="Dr. Johnson",
            email="johnson@school.com",
            hashed_password=hash_password("TeacherPass123!"),
            role="teacher",
            is_active=True,
        )
        db_session.add(teacher)
        db_session.commit()

        token = create_access_token(str(teacher.id))
        return token, teacher.id

    def test_create_student(self, client, db_session, teacher_token):
        """Teacher can create a student."""
        token, teacher_id = teacher_token

        payload = {
            "full_name": "Alex Student",
            "date_of_birth": "2010-05-15",
            "grade": "5",
        }
        response = client.post(
            "/students",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Alex Student"
        assert data["grade"] == "5"

    def test_list_students(self, client, db_session, teacher_token):
        """Teacher can list their students."""
        token, teacher_id = teacher_token

        # Create a student
        payload = {
            "full_name": "Sam Student",
            "date_of_birth": "2010-01-01",
            "grade": "4",
        }
        create_response = client.post(
            "/students",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        student_id = create_response.json()["id"]

        # List students
        response = client.get(
            "/students",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        students = response.json()
        assert len(students) >= 1
        assert any(s["id"] == student_id for s in students)

    def test_start_screening_session(self, client, db_session, teacher_token):
        """Teacher can start an adaptive screening session."""
        token, teacher_id = teacher_token

        # Create student
        payload = {
            "full_name": "Test Student",
            "date_of_birth": "2009-03-20",
            "grade": "3",
        }
        create_response = client.post(
            "/students",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        student_id = create_response.json()["id"]

        # Start screening
        response = client.post(
            "/screenings/session/start",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "question" in data
        assert data["question"]["tier"] == 1  # First is gateway

    def test_submit_screening_answer(self, client, db_session, teacher_token):
        """Submit answers during screening."""
        token, teacher_id = teacher_token

        # Create student and start session
        student_payload = {
            "full_name": "Quiz Student",
            "date_of_birth": "2010-06-01",
            "grade": "5",
        }
        student_resp = client.post(
            "/students",
            json=student_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        student_id = student_resp.json()["id"]

        session_resp = client.post(
            "/screenings/session/start",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        session_id = session_resp.json()["session_id"]
        question_id = session_resp.json()["question"]["id"]

        # Submit answer
        response = client.post(
            "/screenings/session/answer",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "score": 4
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert "question" in data  # Next question or None

    def test_complete_screening_session(self, client, db_session, teacher_token):
        """Complete a full 20-question screening."""
        token, teacher_id = teacher_token

        # Create student
        student_payload = {
            "full_name": "Full Screening Student",
            "date_of_birth": "2009-09-09",
            "grade": "4",
        }
        student_resp = client.post(
            "/students",
            json=student_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        student_id = student_resp.json()["id"]

        # Start session
        session_resp = client.post(
            "/screenings/session/start",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        session_id = session_resp.json()["session_id"]

        # Submit 20 answers
        question_id = session_resp.json()["question"]["id"]
        for i in range(20):
            answer_resp = client.post(
                "/screenings/session/answer",
                json={
                    "session_id": session_id,
                    "question_id": question_id,
                    "score": 3
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert answer_resp.status_code == 200
            if answer_resp.json()["question"]:
                question_id = answer_resp.json()["question"]["id"]

        # Get session state to confirm completion
        state_resp = client.get(
            f"/screenings/session/{session_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert state_resp.status_code == 200
        assert state_resp.json()["complete"] is True

    def test_get_screening_results(self, client, db_session, teacher_token):
        """Retrieve screening results for a student."""
        token, teacher_id = teacher_token

        # Create student
        student_payload = {
            "full_name": "Results Student",
            "date_of_birth": "2010-02-28",
            "grade": "6",
        }
        student_resp = client.post(
            "/students",
            json=student_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        student_id = student_resp.json()["id"]

        # Query results (should be empty initially)
        response = client.get(
            f"/screenings/results/{student_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["student_id"] == student_id
        assert data["screenings_count"] == 0


# ─────────────────────────────────────────────────────────────────────────────
# AUTHORIZATION & ROLE TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthorization:
    """Test role-based access control."""

    def test_admin_only_endpoint(self, client, db_session):
        """Admin-only endpoint should reject non-admins."""
        from app.models.user import User
        from app.core.security import hash_password, create_access_token

        # Create a teacher
        teacher = User(
            full_name="Regular Teacher",
            email="teacher@school.com",
            hashed_password=hash_password("Pass123!"),
            role="teacher",
            is_active=True,
        )
        db_session.add(teacher)
        db_session.commit()

        token = create_access_token(str(teacher.id))
        response = client.get(
            "/admin-only",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403

    def test_admin_endpoint_success(self, client, db_session):
        """Admin-only endpoint should allow admins."""
        from app.models.user import User
        from app.core.security import hash_password, create_access_token

        # Create an admin
        admin = User(
            full_name="System Admin",
            email="admin@taranga.local",
            hashed_password=hash_password("AdminPass123!"),
            role="admin",
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()

        token = create_access_token(str(admin.id))
        response = client.get(
            "/admin-only",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_teacher_only_endpoint(self, client, db_session):
        """Teacher-only endpoint should work for teachers."""
        from app.models.user import User
        from app.core.security import hash_password, create_access_token

        teacher = User(
            full_name="Ms. Teacher",
            email="ms@school.com",
            hashed_password=hash_password("Pass123!"),
            role="teacher",
            is_active=True,
        )
        db_session.add(teacher)
        db_session.commit()

        token = create_access_token(str(teacher.id))
        response = client.get(
            "/teacher-only",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# NLP OBSERVATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestNLPObservation:
    """Test NLP observation submission and analysis."""

    @pytest.fixture
    def teacher_with_student(self, client, db_session):
        """Create a teacher with a student."""
        from app.models.user import User
        from app.models.student import Student
        from app.core.security import hash_password, create_access_token

        teacher = User(
            full_name="Prof. Smith",
            email="prof@school.com",
            hashed_password=hash_password("Pass123!"),
            role="teacher",
            is_active=True,
        )
        db_session.add(teacher)
        db_session.flush()

        student = Student(
            full_name="Test Student",
            grade="3",
            teacher_id=teacher.id,
        )
        db_session.add(student)
        db_session.commit()

        token = create_access_token(str(teacher.id))
        return token, student.id

    def test_submit_nlp_observation(self, client, teacher_with_student):
        """Submit NLP observation notes."""
        token, student_id = teacher_with_student

        payload = {
            "student_id": student_id,
            "notes": "The student struggles to read aloud and reverses letters often."
        }
        response = client.post(
            "/screenings/nlp",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "_nlp_analysis" in data
        assert "detected_indicators" in data["_nlp_analysis"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
