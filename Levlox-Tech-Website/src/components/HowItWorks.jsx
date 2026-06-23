import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      title: 'Learn',
      desc: 'Master in-demand skills',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      )
    },
    {
      title: 'Build',
      desc: 'Develop real-world projects',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      )
    },
    {
      title: 'Prepare',
      desc: 'Clear technical & HR rounds',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )
    },
    {
      title: 'Simulate',
      desc: 'Pass brutal mock interviews',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      title: 'Hired',
      desc: 'Pursue top job opportunities',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
      isFinal: true
    }
  ];

  return (
    <section id="how-it-works" className="elegant-roadmap">
      <style>{`
        .elegant-roadmap {
          background-color: #ffffff;
          padding: 120px max(4%, 20px);
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        /* ─── HEADER ─── */
        .er-header {
          text-align: center;
          margin-bottom: 120px;
        }
        .er-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #6b21e8;
          margin-bottom: 16px;
          display: block;
        }
        .er-title {
          font-size: clamp(42px, 4vw, 48px);
          font-weight: 500; 
          color: #0f172a;
          letter-spacing: -1px;
          margin: 0;
        }
        .er-title strong {
          font-weight: 800;
        }

        /* ─── TIMELINE CONTAINER ─── */
        .er-timeline {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
          height: 240px; 
          display: flex;
          align-items: center;
        }

        /* ─── THE MAIN THIN LINE ─── */
        .er-line-track {
          position: absolute;
          top: 50%;
          left: 40px;
          right: 40px;
          height: 2px;
          background: #e2e8f0;
          transform: translateY(-50%);
          z-index: 1;
        }
        .er-line-progress {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 100%;
          background: linear-gradient(90deg, #c084fc, #6b21e8, #fbbf24);
          z-index: 2;
        }

        /* ─── THE NODES & CONTENT ─── */
        .er-nodes {
          display: flex;
          justify-content: space-between;
          width: 100%;
          position: relative;
          z-index: 3;
        }

        .er-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px; 
        }

        /* The Main Icon Circle (Replaces the tiny dots entirely) */
        .er-icon {
          width: 64px;
          height: 64px;
          background: #faf5ff; /* Soft pastel purple from screenshot */
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b21e8;
          box-shadow: 0 0 0 8px #ffffff; /* Creates space around icon to cut the line */
          z-index: 5;
          transition: all 0.3s ease;
        }
        .er-icon svg {
          width: 24px;
          height: 24px;
        }
        
        .er-step:hover .er-icon {
          background: #6b21e8;
          color: #ffffff;
          transform: scale(1.1);
          box-shadow: 0 0 0 8px #ffffff, 0 10px 25px rgba(107, 33, 232, 0.2);
        }

        /* Text positioning */
        .er-text {
          position: absolute;
          width: 220px;
          text-align: center;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .er-text h3 {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        .er-text p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Alternating text top and bottom */
        .er-step.top .er-text {
          bottom: calc(100% + 20px);
        }
        .er-step.bottom .er-text {
          top: calc(100% + 20px);
        }

        /* ─── FINAL HIGHLIGHT STEP ─── */
        .er-step.final .er-icon {
          background: #6b21e8;
          color: #ffffff;
          box-shadow: 0 0 0 8px #ffffff, 0 8px 20px rgba(107, 33, 232, 0.2);
        }
        .er-step.final:hover .er-icon {
          background: #5b21b6;
          transform: scale(1.1);
        }

        /* ─── RESPONSIVE VERTICAL TIMELINE ─── */
        @media (max-width: 900px) {
          .er-header {
            margin-bottom: 60px;
          }
          .er-timeline {
            height: auto;
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 0 20px 20px;
          }
          
          /* The line becomes vertical */
          .er-line-track {
            top: 0; 
            bottom: 0; 
            left: 51px; /* Perfectly centers behind the 64px icon */
            right: auto; 
            width: 2px; 
            height: 100%; 
            transform: none;
          }
          .er-line-progress {
            background: linear-gradient(180deg, #c084fc, #6b21e8, #fbbf24);
          }
          
          .er-nodes {
            flex-direction: column;
            gap: 48px;
          }
          
          .er-step {
            width: 100%;
            flex-direction: row;
            justify-content: flex-start;
          }
          
          .er-icon {
            flex-shrink: 0;
          }
          
          /* Text resets to standard left-alignment */
          .er-text {
            position: static;
            width: auto;
            text-align: left;
            margin-left: 24px;
          }
        }
      `}</style>

      <div className="er-header">
        <h2 className="er-title">Your 90 Day Path To Becoming <strong>Interview Ready</strong></h2>
      </div>

      <div className="er-timeline">
        {/* The thin line */}
        <div className="er-line-track">
          <div className="er-line-progress"></div>
        </div>

        <div className="er-nodes">
          {steps.map((step, index) => (
            <div key={index} className={`er-step ${index % 2 === 0 ? 'top' : 'bottom'} ${step.isFinal ? 'final' : ''}`}>
              
              {/* Massive Icon - No tiny dots! */}
              <div className="er-icon">{step.icon}</div>
              
              {/* Text Body */}
              <div className="er-text">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}