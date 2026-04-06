/**
 * generateReportPDF.js
 * Builds a clean A4 Taranga screening report using jsPDF draw calls.
 * No DOM capture — all content is drawn programmatically.
 */

import jsPDF from "jspdf";

/* ── palette ──────────────────────────────────────────────────── */
const C = {
  bg: [249, 250, 251],
  white: [255, 255, 255],
  dark: [30, 41, 59],
  mid: [100, 116, 139],
  light: [226, 232, 240],
  primary: [99, 102, 241],
  dyslexia: [99, 102, 241],
  dyscalculia: [245, 158, 11],
  dysgraphia: [16, 185, 129],
  nvld: [139, 92, 246],
  apd: [239, 68, 68],
  risk_high: [225, 29, 72],
  risk_mod: [245, 158, 11],
  risk_low: [16, 185, 129],
};

const LD_META = {
  dyslexia: { label: "Dyslexia", color: C.dyslexia, emoji: "Dyslexia" },
  dyscalculia: { label: "Dyscalculia", color: C.dyscalculia, emoji: "Dyscalculia" },
  dysgraphia: { label: "Dysgraphia", color: C.dysgraphia, emoji: "Dysgraphia" },
  nvld: { label: "NVLD", color: C.nvld, emoji: "NVLD" },
  apd: { label: "APD", color: C.apd, emoji: "APD" },
};

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14; // margin
const INNER = PAGE_W - M * 2;

/* ── helpers ──────────────────────────────────────────────────── */
const rgb = (c) => ({ r: c[0], g: c[1], b: c[2] });

function setFill(doc, c) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setStroke(doc, c) {
  doc.setDrawColor(c[0], c[1], c[2]);
}
function setTextColor(doc, c) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function setFont(doc, weight = "normal", size = 10) {
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
}

function roundRect(doc, x, y, w, h, r = 3) {
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function pill(doc, x, y, text, bgColor, textColor) {
  setFont(doc, "bold", 7.5);
  const tw = doc.getTextWidth(text);
  const pw = tw + 8;
  const ph = 5.5;
  setFill(doc, bgColor);
  doc.roundedRect(x, y, pw, ph, 2, 2, "F");
  setTextColor(doc, textColor);
  doc.text(text, x + 4, y + 3.8);
  return pw;
}

function hLine(doc, y, color = C.light) {
  setStroke(doc, color);
  doc.setLineWidth(0.3);
  doc.line(M, y, PAGE_W - M, y);
}

function riskMeta(score) {
  if (score >= 70) return { label: "High Risk", color: C.risk_high };
  if (score >= 40) return { label: "Moderate", color: C.risk_mod };
  return { label: "Low Risk", color: C.risk_low };
}

function wrapText(doc, text, x, y, maxW, lineH) {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lineH;
}

function checkPage(doc, y, needed = 20) {
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    footer(doc);
    return 16;
  }
  return y;
}

function footer(doc) {
  const pg = doc.internal.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  setFont(doc, "normal", 8);
  setTextColor(doc, C.mid);
  doc.text(`Taranga AI Screening Report · Generated ${dateStr}`, M, PAGE_H - 8);
  doc.text(`Page ${pg}`, PAGE_W - M - doc.getTextWidth(`Page ${pg}`), PAGE_H - 8);
  hLine(doc, PAGE_H - 12, C.light);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export async function generateReportPDF({ report, history }) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const scores = report?.scores || {};
  const explanations = report?.explanations || {};
  const routing = report?.routing_summary || null;
  const studentName = report?.student_name || "Student";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  /* ── PAGE 1 ─────────────────────────────────────────────────── */

  /* header banner */
  setFill(doc, C.dark);
  doc.rect(0, 0, PAGE_W, 28, "F");

  setFont(doc, "bold", 16);
  setTextColor(doc, C.white);
  doc.text("Taranga AI", M, 12);

  setFont(doc, "normal", 9);
  setTextColor(doc, [148, 163, 184]);
  doc.text("Learning Difficulty Screening Report", M, 18.5);

  setFont(doc, "bold", 9);
  setTextColor(doc, C.white);
  doc.text(dateStr, PAGE_W - M - doc.getTextWidth(dateStr), 12);

  setFont(doc, "normal", 8);
  setTextColor(doc, [148, 163, 184]);
  const pgLabel = "Adaptive Assessment";
  doc.text(pgLabel, PAGE_W - M - doc.getTextWidth(pgLabel), 18.5);

  /* student info strip */
  setFill(doc, [241, 245, 249]);
  doc.rect(0, 28, PAGE_W, 14, "F");

  setFont(doc, "bold", 12);
  setTextColor(doc, C.dark);
  doc.text(studentName, M, 37);

  setFont(doc, "normal", 9);
  setTextColor(doc, C.mid);
  const subtitle = `Adaptive LD Assessment · 20 questions · 5 domains`;
  doc.text(subtitle, M + doc.getTextWidth(studentName) + 4, 37);

  let y = 50;

  /* ── SECTION: Probability Scores ──────────────────────────────── */
  setFont(doc, "bold", 11);
  setTextColor(doc, C.dark);
  doc.text("Probability Scores", M, y);
  y += 6;

  const boxW = (INNER - 8) / 5;
  const boxH = 32;
  let bx = M;

  Object.entries(LD_META).forEach(([ld, meta]) => {
    const score = Math.round(scores[ld] || 0);
    const rm = riskMeta(score);

    /* card bg */
    setFill(doc, [248, 250, 252]);
    roundRect(doc, bx, y, boxW, boxH, 3);

    /* colour top strip */
    setFill(doc, meta.color);
    roundRect(doc, bx, y, boxW, 5, 2);
    doc.rect(bx, y + 2, boxW, 3, "F"); // flat bottom of strip

    /* LD name */
    setFont(doc, "bold", 7.5);
    setTextColor(doc, meta.color);
    doc.text(meta.label, bx + boxW / 2 - doc.getTextWidth(meta.label) / 2, y + 11);

    /* score */
    setFont(doc, "bold", 16);
    setTextColor(doc, C.dark);
    const scoreStr = `${score}%`;
    doc.text(scoreStr, bx + boxW / 2 - doc.getTextWidth(scoreStr) / 2, y + 21);

    /* risk pill */
    const pillW = doc.getTextWidth(rm.label) + 6;
    setFont(doc, "bold", 6.5);
    setFill(doc, [...rm.color.map(v => Math.min(255, v + 180))]);
    const px = bx + boxW / 2 - pillW / 2;
    doc.roundedRect(px, y + 23, pillW, 5, 1.5, 1.5, "F");
    setTextColor(doc, rm.color);
    doc.text(rm.label, bx + boxW / 2 - doc.getTextWidth(rm.label) / 2, y + 26.8);

    bx += boxW + 2;
  });

  y += boxH + 8;

  /* ── SECTION: Score Summary Table ──────────────────────────────── */
  setFont(doc, "bold", 11);
  setTextColor(doc, C.dark);
  doc.text("Score Summary", M, y);
  y += 5;

  /* table header */
  setFill(doc, C.dark);
  doc.rect(M, y, INNER, 7, "F");
  setFont(doc, "bold", 8);
  setTextColor(doc, C.white);
  const cols = [42, 42, 38, 60];
  const heads = ["Learning Difficulty", "Probability", "Risk Level", "Recommendation"];
  let cx = M + 3;
  heads.forEach((h, i) => {
    doc.text(h, cx, y + 4.8);
    cx += cols[i];
  });
  y += 7;

  Object.entries(LD_META).forEach(([ld, meta], idx) => {
    const score = Math.round(scores[ld] || 0);
    const rm = riskMeta(score);
    const rec =
      score >= 70 ? "Specialist evaluation recommended"
        : score >= 40 ? "Monitor closely, consider support"
          : "Routine classroom observation";

    setFill(doc, idx % 2 === 0 ? C.white : [248, 250, 252]);
    doc.rect(M, y, INNER, 9, "F");

    cx = M + 3;
    /* LD name */
    setFont(doc, "bold", 8.5);
    setTextColor(doc, meta.color);
    doc.text(meta.label, cx, y + 5.8);
    cx += cols[0];

    /* score + bar */
    setFill(doc, C.light);
    doc.roundedRect(cx, y + 2.5, 22, 3, 1, 1, "F");
    setFill(doc, meta.color);
    doc.roundedRect(cx, y + 2.5, 22 * (score / 100), 3, 1, 1, "F");
    setFont(doc, "bold", 8);
    setTextColor(doc, meta.color);
    doc.text(`${score}%`, cx + 24, y + 5.5);
    cx += cols[1];

    /* risk */
    pill(doc, cx, y + 2, rm.label, [...rm.color.map(v => Math.min(255, v + 180))], rm.color);
    cx += cols[2];

    /* recommendation */
    setFont(doc, "normal", 7.5);
    setTextColor(doc, C.mid);
    doc.text(rec, cx, y + 5.8);

    y += 9;

    /* border */
    hLine(doc, y, [235, 238, 244]);
  });

  y += 6;

  /* ── SECTION: Routing Summary ──────────────────────────────────── */
  if (routing?.domain_ranking?.length) {
    y = checkPage(doc, y, 40);

    setFont(doc, "bold", 11);
    setTextColor(doc, C.dark);
    doc.text("Adaptive Routing Summary", M, y);
    y += 4;

    setFont(doc, "normal", 8.5);
    setTextColor(doc, C.mid);
    const routingInfo =
      "Questions were dynamically allocated based on gateway responses. Higher-suspicion domains received more follow-up questions.";
    y = wrapText(doc, routingInfo, M, y + 4, INNER, 5);
    y += 4;

    const ranked = routing.domain_ranking;
    const qpd = routing.questions_per_domain || {};
    const rw = (INNER - (ranked.length - 1) * 3) / ranked.length;
    let rx = M;

    ranked.forEach((domain, i) => {
      const meta = LD_META[domain];
      const count = qpd[domain] || 0;

      setFill(doc, [248, 250, 252]);
      roundRect(doc, rx, y, rw, 18, 3);
      setFill(doc, meta.color);
      roundRect(doc, rx, y, rw, 4, 2);
      doc.rect(rx, y + 2, rw, 2, "F");

      setFont(doc, "bold", 7);
      setTextColor(doc, meta.color);
      const rank = `#${i + 1} ${meta.label}`;
      doc.text(rank, rx + rw / 2 - doc.getTextWidth(rank) / 2, y + 10);

      setFont(doc, "normal", 7);
      setTextColor(doc, C.mid);
      const qs = `${count} question${count !== 1 ? "s" : ""}`;
      doc.text(qs, rx + rw / 2 - doc.getTextWidth(qs) / 2, y + 15);

      rx += rw + 3;
    });

    y += 22;
  }

  /* ── SECTION: AI Explanations (if available) ───────────────────── */
  const expEntries = Object.entries(explanations).filter(([, d]) => d?.narrative);
  if (expEntries.length > 0) {
    y = checkPage(doc, y, 20);

    setFont(doc, "bold", 11);
    setTextColor(doc, C.dark);
    doc.text("AI Explanations", M, y);
    y += 6;

    for (const [ld, data] of expEntries) {
      y = checkPage(doc, y, 30);
      const meta = LD_META[ld];
      const prob = Math.round((data.probability || 0) * 100);
      const rm = riskMeta(prob);

      /* card */
      setFill(doc, [248, 250, 252]);
      roundRect(doc, M, y, INNER, 4, 2);

      /* left accent stripe */
      setFill(doc, meta.color);
      doc.rect(M, y, 3, 4, "F");     // temp height placeholder
      roundRect(doc, M, y, 3, 4, 1);

      /* LD title row */
      setFont(doc, "bold", 9.5);
      setTextColor(doc, meta.color);
      doc.text(meta.label, M + 6, y + 3);

      setFont(doc, "bold", 9.5);
      setTextColor(doc, C.dark);
      const probStr = `${prob}%`;
      doc.text(probStr, PAGE_W - M - doc.getTextWidth(probStr), y + 3);
      y += 6;

      /* narrative */
      setFont(doc, "normal", 8.5);
      setTextColor(doc, [55, 65, 81]);
      const narrativeLines = doc.splitTextToSize(data.narrative || "", INNER - 4);
      doc.text(narrativeLines, M + 2, y);
      y += narrativeLines.length * 4.5 + 2;

      /* top factors */
      if (data.top_factors?.length > 0) {
        setFont(doc, "bold", 7.5);
        setTextColor(doc, meta.color);
        doc.text("KEY INDICATORS", M + 2, y);
        y += 4;

        for (const f of data.top_factors.slice(0, 3)) {
          y = checkPage(doc, y, 10);
          setFont(doc, "normal", 7.5);
          setTextColor(doc, [55, 65, 81]);
          doc.text(f.label, M + 2, y);

          /* impact bar */
          const barX = M + 68;
          const barW = 50;
          setFill(doc, C.light);
          doc.roundedRect(barX, y - 3, barW, 3, 1, 1, "F");
          const fill = Math.min(barW, Math.abs(f.impact) * 200);
          setFill(doc, meta.color);
          doc.roundedRect(barX, y - 3, fill, 3, 1, 1, "F");

          setFont(doc, "bold", 7);
          setTextColor(doc, meta.color);
          const impStr = `${f.impact > 0 ? "+" : ""}${f.impact.toFixed(3)}`;
          doc.text(impStr, barX + barW + 2, y);

          y += 5;
        }
      }

      y += 5;
      hLine(doc, y, C.light);
      y += 5;
    }
  }

  /* ── SECTION: Screening History ────────────────────────────────── */
  if (history && history.length > 1) {
    y = checkPage(doc, y, 30);

    setFont(doc, "bold", 11);
    setTextColor(doc, C.dark);
    doc.text("Screening History", M, y);
    y += 5;

    /* table header */
    setFill(doc, C.dark);
    doc.rect(M, y, INNER, 7, "F");
    setFont(doc, "bold", 7.5);
    setTextColor(doc, C.white);
    const hCols = [40, 22, 22, 22, 22, 22, 32];
    const hHeads = ["Date", "Dyslexia", "Dyscalculia", "Dysgraphia", "NVLD", "APD", "Top Risk"];
    let hx = M + 2;
    hHeads.forEach((h, i) => { doc.text(h, hx, y + 4.8); hx += hCols[i]; });
    y += 7;

    history.slice(0, 8).forEach((p, idx) => {
      y = checkPage(doc, y, 10);
      const s = {
        dyslexia: Math.round(p.dyslexia_score),
        dyscalculia: Math.round(p.dyscalculia_score),
        dysgraphia: Math.round(p.dysgraphia_score),
        nvld: Math.round(p.nvld_score),
        apd: Math.round(p.apd_score),
      };
      const topLd = Object.entries(s).sort((a, b) => b[1] - a[1])[0];
      const topMeta = LD_META[topLd[0]];

      setFill(doc, idx % 2 === 0 ? C.white : [248, 250, 252]);
      doc.rect(M, y, INNER, 8, "F");

      hx = M + 2;

      /* date */
      setFont(doc, "normal", 7.5);
      setTextColor(doc, C.dark);
      const d = new Date(p.created_at);
      doc.text(d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), hx, y + 5);
      hx += hCols[0];

      /* scores */
      ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"].forEach((ld, li) => {
        const sc = s[ld];
        const rm = riskMeta(sc);
        setFont(doc, "bold", 7.5);
        setTextColor(doc, rm.color);
        doc.text(`${sc}%`, hx, y + 5);
        hx += hCols[li + 1];
      });

      /* top LD */
      setFont(doc, "bold", 7.5);
      setTextColor(doc, topMeta.color);
      doc.text(topMeta.label, hx, y + 5);

      y += 8;
      hLine(doc, y, [235, 238, 244]);
    });
  }

  /* ── add footers to all pages ───────────────────────────────────── */
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    footer(doc);
  }

  /* ── save ───────────────────────────────────────────────────────── */
  const fileName = `Taranga_Report_${(studentName || "Student").replace(/\s+/g, "_")}_${dateStr.replace(/\s/g, "_")}.pdf`;
  doc.save(fileName);
}
