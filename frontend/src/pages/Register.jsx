import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, AlertTriangleIcon, CheckIcon, CheckCircleIcon, ArrowRightIcon } from '../components/icons';

/* ── helpers ──────────────────────────────────────────────────────── */
const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE    = /^[A-Za-z\s'\-\.]+$/;

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const levels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors  = ['#E11D48', '#F59E0B', '#0EA5E9', '#10B981'];
  return (
    <div style={{ marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < score ? colors[score - 1] : '#E2E8F0', transition: 'background 0.3s' }} />
        ))}
      </div>
      {score > 0 && (
        <span style={{ fontSize: '0.78rem', color: colors[score - 1], fontWeight: '700' }}>{levels[score - 1]}</span>
      )}
    </div>
  );
};

const FieldError = ({ msg }) =>
  msg ? <p style={{ color: '#B91C1C', fontSize: '0.8rem', fontWeight: '600', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangleIcon size={12} />{msg}</p> : null;

/* ── validate all fields, return errors object ────────────────────── */
const validate = (formData) => {
  const errs = {};

  // Full name
  const name = formData.fullName.trim();
  if (!name)                          errs.fullName = 'Full name is required.';
  else if (name.length < 2)           errs.fullName = 'Name must be at least 2 characters.';
  else if (name.length > 120)         errs.fullName = 'Name cannot exceed 120 characters.';
  else if (!NAME_RE.test(name))       errs.fullName = "Only letters, spaces, hyphens, apostrophes, and dots are allowed.";

  // Email
  if (!formData.email.trim())         errs.email = 'Email is required.';
  else if (!EMAIL_RE.test(formData.email)) errs.email = 'Enter a valid email address.';

  // Password
  if (!formData.password)             errs.password = 'Password is required.';
  else if (formData.password.length < 8)  errs.password = 'Password must be at least 8 characters.';
  else if (!/[A-Z]/.test(formData.password)) errs.password = 'Include at least one uppercase letter.';
  else if (!/[0-9]/.test(formData.password)) errs.password = 'Include at least one number.';

  // Confirm password
  if (!formData.confirmPassword)       errs.confirmPassword = 'Please confirm your password.';
  else if (formData.confirmPassword !== formData.password) errs.confirmPassword = 'Passwords do not match.';

  return errs;
};

/* ── component ────────────────────────────────────────────────────── */
const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'teacher',
  });
  const [errors,    setErrors]   = useState({});
  const [apiError,  setApiError] = useState('');
  const [loading,   setLoading]  = useState(false);
  const [showPw,    setShowPw]   = useState(false);
  const [showCPw,   setShowCPw]  = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear that field's error as the user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setApiError('');

    // Client-side validation first
    const errs = validate(formData);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email:     formData.email.trim().toLowerCase(),
          password:  formData.password,
          role:      formData.role,
        }),
      });

      const data = await response.json();

      // Handle Pydantic 422 validation errors (e.g. if someone bypassed the JS)
      if (response.status === 422) {
        const msg = data.detail?.[0]?.msg || 'Validation error. Please check your inputs.';
        setApiError(msg);
        return;
      }

      // Handle 400 HTTP errors (e.g. email already registered)
      if (!response.ok) {
        setApiError(data.detail || data.error || 'Registration failed. Please try again.');
        return;
      }

      // Success → go to login
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch {
      setApiError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    borderColor: errors[field] ? '#E11D48' : undefined,
    transition: 'border-color 0.2s',
  });

  return (
    <div className="split-layout">
      {/* Visual Side */}
      <div className="split-left">
        <div style={{ maxWidth: '400px', zIndex: 1, position: 'relative' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem', lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '800' }}>
            Join Taranga
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.72)', marginBottom: '2rem', lineHeight: '1.65', fontWeight: '400' }}>
            Empower every student. Screen early, intervene effectively, and track progress in one unified platform.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.625rem' }}>Password requirements</p>
            {['At least 8 characters', 'One uppercase letter (A–Z)', 'One number (0–9)'].map(r => (
              <div key={r} style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.8125rem', margin: '0.3rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckIcon size={12} style={{ color: '#86EFAC', flexShrink: 0 }} />{r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="split-right">
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.25rem', letterSpacing: '-0.03em', fontWeight: '800' }}>Create account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '400' }}>Set up your educator or parent profile.</p>
          </div>

          {/* API / server error */}
          {apiError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C', marginBottom: '1.25rem', background: '#FEE2E2', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: '600', border: '1px solid #FECACA' }}>
              <AlertTriangleIcon size={14} />{apiError}
            </div>
          )}

          <form onSubmit={handleRegister} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Jane Doe"
                value={formData.fullName}
                onChange={handleChange}
                style={inputStyle('fullName')}
                autoComplete="name"
              />
              <FieldError msg={errors.fullName} />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="jane@school.edu"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle('email')}
                autoComplete="email"
              />
              <FieldError msg={errors.email} />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ ...inputStyle('password'), paddingRight: '3rem' }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}>
                  {showPw ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
              <PasswordStrength password={formData.password} />
              <FieldError msg={errors.password} />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCPw ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ ...inputStyle('confirmPassword'), paddingRight: '3rem' }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowCPw(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}>
                  {showCPw ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
              {/* Live match indicator */}
              {formData.confirmPassword && !errors.confirmPassword && formData.confirmPassword === formData.password && (
                <p style={{ color: '#059669', fontSize: '0.8rem', fontWeight: '600', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckIcon size={12} />Passwords match</p>
              )}
              <FieldError msg={errors.confirmPassword} />
            </div>

            {/* Role */}
            <div className="form-group">
              <label>I am a…</label>
              <select name="role" value={formData.role} onChange={handleChange} style={{ cursor: 'pointer' }}>
                <option value="teacher">Teacher / Educator</option>
                <option value="parent">Parent / Guardian</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', fontSize: '0.875rem', borderRadius: '8px' }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : <><span>Create account</span><ArrowRightIcon size={14} /></>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
