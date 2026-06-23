import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Verify Certificate — LevLox
 *
 * Reskinned to match the LevLox site system: Georgia serif headlines with a
 * single purple highlight word, Inter body copy, #7c3aed primary, soft
 * lavender section background, bold-label form fields, and arrow-suffixed
 * CTA buttons — the same language as the hero, results cards, and the
 * "Get Your Custom Company Pathway" form.
 *
 * Signature interaction kept from the previous pass: a real ink-stamp
 * (ring + verdict mark) lands on the result, colored from the site's own
 * status palette (green / red / amber), so verification reads like an
 * official document check rather than a generic alert.
 */

const STAMP_COPY = {
  valid: { ring: 'AUTHENTIC \u2022 LEVLOX VERIFIED \u2022', mark: '\u2713', ink: '#065F46', bg: '#DCFCE7', label: 'VALID' },
  revoked: { ring: 'REVOKED \u2022 NO LONGER VALID \u2022', mark: '!', ink: '#92400E', bg: '#FEF3C7', label: 'REVOKED' },
  invalid: { ring: 'NOT ON RECORD \u2022 RECHECK ID \u2022', mark: '?', ink: '#991B1B', bg: '#FEE2E2', label: 'NOT FOUND' },
};

function StampMark({ status, animKey }) {
  const s = STAMP_COPY[status];
  if (!s) return null;
  const id = `ring-path-${animKey}`;
  return (
    <svg key={animKey} className="stamp-svg" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id={id} d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
        <filter id={`ink-${animKey}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" seed={animKey.length} />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
        </filter>
      </defs>
      <g filter={`url(#ink-${animKey})`} style={{ color: s.ink }}>
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.85" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <text fontSize="11" fontWeight="700" letterSpacing="2.5" fill="currentColor">
          <textPath href={`#${id}`} startOffset="0%">{s.ring}</textPath>
        </text>
        <text x="100" y="118" textAnchor="middle" fontSize="56" fontWeight="700" fill="currentColor" fontFamily="Georgia, serif">
          {s.mark}
        </text>
      </g>
    </svg>
  );
}

export default function CertificateVerification() {
  const [certId, setCertId] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | done
  const [result, setResult] = useState(null); // valid | invalid | revoked
  const [copied, setCopied] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [certData, setCertData] = useState(null);
  const inputRef = useRef(null);
  const liveRegionRef = useRef(null);

  const verifyCertificate = useCallback(async (id) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setPhase('loading');
    setResult(null);
    setCertData(null);

    try {
      const res = await api.get(`/certificates/verify/${trimmed}`);
      if (res.data && res.data.status === 'success') {
        const cert = res.data.certificate;
        setCertData(cert);
        setResult(res.data.valid ? 'valid' : cert.certificateStatus === 'REVOKED' ? 'revoked' : 'invalid');
      } else {
        setResult('invalid');
      }
    } catch (err) {
      console.error(err);
      setResult('invalid');
    } finally {
      setPhase('done');
      setAnimKey((k) => k + 1);
    }
  }, []);

  const handleVerify = useCallback(() => {
    if (!certId.trim() || phase === 'loading') return;
    verifyCertificate(certId);
  }, [certId, phase, verifyCertificate]);

  const handleReset = () => {
    setResult(null);
    setPhase('idle');
    setCertId('');
    setCertData(null);
    setCopied(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      const id = path.split('/verify/')[1];
      if (id) {
        setCertId(id);
        verifyCertificate(id);
        setTimeout(() => {
          const el = document.querySelector('.verify-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, [verifyCertificate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify();
    if (e.key === 'Escape' && certId) setCertId('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(certId.trim().toUpperCase());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (_) {
      /* clipboard unavailable — ignore */
    }
  };

  useEffect(() => {
    if (phase === 'done' && liveRegionRef.current) {
      liveRegionRef.current.textContent = `Result: ${STAMP_COPY[result]?.label ?? ''}`;
    }
  }, [phase, result]);

  const verdict = result ? STAMP_COPY[result] : null;

  return (
    <section className="verify-section">
      <style>{`
        .verify-section {
          --primary: #4508a7;
          --primary-hover: #380c80;
          --primary-tint: #EDE9FE;
          --ink: #0F172A;
          --ink-soft: #64748B;
          --bg: #F8FAFC;
          --card: #FFFFFF;
          --line: #E2E8F0;
          --field-bg: #F8FAFC;
          box-sizing: border-box;
          padding: 100px 20px;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .verify-section *, .verify-section *::before, .verify-section *::after { box-sizing: border-box; }

        .verify-container { width: 100%; max-width: 520px; text-align: center; }

        .eyebrow {
          font-size: 0.78rem; font-weight: 800; letter-spacing: 0.12em;
          color: var(--primary); margin-bottom: 14px; text-transform: uppercase;
          display: block;
        }

        .title {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: clamp(2rem, 5vw, 2.75rem);
          color: var(--ink);
          margin: 0 0 16px;
          line-height: 1.15;
        }
        .title .accent { color: var(--primary); }

        .subtitle { color: var(--ink-soft); margin: 0 0 40px; font-size: 1.05rem; line-height: 1.6; }

        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.07);
          text-align: left;
          transition: box-shadow 0.3s ease;
        }
        .glass-card.is-loading { box-shadow: 0 20px 44px -8px rgba(109,40,217,0.22); }

        .field-label {
          display: block; font-size: 0.92rem; font-weight: 700; color: var(--ink);
          margin-bottom: 10px;
        }

        .input-row { position: relative; }
        .cert-input {
          width: 100%; padding: 16px 44px 16px 20px; border-radius: 12px;
          border: 2px solid var(--line); font-size: 16px; outline: none;
          color: var(--ink); background: var(--field-bg); font-weight: 500;
          transition: all 0.3s;
        }
        .cert-input::placeholder { color: #94A3B8; }
        .cert-input:focus { border-color: var(--primary); background: #fff; }
        .cert-input.scanning { border-color: var(--primary); background: #fff; }
        .cert-input:disabled { cursor: progress; }

        .clear-btn {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          width: 26px; height: 26px; border-radius: 50%; border: none;
          background: transparent; color: var(--ink-soft); cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
          opacity: 0; pointer-events: none; transition: opacity 0.15s ease, background 0.15s ease;
        }
        .clear-btn.show { opacity: 1; pointer-events: auto; }
        .clear-btn:hover { background: var(--line); }

        .scan-beam {
          position: absolute; left: 0; top: 0; bottom: 0; width: 34%;
          background: linear-gradient(90deg, transparent, rgba(109,40,217,0.18), transparent);
          border-radius: 12px; animation: sweep 1.1s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { transform: translateX(-40%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(330%); opacity: 0; }
        }

        .hint-row { margin-top: 9px; min-height: 18px; }
        .hint-text { font-size: 0.82rem; color: var(--ink-soft); }
        .hint-text button {
          background: none; border: none; padding: 0; color: var(--primary);
          font: inherit; font-weight: 700; cursor: pointer; text-decoration: underline;
          text-underline-offset: 2px; margin-left: 2px;
        }

        .input-wrapper { display: flex; gap: 12px; margin-top: 24px; }
        .btn { padding: 16px 24px; border-radius: 12px; border: none; font-weight: 700; font-size: 0.98rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn:active { transform: translateY(1px); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-verify {
          flex: 1; background: var(--primary); color: white;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-verify:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-qr { background: var(--primary-tint); color: var(--primary); font-size: 20px; width: 56px; display: flex; align-items: center; justify-content: center; }
        .btn-qr:hover { background: #E1D6FA; }

        .btn-verify:focus-visible, .btn-qr:focus-visible, .clear-btn:focus-visible, .copy-btn:focus-visible, .reset-btn:focus-visible {
          outline: 2px solid var(--primary); outline-offset: 2px;
        }

        .spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Result */
        .result-wrap { margin-top: 30px; }
        .result-details {
          position: relative; overflow: hidden; text-align: center;
          padding: 26px 22px 22px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;
          animation: panel-in 0.3s ease;
        }
        @keyframes panel-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        .stamp-svg {
          width: 118px; height: 118px; margin: 0 auto 2px; display: block;
          animation: stamp-land 0.5s cubic-bezier(.2,1.4,.4,1) both;
        }
        @keyframes stamp-land {
          0% { transform: scale(2.4) rotate(0deg); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: scale(1) rotate(-9deg); opacity: 0.94; }
        }

        .status-badge {
          display: inline-block; padding: 6px 16px; border-radius: 50px;
          font-size: 0.8rem; font-weight: 800; margin: 6px 0 14px; letter-spacing: 0.5px;
        }

        .verdict-sub { color: #475569; font-size: 0.9rem; line-height: 1.55; max-width: 320px; margin: 0 auto; }

        .detail-row-list { margin-top: 18px; text-align: left; border-top: 1px solid #E2E8F0; padding-top: 16px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem; }
        .detail-row span:first-child { color: #64748B; }
        .detail-row span:last-child { color: #0F172A; font-weight: 600; }

        .id-chip-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 16px; padding: 10px 14px; background: #fff; border: 1px solid #E2E8F0;
          border-radius: 10px; font-size: 0.85rem; color: var(--ink); font-weight: 600; letter-spacing: 0.02em;
        }
        .copy-btn {
          border: none; background: var(--primary-tint); color: var(--primary);
          font-weight: 700; font-size: 0.78rem; padding: 6px 11px; border-radius: 7px; cursor: pointer;
        }
        .copy-btn:hover { background: #E1D6FA; }

        .reset-btn {
          margin-top: 16px; background: none; border: 2px solid #E2E8F0; color: var(--ink);
          font-weight: 700; font-size: 0.88rem; padding: 12px 16px; border-radius: 12px; cursor: pointer;
          width: 100%; transition: all 0.2s;
        }
        .reset-btn:hover { border-color: var(--primary); color: var(--primary); }

        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .stamp-svg, .result-details, .scan-beam, .spinner { animation: none !important; }
        }

        @media (max-width: 480px) {
          .verify-section { padding: 64px 16px; }
          .glass-card { padding: 28px 22px; }
        }
      `}</style>

      <div className="verify-container">
        <span className="eyebrow">Certificate Authentication</span>
        <h2 className="title">Verify Your <span className="accent">Certificate</span></h2>
        <p className="subtitle">Enter the credential ID printed on your certificate to confirm it was issued by LevLox.</p>

        <div className={`glass-card${phase === 'loading' ? ' is-loading' : ''}`}>
          <label className="field-label" htmlFor="cert-id-input">Credential ID *</label>
          <div className="input-row">
            {phase === 'loading' && <div className="scan-beam" aria-hidden="true" />}
            <input
              id="cert-id-input"
              ref={inputRef}
              className={`cert-input${phase === 'loading' ? ' scanning' : ''}`}
              placeholder="e.g. LVX-2026-000001"
              value={certId}
              onChange={(e) => { setCertId(e.target.value); if (phase === 'done') setPhase('idle'); }}
              onKeyDown={handleKeyDown}
              disabled={phase === 'loading'}
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              className={`clear-btn${certId && phase !== 'loading' ? ' show' : ''}`}
              onClick={() => setCertId('')}
              aria-label="Clear credential ID"
              tabIndex={certId ? 0 : -1}
            >
              ✕
            </button>
          </div>

          <div className="hint-row">
            <span className="hint-text">
              Demo IDs:
              <button type="button" onClick={() => setCertId('VALID')}>VALID</button>
              <button type="button" onClick={() => setCertId('REVOKED')}>REVOKED</button>
            </span>
          </div>

          <div className="input-wrapper">
            <button className="btn btn-verify" onClick={handleVerify} disabled={!certId.trim() || phase === 'loading'}>
              {phase === 'loading' ? (<><span className="spinner" /> Verifying</>) : 'Verify Now \u2192'}
            </button>
            <button className="btn btn-qr" title="Scan QR code" aria-label="Scan QR code instead">
              ⌗
            </button>
          </div>

          <div ref={liveRegionRef} className="sr-only" role="status" aria-live="polite" />

          {phase === 'done' && verdict && (
            <div className="result-wrap">
              <div className="result-details">
                <StampMark status={result} animKey={String(animKey)} />
                <div className="status-badge" style={{ background: verdict.bg, color: verdict.ink }}>
                  {result === 'valid' && '🟢 VALID CERTIFICATE'}
                  {result === 'revoked' && '⚠️ REVOKED'}
                  {result === 'invalid' && '❌ NOT FOUND'}
                </div>
                <p className="verdict-sub">
                  {result === 'valid' && 'This credential was issued by LevLox and is currently active.'}
                  {result === 'revoked' && 'This certificate was revoked and is no longer valid.'}
                  {result === 'invalid' && "We couldn't find a certificate matching that ID. Please double-check your code."}
                </p>

                {result === 'valid' && certData && (
                  <div className="detail-row-list">
                    <div className="detail-row"><span>Name</span><span>{certData.studentName}</span></div>
                    <div className="detail-row"><span>Course</span><span>{certData.courseName}</span></div>
                    <div className="detail-row"><span>Date</span><span>{certData.completionDate || certData.issueDate}</span></div>
                  </div>
                )}

                <div className="id-chip-row">
                  <span>{certId.trim().toUpperCase()}</span>
                  <button className="copy-btn" onClick={handleCopy}>{copied ? 'Copied' : 'Copy ID'}</button>
                </div>

                <button className="reset-btn" onClick={handleReset}>Check Another Certificate</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}