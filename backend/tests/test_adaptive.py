import pytest
from app.ai.adaptive_engine import create_session

def test_adaptive_gateway_phase():
    # Create a session
    session = create_session(student_id=999, student_name="Test Student")
    
    # Phase 1: Should deliver 5 gateway questions
    gateways = []
    for _ in range(5):
        q = session.next_question()
        assert q is not None
        assert q["tier"] == 1
        gateways.append(q)
        session.record_answer(q["id"], 1) # Normal score
    
    assert len(session.asked_ids) == 5
    
    # Trigger phase transition by calling next_question once more
    q6 = session.next_question()
    assert q6 is not None
    assert session.phase == 2 # Should transition now

def test_adaptive_routing_logic():
    session = create_session(student_id=888)
    
    # Simulate high suspicion in Dyslexia (id: dy_t1_1)
    # GATEWAY_ORDER = ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]
    # Q1 is Dyslexia
    q1 = session.next_question()
    assert q1["domain"] == "dyslexia"
    session.record_answer(q1["id"], 5) # High score for Dyslexia
    
    # Record low scores for others
    for _ in range(4):
        q = session.next_question()
        session.record_answer(q["id"], 1)
        
    # Build queue for Phase 2
    session.next_question() # Triggers queue build
    
    # Priority check: Dyslexia should have the most questions in the queue
    allocation = session.get_routing_summary()["questions_per_domain"]
    # After gateways (1 each), Dyslexia should be ranked 1st
    assert session.get_routing_summary()["domain_ranking"][0] == "dyslexia"

def test_adaptive_completion():
    session = create_session(student_id=777)
    
    # Answer all 20 questions
    count = 0
    while not session.is_complete():
        q = session.next_question()
        if not q: break
        session.record_answer(q["id"], 3)
        count += 1
        
    assert count == 20
    assert session.is_complete()
    assert session.next_question() is None
    
    # Verify feature vector length
    vector = session.get_feature_vector()
    assert len(vector) == 20
