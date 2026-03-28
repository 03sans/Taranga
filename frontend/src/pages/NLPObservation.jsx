import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NLPObservation = () => {
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setTimeout(() => {
      // Mock API delay
      navigate("/results/1");
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <h1 style={{ color: "var(--primary-color)", marginBottom: "1rem" }}>NLP Observation Analysis</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", maxWidth: "600px" }}>
        Type or paste your unstructured notes regarding the student's behavior, performance, and social interactions in the classroom. Our AI will automatically flag potential learning difficulties.
      </p>

      <form onSubmit={handleSubmit} className="glass-panel" style={styles.formContainer}>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. The student struggles to read aloud and her handwriting is consistently messy. She reverses letters sometimes."
          style={styles.textarea}
          required
        ></textarea>
        
        <div style={styles.footer}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Powered by spaCy Text Extraction</p>
          <button type="submit" className="btn btn-primary" disabled={analyzing}>
            {analyzing ? 'Analyzing NLP...' : 'Extract Insights 🧠'}
          </button>
        </div>
      </form>
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
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  textarea: {
    minHeight: "250px",
    resize: "vertical",
    fontSize: "1.1rem",
    lineHeight: "1.7",
    padding: "1.5rem"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  }
};

export default NLPObservation;
