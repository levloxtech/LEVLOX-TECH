import React, { useState, useEffect } from 'react';

export default function PathwayDetailLayout({
  title,
  subtitle,
  backLabel,
  onBack,
  modules = [],
  activeModuleIdx,
  setActiveModuleIdx,
  isVideoLocked,
  videoUrl,
  formTitle,
  formContent,
  activeLesson,
  courseStatus
}) {
  const [mobileTab, setMobileTab] = useState('syllabus');
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = React.useRef(null);

  const normalizedStatus = String(courseStatus || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
  const isComingSoon = normalizedStatus === 'coming_soon' || !modules || modules.length === 0;

  const displayModules = modules && modules.length > 0 
    ? modules 
    : ["1. Welcome & Roadmap Briefing", "2. High-Impact Fundamentals"];

  useEffect(() => {
    setIsPlaying(false);
  }, [videoUrl]);

  useEffect(() => {
    if (containerRef.current) {
      const elementPosition = containerRef.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 80; // 80px offset for the navbar
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  const renderMaterialButton = (label, fileUrl) => {
    let href = fileUrl || '#';
    const isAvailable = !!fileUrl;
    
    if (isAvailable && fileUrl.startsWith('/api')) {
      href = `http://127.0.0.1:5000${fileUrl}`;
    }

    return (
      <a
        href={href}
        target={isAvailable ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`material-btn ${isAvailable ? '' : 'disabled'}`}
        onClick={(e) => {
          if (!isAvailable) {
            e.preventDefault();
          }
        }}
      >
        <span style={{ fontSize: '14px' }}>⬇</span>
        <span>{label}</span>
      </a>
    );
  };

  return (
    <div ref={containerRef} className="enroll-premium-wrapper">
      <style>{`
        .enroll-premium-wrapper {
          background-color: #f8fafc;
          min-height: 100vh;
          padding: 80px 0 100px 0;
          font-family: 'Inter', system-ui, sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .enroll-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 4%;
          box-sizing: border-box;
        }

        /* ─── HEADER ─── */
        .enroll-header-container {
          margin-bottom: 48px;
        }

        .back-btn-wrapper {
          text-align: left;
          margin-bottom: 24px;
        }

        .back-btn {
          background: #7c3aed;
          border: none;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          padding: 10px 20px;
          border-radius: 50px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .back-btn:hover {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }
        .back-btn:active {
          transform: translateY(0);
        }

        .course-header-area {
          text-align: center; /* PERFECTLY CENTERS THE TITLE */
        }

        .course-title {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          line-height: 1.1;
          text-transform: uppercase;
        }
        .course-subtitle {
          font-size: clamp(15px, 2vw, 18px);
          color: #475569;
          margin: 10px 0 0 0;
          font-weight: 500;
        }

        /* ─── DESKTOP 3-COLUMN LAYOUT (PERFECT PROPORTIONS) ─── */
        .enroll-layout-relative {
          position: relative;
          width: 100%;
        }

        .coming-soon-glass-overlay {
          position: absolute;
          inset: 0;
          background: rgba(248, 250, 252, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          border-radius: 24px;
        }

        .coming-soon-glass-card {
          background: #ffffff;
          padding: 60px 40px;
          border-radius: 32px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
          margin: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .coming-soon-icon-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #f3e8ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }

        .coming-soon-card-title {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .coming-soon-decor-line {
          width: 60px;
          height: 4px;
          background-color: #7c3aed;
          border-radius: 10px;
          margin-bottom: 24px;
        }

        .coming-soon-card-desc {
          font-size: 15px;
          color: #475569;
          margin: 0;
          line-height: 1.6;
          font-weight: 500;
        }

        .enroll-layout {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) minmax(400px, 2fr) minmax(300px, 1fr);
          gap: 32px;
          align-items: start;
        }

        /* ─── UI PANELS ─── */
        .ui-panel {
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          padding: 28px 24px;
          box-sizing: border-box;
          width: 100%;
        }

        .col-syllabus { position: sticky; top: 100px; }
        .col-video { width: 100%; }
        .col-form { position: sticky; top: 100px; }

        .panel-title {
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
        }

        .form-title {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 28px;
          line-height: 1.3;
        }

        /* ─── SYLLABUS LIST ─── */
        .syllabus-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .syllabus-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          background-color: transparent;
          color: #475569;
          text-align: left;
          width: 100%;
        }
        .syllabus-item.active {
          background-color: #f3e8ff;
          color: #6b21e8;
          border-color: #e9d5ff;
        }
        .syllabus-item:hover:not(.active) {
          background-color: #f8fafc;
        }

        /* ─── VIDEO PLAYER ─── */
        .video-container {
          width: 100%;
          aspect-ratio: 16/9;
          background-color: #0f172a;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }

        .video-locked-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
          padding: 24px;
        }

        .play-btn {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #6b21e8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 28px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(107, 33, 232, 0.4);
          transition: transform 0.2s ease;
        }
        .play-btn:hover { transform: scale(1.05); }

        /* ─── FORM ELEMENTS ─── */
        .f-group { margin-bottom: 20px; }
        .f-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }
        .f-input {
          width: 100%;
          padding: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          box-sizing: border-box;
        }
        .f-input:focus {
          outline: none;
          border-color: #6b21e8;
          background: #ffffff;
        }
        
        .f-submit {
          width: 100%;
          padding: 16px;
          background-color: #0f172a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .f-submit:hover { background-color: #1e293b; }

        /* ─── IOS STYLE SEGMENTED CONTROL (MOBILE) ─── */
        .mobile-tab-nav {
          display: none;
          background: #e2e8f0;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        
        .tab-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          background: transparent;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .material-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          color: #1e293b;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          justify-content: flex-start;
          cursor: pointer;
        }
        .material-btn:hover:not(.disabled) {
          border-color: #6b21e8;
          color: #6b21e8;
          box-shadow: 0 4px 12px rgba(107, 33, 232, 0.08);
          transform: translateY(-1px);
        }
        .material-btn.disabled {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* ─── RESPONSIVE RULES ─── */
        @media (max-width: 1024px) {
          .enroll-layout { grid-template-columns: 280px 1fr 300px; gap: 20px; }
        }

        @media (max-width: 850px) {
          .enroll-premium-wrapper { padding: 40px 0 60px 0; }
          .enroll-header-container { margin-bottom: 24px; }
          
          /* Switch to Mobile Stacked View */
          .enroll-layout { display: flex; flex-direction: column; gap: 20px; }
          
          /* 1. Video on top ONLY on mobile */
          .col-video { order: -1; }
          
          /* 2. Tabs below video */
          .mobile-tab-nav { display: flex; order: 0; }

          /* 3. Logic to hide/show active column */
          .col-syllabus, .col-form { position: static; width: 100%; order: 1; display: none; }
          .col-syllabus.mobile-active, .col-form.mobile-active { display: block; }
          
          /* Soften panels for mobile */
          .ui-panel { padding: 20px 16px; border-radius: 12px; }
        }
      `}</style>

      <div className="enroll-container">
        
        {/* Header Block */}
        <div className="enroll-header-container">
          <div className="back-btn-wrapper">
            <button onClick={onBack} className="back-btn">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>{backLabel ? backLabel.replace(/^[←\s-]+/, '') : 'Back'}</span>
            </button>
          </div>
          <div className="course-header-area">
            <h1 className="course-title">{title}</h1>
            <p className="course-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="enroll-layout-relative">
          {isComingSoon && (
            <div className="coming-soon-glass-overlay">
              <div className="coming-soon-glass-card">
                <div className="coming-soon-icon-circle">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                  </svg>
                </div>
                <h2 className="coming-soon-card-title">COMING SOON</h2>
                <div className="coming-soon-decor-line"></div>
                <p className="coming-soon-card-desc">
                  This training track is currently under development. Stay tuned for expert syllabus videos, curated notes, and interactive projects!
                </p>
              </div>
            </div>
          )}

          <div 
            className="enroll-layout" 
            style={isComingSoon ? { filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' } : {}}
          >
            
            {/* MOBILE TABS (Hidden on Desktop) */}
            <div className="mobile-tab-nav">
              <button 
                className={`tab-btn ${mobileTab === 'syllabus' ? 'active' : ''}`}
                onClick={() => setMobileTab('syllabus')}
              >
                Course Details
              </button>
              <button 
                className={`tab-btn ${mobileTab === 'form' ? 'active' : ''}`}
                onClick={() => setMobileTab('form')}
              >
                Get Guidance
              </button>
            </div>

            {/* COLUMN 1: SYLLABUS */}
            <div className={`col-syllabus ui-panel ${mobileTab === 'syllabus' ? 'mobile-active' : ''}`}>
              <h3 className="panel-title">Curriculum Modules</h3>
              <div className="syllabus-list">
                {displayModules.map((mod, i) => (
                  <button
                    key={i}
                    className={`syllabus-item ${activeModuleIdx === i ? 'active' : ''}`}
                    onClick={() => setActiveModuleIdx(i)}
                  >
                    <span>{!isVideoLocked || i === 0 ? '▶' : '🔒'}</span>
                    <span style={{ lineHeight: '1.4' }}>{mod}</span>
                  </button>
                ))}
              </div>
            </div>


          {/* COLUMN 2: VIDEO PLAYER */}
          <div className="col-video">
            <div className="video-container" style={{ position: 'relative' }}>
              {isVideoLocked && activeModuleIdx > 0 ? (
                <div className="video-locked-overlay">
                  <span style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</span>
                  <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0' }}>
                    COMING SOON
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, maxWidth: '300px' }}>
                    Modules for this track are being finalized.
                  </p>
                </div>
              ) : !isPlaying ? (
                <div 
                  onClick={() => setIsPlaying(true)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '20px',
                    textAlign: 'center',
                    zIndex: 10
                  }}
                >
                  {/* Pulsing Play Button */}
                  <div 
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      backgroundColor: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 25px rgba(124, 58, 237, 0.4)',
                      color: '#ffffff',
                      fontSize: '28px',
                      marginBottom: '16px'
                    }}
                  >
                    ▶
                  </div>
                  <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
                    Play Training Video
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                    Click to start watching the lesson video
                  </p>
                </div>
              ) : (
                videoUrl ? (
                  videoUrl.toLowerCase().endsWith('.mp4') ||
                  videoUrl.toLowerCase().endsWith('.webm') ||
                  videoUrl.toLowerCase().endsWith('.ogg') ||
                  videoUrl.includes('w3schools.com') ||
                  videoUrl.includes('/uploads/') ? (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      controlsList="nodownload"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                    />
                  ) : (
                    <iframe
                      src={(() => {
                        const sep = videoUrl.includes('?') ? '&' : '?';
                        return `${videoUrl}${sep}autoplay=1`;
                      })()}
                      title={title}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="autoplay"
                      allowFullScreen
                    ></iframe>
                  )
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="play-btn">▶</div>
                  </div>
                )
              )}
            </div>

            {/* Lesson Materials Section */}
            <div className="materials-section ui-panel" style={{ marginTop: '24px' }}>
              <h4 className="panel-title" style={{ marginBottom: '16px', borderBottom: 'none', paddingBottom: 0 }}>Lesson Materials</h4>
              <div className="materials-grid">
                {renderMaterialButton("Download PDF", activeLesson?.pdf_file || activeLesson?.pdf_url)}
                {renderMaterialButton("Download Notes", activeLesson?.notes_file || activeLesson?.code_url)}
                {renderMaterialButton("Download Assignment", activeLesson?.assignment_file)}
                {renderMaterialButton("Download Resources", activeLesson?.resources_file || activeLesson?.files_url)}
              </div>
            </div>
          </div>

          {/* COLUMN 3: FORM */}
          <div className={`col-form ui-panel ${mobileTab === 'form' ? 'mobile-active' : ''}`}>
            <h3 className="form-title">{formTitle}</h3>
            {formContent}
          </div>

        </div>
      </div>
    </div>
  </div>
);
}
