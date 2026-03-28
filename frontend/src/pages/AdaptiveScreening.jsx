import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const questions = [
  { id: 'q1', text: "Does the student read noticeably slower than their peers?", category: 'Dyslexia' },
  { id: 'q2', text: "Does the student frequently make spelling errors?", category: 'Dyslexia' },
  { id: 'q3', text: "Does the student often reverse letters (e.g., b/d, p/q)?", category: 'Dyslexia' },
  { id: 'q4', text: "Does the student struggle significantly with basic math concepts?", category: 'Dyscalculia' },
  { id: 'q5', text: "Difficulty remembering numbers or math facts?", category: 'Dyscalculia' }
];

const AdaptiveScreening = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const handleAnswer = (val) => {
    setAnswers({ ...answers, [questions[currentStep].id]: val });
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finished
      console.log("Submitting:", answers);
      navigate("/results/1");
    }
  };

  const progress = ((currentStep) / questions.length) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Adaptive Assessment • Step {currentStep + 1} of {questions.length}</p>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="glass-panel" style={styles.card}>
        <span style={styles.categoryBadge}>{questions[currentStep].category}</span>
        <h2 style={{ fontSize: "2rem", margin: "1.5rem 0", color: "var(--text-primary)" }}>
          {questions[currentStep].text}
        </h2>

        <div style={styles.options}>
          <button className="btn" style={styles.optionBtn} onClick={() => handleAnswer(1)}>Never (1)</button>
          <button className="btn" style={styles.optionBtn} onClick={() => handleAnswer(2)}>Rarely (2)</button>
          <button className="btn" style={styles.optionBtn} onClick={() => handleAnswer(3)}>Sometimes (3)</button>
          <button className="btn" style={styles.optionBtn} onClick={() => handleAnswer(4)}>Often (4)</button>
          <button className="btn" style={styles.optionBtn} onClick={() => handleAnswer(5)}>Always (5)</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  header: {
    marginBottom: "2rem"
  },
  progressBar: {
    height: "8px",
    background: "var(--border-color)",
    borderRadius: "4px",
    marginTop: "0.5rem",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "var(--primary-color)",
    transition: "width 0.4s ease"
  },
  card: {
    textAlign: "center",
    padding: "4rem 2rem",
    boxShadow: "var(--shadow-lg)"
  },
  categoryBadge: {
    background: "rgba(79, 70, 229, 0.1)",
    color: "var(--primary-color)",
    padding: "0.4rem 1rem",
    borderRadius: "99px",
    fontWeight: "600",
    fontSize: "0.9rem",
    letterSpacing: "1px"
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "2rem"
  },
  optionBtn: {
    background: "var(--surface-color)",
    border: "2px solid var(--border-color)",
    padding: "1rem",
    fontSize: "1.1rem"
  }
};

export default AdaptiveScreening;
