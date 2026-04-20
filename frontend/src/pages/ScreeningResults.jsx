import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import { generateReportPDF } from '../utils/generateReportPDF';

/* ─── constants ─────────────────────────────────────────────────── */
const LD_META = {
  dyslexia:    { label: 'Dyslexia',    color: '#6366F1', bg: '#EEF2FF', short: 'Reading & spelling difficulties' },
  dyscalculia: { label: 'Dyscalculia', color: '#F59E0B', bg: '#FFFBEB', short: 'Number & arithmetic difficulties' },
  dysgraphia:  { label: 'Dysgraphia',  color: '#10B981', bg: '#ECFDF5', short: 'Handwriting & motor difficulties' },
  nvld:        { label: 'NVLD',        color: '#8B5CF6', bg: '#F5F3FF', short: 'Spatial & social learning difficulties' },
  apd:         { label: 'APD',         color: '#EF4444', bg: '#FEF2F2', short: 'Auditory processing difficulties' },
};

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
};

const fmt = (iso) => {
  if (!iso) return '—';
  const zIso = iso.endsWith('Z') ? iso : iso + 'Z';
  return new Date(zIso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/* ─── animated gauge ─────────────────────────────────────────────── */
const Gauge = ({ score, color, label, emoji }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(score), 300); return () => clearTimeout(t); }, [score]);
  const r = 52, circ = 2 * Math.PI * r;
  const risk = score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low';
  const riskColor = score >= 70 ? '#E11D48' : score >= 40 ? '#F59E0B' : '#10B981';
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ - (animated / 100) * circ}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
        <text x="65" y="68" textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '65px 65px', fontSize: '1.2rem', fontWeight: '900', fill: color, fontFamily: 'sans-serif' }}>
          {Math.round(animated)}%
        </text>
      </svg>
      <div style={{ fontWeight: '800', color: '#1E293B', marginTop: '0.35rem', fontSize: '0.95rem' }}>{emoji} {label}</div>
      <span style={{ background: riskColor + '20', color: riskColor, padding: '0.2rem 0.65rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.75rem' }}>{risk} Risk</span>
    </div>
  );
};

/* ─── narrative card ─────────────────────────────────────────────── */
const NarrativeCard = ({ ld, data }) => {
  const meta = LD_META[ld];
  return (
    <div style={{ background: meta.bg, borderRadius: '16px', padding: '1.5rem', border: `2px solid ${meta.color}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '1.4rem' }}>{meta.emoji}</span>
        <div>
          <p style={{ fontWeight: '900', color: meta.color, margin: 0, fontSize: '1rem' }}>{meta.label}</p>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: '0.78rem' }}>{meta.short}</p>
        </div>
        <div style={{ marginLeft: 'auto', fontWeight: '900', color: meta.color, fontSize: '1.3rem' }}>
          {Math.round((data.probability ?? 0) * 100)}%
        </div>
      </div>
      <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: '1.7', margin: '0 0 1rem 0' }}>{data.narrative || '—'}</p>
      {data.top_factors?.length > 0 && (
        <div>
          <p style={{ color: meta.color, fontWeight: '800', fontSize: '0.8rem', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Indicators</p>
          {data.top_factors.map((f, i) => {
            const barWidth = Math.min(100, Math.abs(f.impact) * 200);
            return (
              <div key={i} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '600' }}>{f.label}</span>
                  <span style={{ fontSize: '0.78rem', color: meta.color, fontWeight: '800' }}>{f.impact > 0 ? '+' : ''}{f.impact.toFixed(3)}</span>
                </div>
                <div style={{ background: '#E2E8F0', borderRadius: '4px', height: '5px' }}>
                  <div style={{ width: `${barWidth}%`, height: '100%', background: meta.color, borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── routing summary ────────────────────────────────────────────── */
const RoutingSummary = ({ routing }) => {
  if (!routing) return null;
  const ranked = routing.domain_ranking || [];
  const qPerDomain = routing.questions_per_domain || {};
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '2px solid #E2E8F0' }}>
      <h3 style={{ color: '#1E293B', margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: '800' }}>🔀 Adaptive Routing Summary</h3>
      <p style={{ color: '#64748B', margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
        The screening dynamically allocated questions based on early responses. Higher-suspicion domains received more follow-up questions.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {ranked.map((domain, i) => {
          const meta = LD_META[domain];
          const count = qPerDomain[domain] || 0;
          return (
            <div key={domain} style={{ background: meta.bg, border: `2px solid ${meta.color}44`, borderRadius: '12px', padding: '0.6rem 1rem', textAlign: 'center', minWidth: '100px', flex: '1' }}>
              <p style={{ color: meta.color, fontWeight: '900', margin: '0 0 0.15rem', fontSize: '0.9rem' }}>#{i + 1} {meta.emoji}</p>
              <p style={{ color: meta.color, margin: '0 0 0.1rem', fontWeight: '700', fontSize: '0.82rem' }}>{meta.label}</p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '0.75rem' }}>{count} question{count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── screening history table ────────────────────────────────────── */
const ScreeningHistory = ({ history, currentScreeningId }) => {
  if (!history || history.length <= 1) return null;
  return (
    <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid #F1F5F9' }}>
        <h2 style={{ color: '#1E293B', margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Screening History</h2>
        <p style={{ color: '#64748B', margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
          All previous screenings are preserved — nothing is overwritten.
        </p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            {['Date', 'Dyslexia', 'Dyscalculia', 'Dysgraphia', 'NVLD', 'APD', 'Highest Risk'].map(h => (
              <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((p, i) => {
            const isLatest = p.screening_id === currentScreeningId;
            const scores = {
              dyslexia:    p.dyslexia_score,
              dyscalculia: p.dyscalculia_score,
              dysgraphia:  p.dysgraphia_score,
              nvld:        p.nvld_score,
              apd:         p.apd_score,
            };
            const topLd = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
            const topMeta = LD_META[topLd[0]];
            return (
              <tr key={p.screening_id}
                style={{ borderBottom: i < history.length - 1 ? '1px solid #F1F5F9' : 'none', background: isLatest ? '#FAFBFF' : 'transparent' }}>
                <td style={{ padding: '1rem', fontSize: '0.88rem', color: '#374151', fontWeight: isLatest ? '800' : '600', whiteSpace: 'nowrap' }}>
                  {fmt(p.created_at)}
                  {isLatest && <span style={{ marginLeft: '0.5rem', background: '#EEF2FF', color: '#6366F1', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>Latest</span>}
                </td>
                {['dyslexia', 'dyscalculia', 'dysgraphia', 'nvld', 'apd'].map(ld => {
                  const s = scores[ld];
                  const c = s >= 70 ? '#E11D48' : s >= 40 ? '#F59E0B' : '#10B981';
                  return (
                    <td key={ld} style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '40px', background: '#F1F5F9', borderRadius: '3px', height: '5px' }}>
                          <div style={{ width: `${s}%`, height: '100%', background: c, borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: c }}>{Math.round(s)}%</span>
                      </div>
                    </td>
                  );
                })}
                <td style={{ padding: '1rem' }}>
                  {topLd[1] === 0 ? (
                    <span style={{ background: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0', padding: '0.22rem 0.65rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.78rem' }}>
                      Typical
                    </span>
                  ) : (
                    <span style={{ background: topMeta.bg, color: topMeta.color, padding: '0.22rem 0.65rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.78rem' }}>
                      {topMeta.emoji} {topMeta.label}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ─── skeleton ───────────────────────────────────────────────────── */
const Skeleton = ({ h = 120 }) => (
  <div style={{ height: `${h}px`, background: '#F1F5F9', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '1rem' }} />
);

/* ─── main component ─────────────────────────────────────────────── */
const ScreeningResults = () => {
  const { studentId } = useParams();
  const location      = useLocation();
  const role          = sessionStorage.getItem('role') || 'teacher';
  const [downloading, setDownloading] = useState(false);

  const [report,   setReport]   = useState(location.state?.report || null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  /* ── always fetch history from DB (even when we have live report) ── */
  useEffect(() => {
    authFetch(`/api/screenings/results/${studentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.status !== 'success') {
          if (!report) setError('No screening results found yet.');
          return;
        }
        setHistory(data.all_predictions || []);
        // If we arrived without live report (e.g. from student roster link),
        // use the latest stored prediction for the gauges/table
        if (!report && data.latest_prediction) {
          const pred = data.latest_prediction;
          setReport({
            student_id: parseInt(studentId),
            student_name: '',
            scores: {
              dyslexia:    pred.dyslexia_score,
              dyscalculia: pred.dyscalculia_score,
              dysgraphia:  pred.dysgraphia_score,
              nvld:        pred.nvld_score,
              apd:         pred.apd_score,
            },
            explanations:    null,
            routing_summary: null,
            screening_id:    pred.screening_id,
          });
        }
      })
      .catch(() => { if (!report) setError('Failed to load results.'); })
      .finally(() => setLoading(false));
  }, [studentId]); // eslint-disable-line

  /* ── PDF download ─────────────────────────────────────────────── */
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generateReportPDF({ report, history });
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setDownloading(false);
    }
  };

  /* ── derived ──────────────────────────────────────────────────── */
  const scores       = report?.scores       || {};
  const explanations = report?.explanations || {};
  const routing      = report?.routing_summary || null;
  const highRisk     = Object.entries(scores).filter(([, v]) => v >= 70).map(([k]) => k);
  const currentScreeningId = report?.screening_id || null;

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.25rem' }}>Screening Report</h1>
            <p style={{ color: '#64748B', margin: 0 }}>
              {report?.student_name ? `${report.student_name} · ` : ''}Adaptive LD Assessment
              {history.length > 0 && ` · ${history.length} screening${history.length !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={downloading || loading || !!error}
              className="btn"
              style={{ background: downloading ? '#F1F5F9' : '#1E293B', color: downloading ? '#94A3B8' : 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
            >
              {downloading ? '⏳ Generating…' : '⬇️ Download PDF'}
            </button>
            <Link to="/screening/adaptive" className="btn btn-primary">+ New Screening</Link>
          </div>
        </header>

        {/* ── High risk alert ─────────────────────────────────────── */}
        {!loading && highRisk.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)', border: '2px solid #FDE68A', borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}></span>
            <div>
              <strong style={{ color: '#92400E' }}>High-risk indicators detected</strong>
              <p style={{ color: '#B45309', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                {highRisk.map(ld => LD_META[ld]?.label).join(', ')} — formal specialist evaluation recommended.
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', color: '#E11D48', borderRadius: '14px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}></div>
            <p style={{ fontWeight: '800', margin: 0 }}>{error}</p>
            <Link to="/screening/adaptive" style={{ color: '#6366F1', fontWeight: '700', marginTop: '0.75rem', display: 'inline-block' }}>Start a screening →</Link>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PDF-able report body
        ══════════════════════════════════════════════════════════ */}
        <div id="report-body">

          {/* ── Probability gauges ─────────────────────────────────── */}
          {loading
            ? <><Skeleton h={180} /><Skeleton h={120} /></>
            : !error && (
              <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#1E293B', margin: '0 0 1.5rem', fontSize: '1.2rem' }}>Probability scores</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  {Object.entries(LD_META).map(([ld, meta]) => (
                    <Gauge key={ld} score={scores[ld] || 0} color={meta.color} label={meta.label} emoji={meta.emoji} />
                  ))}
                </div>
              </div>
            )
          }

          {/* ── AI Narratives ─────────────────────────────────────── */}
          {!loading && !error && explanations && Object.keys(explanations).length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: '#1E293B', margin: '0 0 1.25rem', fontSize: '1.2rem' }}>AI explanations</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.1rem' }}>
                {Object.entries(explanations).map(([ld, data]) => (
                  <NarrativeCard key={ld} ld={ld} data={data} />
                ))}
              </div>
            </section>
          )}

          {/* No live explanations (revisiting from roster) */}
          {!loading && !error && (!explanations || Object.keys(explanations).length === 0) && (
            <div style={{ background: '#FFFBEB', border: '2px solid #FDE68A', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
              <p style={{ color: '#92400E', margin: 0, fontWeight: '700' }}>
                Detailed AI explanations are only available immediately after completing a screening. To see full narratives and SHAP factors, run a new screening for this student.
              </p>
            </div>
          )}

          {/* ── Routing summary ───────────────────────────────────── */}
          {!loading && !error && routing && (
            <section style={{ marginBottom: '2rem' }}>
              <RoutingSummary routing={routing} />
            </section>
          )}

          {/* ── Score summary table ───────────────────────────────── */}
          {!loading && !error && (
            <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', padding: '2rem', marginBottom: '2rem' }}>
              <h2 style={{ color: '#1E293B', margin: '0 0 1.25rem', fontSize: '1.2rem' }}>Score summary</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    {['Learning Difficulty', 'Probability', 'Risk Level', 'Recommendation'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(LD_META).map(([ld, meta]) => {
                    const score = scores[ld] || 0;
                    const risk  = score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low';
                    const riskC = score >= 70 ? '#E11D48' : score >= 40 ? '#F59E0B' : '#10B981';
                    const rec   = score >= 70 ? 'Specialist evaluation recommended' : score >= 40 ? 'Monitor closely, consider support' : 'Routine classroom observation';
                    return (
                      <tr key={ld} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#1E293B' }}>{meta.emoji} {meta.label}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '4px', height: '6px' }}>
                              <div style={{ width: `${score}%`, height: '100%', background: meta.color, borderRadius: '4px' }} />
                            </div>
                            <span style={{ fontWeight: '800', color: meta.color, minWidth: '40px' }}>{Math.round(score)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: riskC + '20', color: riskC, padding: '0.25rem 0.7rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.8rem' }}>{risk}</span>
                        </td>
                        <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.88rem' }}>{rec}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>{/* end report-body (PDF boundary) */}

        {/* ── Screening history ──── OUTSIDE PDF so it's not included ── */}
        {!loading && !error && (
          <ScreeningHistory history={history} currentScreeningId={currentScreeningId} />
        )}

        {/* ── Start Intervention CTA ───────────────────────────────── */}
        {!loading && !error && (
          <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: '20px', padding: '2rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', boxShadow: '0 12px 40px rgba(99,102,241,0.25)' }}>
            <div>
              <h3 style={{ color: 'white', margin: '0 0 0.35rem', fontSize: '1.2rem' }}>▶ Start Intervention</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
                Create login credentials and assign targeted activities for this student.
              </p>
            </div>
            <Link
              to={`/students/${studentId}/intervention`}
              state={{ scores }}
              style={{ background: 'white', color: '#6366F1', borderRadius: '14px', padding: '0.85rem 1.75rem', fontWeight: '900', fontSize: '0.95rem', textDecoration: 'none', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
            >
              Set Up Intervention →
            </Link>
          </div>
        )}

      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default ScreeningResults;
