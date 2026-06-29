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

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes('vimeo.com')) {
      if (!url.includes('player.vimeo.com/video/')) {
        const matches = url.match(/vimeo\.com\/(\d+)/);
        if (matches && matches[1]) {
          return `https://player.vimeo.com/video/${matches[1]}`;
        }
      }
    }
    return url;
  };

  const getMaterialInfo = (type, url, source) => {
    if (!url) return { label: `No ${type}`, icon: '❌', href: '#', isAvailable: false };
    
    let href = url;
    if (url.startsWith('/api')) {
      href = `http://127.0.0.1:5000${url}`;
    }
    
    const src = (source || '').toLowerCase();
    
    if (type === 'PDF') {
      const isOpen = src === 'external' || url.toLowerCase().endsWith('.pdf') || url.includes('.pdf');
      return {
        label: isOpen ? "Open PDF" : "Download PDF",
        icon: "📄",
        href,
        isAvailable: true
      };
    }
    
    if (type === 'Code') {
      const isGitHub = src === 'github' || url.includes('github.com');
      return {
        label: isGitHub ? "Open Repository" : "Download ZIP",
        icon: isGitHub ? "📁" : "⬇",
        href,
        isAvailable: true
      };
    }
    
    if (type === 'Project') {
      const isCloud = ['gdrive', 'onedrive', 'dropbox', 'github_release', 'external'].includes(src) || 
                      url.includes('drive.google') || url.includes('dropbox.com') || 
                      url.includes('onedrive') || url.includes('1drv.ms') || url.includes('sharepoint.com') ||
                      url.includes('github.com') && url.includes('/releases');
      return {
        label: isCloud ? "Open/Preview" : "Download ZIP",
        icon: isCloud ? "👁" : "⬇",
        href,
        isAvailable: true
      };
    }
    
    return {
      label: `Download ${type}`,
      icon: "⬇",
      href,
      isAvailable: true
    };
  };

  const renderMaterialButton = (type, fileUrl, source) => {
    const info = getMaterialInfo(type, fileUrl, source);
    
    return (
      <a
        href={info.href}
        target={info.isAvailable ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`material-btn ${info.isAvailable ? '' : 'disabled'}`}
        onClick={(e) => {
          if (!info.isAvailable) {
            e.preventDefault();
          }
        }}
      >
        <span style={{ fontSize: '14px' }}>{info.icon}</span>
        <span>{info.label}</span>
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
          font-family: 'Satoshi', 'Plus Jakarta Sans', system-ui, sans-serif;
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
          background: radial-gradient(circle at center, rgba(124, 58, 237, 0.08) 0%, rgba(248, 250, 252, 0.7) 100%);
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
          padding: 56px 48px;
          border-radius: 28px;
          max-width: 460px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.08);
          margin: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .coming-soon-card-title {
          font-size: 32px;
          font-weight: 850;
          color: #0b132b; /* Dark Navy Typography */
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .coming-soon-card-desc {
          font-size: 14px;
          color: #475569;
          margin: 0;
          line-height: 1.6;
          font-weight: 500;
          font-family: 'Satoshi', 'Plus Jakarta Sans', system-ui, sans-serif;
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
          .enroll-premium-wrapper { padding: 100px 0 60px 0; }
          .enroll-header-container { margin-bottom: 24px; }
          
          .back-btn-wrapper {
            padding-left: 8px;
            margin-bottom: 20px;
          }
          .back-btn span {
            display: none;
          }
          .back-btn {
            padding: 10px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          
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
                <h2 className="coming-soon-card-title">COMING SOON</h2>
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
              ) : !isPlaying ? (() => {
                const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
                const isVimeo = videoUrl && videoUrl.includes('vimeo.com');

                // Extract YouTube video ID for thumbnail
                let ytThumb = '';
                if (isYouTube) {
                  let ytId = '';
                  if (videoUrl.includes('youtube.com/watch')) {
                    try { ytId = new URLSearchParams(new URL(videoUrl).search).get('v') || ''; } catch(e) {}
                  } else if (videoUrl.includes('youtu.be/')) {
                    ytId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
                  } else if (videoUrl.includes('youtube.com/embed/')) {
                    ytId = videoUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
                  }
                  if (ytId) ytThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                }

                return (
                  <div
                    onClick={() => setIsPlaying(true)}
                    style={{
                      position: 'absolute', inset: 0,
                      background: ytThumb ? 'transparent' : 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', userSelect: 'none',
                      padding: '20px', textAlign: 'center', zIndex: 10
                    }}
                  >
                    {/* YouTube Thumbnail Background */}
                    {ytThumb && (
                      <img
                        src={ytThumb}
                        alt="Video thumbnail"
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover', opacity: 0.85
                        }}
                      />
                    )}

                    {/* Dark overlay for readability on thumbnails */}
                    {ytThumb && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                      }} />
                    )}

                    {/* Platform Badge */}
                    {(isYouTube || isVimeo) && (
                      <div style={{
                        position: 'absolute', top: '12px', left: '12px', zIndex: 20,
                        background: isYouTube ? '#FF0000' : '#1ab7ea',
                        color: '#fff', fontSize: '9px', fontWeight: '900',
                        padding: '3px 8px', borderRadius: '4px',
                        letterSpacing: '0.5px', textTransform: 'uppercase'
                      }}>
                        {isYouTube ? '▶ YouTube' : '● Vimeo'}
                      </div>
                    )}

                    {/* Play Button Circle */}
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      backgroundColor: isYouTube ? '#FF0000' : '#7c3aed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isYouTube ? '0 10px 25px rgba(255,0,0,0.5)' : '0 10px 25px rgba(124, 58, 237, 0.4)',
                      color: '#ffffff', fontSize: '28px', marginBottom: '12px',
                      position: 'relative', zIndex: 20
                    }}>
                      ▶
                    </div>

                    <h3 style={{
                      color: '#ffffff', fontSize: '16px', fontWeight: '800',
                      margin: '0 0 4px 0', position: 'relative', zIndex: 20,
                      textShadow: '0 1px 4px rgba(0,0,0,0.6)'
                    }}>
                      {isYouTube ? 'Watch on YouTube' : isVimeo ? 'Watch on Vimeo' : 'Play Training Video'}
                    </h3>
                    <p style={{
                      color: '#e2e8f0', fontSize: '12px', margin: 0,
                      position: 'relative', zIndex: 20,
                      textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                    }}>
                      Click to start watching the lesson video
                    </p>
                  </div>
                );
              })() : (
                videoUrl ? (
                  activeLesson?.videoSource === 'upload' ||
                  (!activeLesson?.videoSource && (
                    videoUrl.toLowerCase().endsWith('.mp4') ||
                    videoUrl.toLowerCase().endsWith('.webm') ||
                    videoUrl.toLowerCase().endsWith('.ogg') ||
                    videoUrl.includes('w3schools.com') ||
                    videoUrl.includes('/uploads/')
                  )) ? (
                    <video
                      src={videoUrl.startsWith('/api') ? `http://127.0.0.1:5000${videoUrl}` : videoUrl}
                      controls
                      autoPlay
                      controlsList="nodownload"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                    />
                  ) : (
                    <iframe
                      src={(() => {
                        const embed = getEmbedUrl(videoUrl);
                        const sep = embed.includes('?') ? '&' : '?';
                        return `${embed}${sep}autoplay=1`;
                      })()}
                      title={title}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="autoplay; encrypted-media"
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
                {renderMaterialButton("PDF", activeLesson?.pdf_file || activeLesson?.pdf_url || activeLesson?.notesUrl, activeLesson?.notesSource)}
                {renderMaterialButton("Code", activeLesson?.notes_file || activeLesson?.code_url || activeLesson?.sourceCodeUrl, activeLesson?.sourceCodeSource)}
                {renderMaterialButton("Assignment", activeLesson?.assignment_file)}
                {renderMaterialButton("Project", activeLesson?.resources_file || activeLesson?.files_url || activeLesson?.projectUrl, activeLesson?.projectSource)}
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
