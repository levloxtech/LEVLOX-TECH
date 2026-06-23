import React from 'react';

export default function Founder() {
  return (
    <section id="founder-story" className="founder-section">
      <style>{`
        .founder-section {
          padding: 60px 0; /* Reduced from 120px */
          background-color: #ffffff;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle background glow */
        .founder-section::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(107, 33, 232, 0.05) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .founder-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 5%;
          position: relative;
          z-index: 2;
        }

        /* ─── HEADER ─── */
        .fs-label {
          display: inline-block;
          color: #6b21e8;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-size: 0.85rem;
          margin-bottom: 20px;
          background: #f3e8ff;
          padding: 6px 16px;
          border-radius: 50px;
        }

        .fs-title {
          font-size: clamp(32px, 4.5vw, 48px);
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -1px;
          line-height: 1.15;
          margin: 0 0 32px 0;
        }

        .fs-title span {
          color: #6b21e8;
        }

        /* ─── CONTENT ─── */
        .fs-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-left: 4px solid #e2e8f0;
          padding-left: 32px;
        }

        .fs-paragraph {
          font-size: clamp(16px, 2vw, 18px);
          color: #475569;
          line-height: 1.7;
          margin: 0;
        }

        .fs-paragraph strong {
          color: #0f172a;
          font-weight: 700;
        }

        /* ─── FOUNDER SIGNATURE AREA ─── */
        .fs-footer {
          margin-top: 32px; /* Tightened */
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .fs-avatar-group {
          display: flex;
        }
        .fs-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #e2e8f0;
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #64748b;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .fs-avatar:nth-child(2) {
          margin-left: -16px;
          background: #f8fafc;
        }

        .fs-footer-text {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .fs-footer-sub {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          text-transform: none;
          letter-spacing: 0;
        }

        /* ─── MOBILE BREAKPOINTS ─── */
        @media (max-width: 640px) {
          .founder-section {
            padding: 40px 0; /* Tighter on mobile too */
          }
          .fs-content {
            border-left: none;
            padding-left: 0;
          }
          .fs-title {
            margin-bottom: 24px;
          }
        }
      `}</style>

      <div className="founder-container">
        
        <div className="fs-label">Our Story</div>
        
        <h2 className="fs-title">
          The goal isn't just to get a job. It's to build a career <span>you don't want to escape from.</span>
        </h2>

        <div className="fs-content">
          <p className="fs-paragraph">
            Most people are taught how to learn technical skills, but very few are taught how careers actually work—how companies hire, how promotions happen, and how top performers create their own opportunities. 
          </p>
          
          <p className="fs-paragraph">
            <strong>Levlox was created to bridge that exact gap.</strong> Built by a career strategist and a passionate educator, we believe career growth shouldn't rely on luck, guesswork, or scattered advice. It requires the right skills, practical experience, and structured execution.
          </p>

          <p className="fs-paragraph">
            Whether you're landing your first role, transitioning into a top product company, or working toward long-term growth, our mission is simple: to remove the guesswork and help you navigate your career with confidence.
          </p>
        </div>

        <div className="fs-footer">
          <div className="fs-avatar-group">
            <div className="fs-avatar">👤</div>
            <div className="fs-avatar">👤</div>
          </div>
          <div className="fs-footer-text">
            The Levlox Founders
            <span className="fs-footer-sub">Strategy & Education</span>
          </div>
        </div>

      </div>
    </section>
  );
}