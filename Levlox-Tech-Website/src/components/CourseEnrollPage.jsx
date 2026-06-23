import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function CourseEnrollPage({ course, onBack }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userType, setUserType] = useState('Student');
  const [resumeFile, setResumeFile] = useState(null);
  
  // Navigation states
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [expandedModules, setExpandedModules] = useState({ 0: true });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${course._id || course.id}/player`);
        if (res.data && res.data.status === 'success') {
          setModules(res.data.modules || []);
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayerData();
  }, [course]);

  const toggleModule = (idx) => {
    setExpandedModules((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleLessonChange = (moduleIdx, lessonIdx) => {
    setActiveModuleIdx(moduleIdx);
    setActiveLessonIdx(lessonIdx);
  };

  // Handle Mentorship form submission (auto-unlocks enrollment)
  const handleMentorshipSubmit = async (e) => {
    e.preventDefault();
    if (!userName || !userEmail || !userPhone) {
      alert('Please fill in all details to submit mentorship request!');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', userName);
      formData.append('email', userEmail);
      formData.append('phone', userPhone);
      formData.append('targetCompany', course.title.replace(/[^a-zA-Z0-9\s]/g, '').trim());
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      formData.append('additionalInfo', `Type: ${userType}`);

      const res = await api.post('/resume-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        setIsEnrolled(true);
        alert('Your mentorship request has been submitted! Playbook content is unlocked.');
      } else {
        alert(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to register request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeModule = modules[activeModuleIdx];
  const activeLesson = activeModule && activeModule.lessons && activeModule.lessons[activeLessonIdx];

  // All lessons are free to navigate for preview, but video player blocks if not enrolled
  const isLocked = !isEnrolled && activeModuleIdx > 0;

  return (
    <div className="player-page-container">
      <style>{`
        .player-page-container {
          padding-top: 70px;
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
        }

        .player-header-bar {
          background-color: #ffffff;
          padding: 16px 40px;
          border-bottom: 1.5px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-btn {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 10px 20px;
          border-radius: 10px;
          color: #475569;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: #e2e8f0;
        }

        .player-workspace {
          display: flex;
          flex: 1;
          min-height: calc(100vh - 73px);
        }

        /* ─── MODULES SIDEBAR (LEFT) ─── */
        .player-sidebar {
          width: 300px;
          background: #0f172a;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          padding: 32px 0;
          flex-shrink: 0;
        }

        .sidebar-menu {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .module-accordion-group {
          display: flex;
          flex-direction: column;
        }

        .module-header {
          width: 100%;
          background: none;
          border: none;
          text-align: left;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 16px 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #1e293b;
          color: #cbd5e1;
          box-sizing: border-box;
          transition: background 0.2s, color 0.2s;
        }
        .module-header:hover {
          background: #1e293b;
          color: #ffffff;
        }
        .module-header.active {
          background: #1e293b;
          color: #ffffff;
          font-weight: 700;
        }

        .lesson-list {
          background: #0b1120;
          padding: 12px 24px 16px 56px;
          border-bottom: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lesson-btn {
          width: 100%;
          background: none;
          border: none;
          text-align: left;
          padding: 6px 0;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          transition: color 0.2s;
        }
        .lesson-btn.active {
          color: #ffffff;
          font-weight: 700;
        }
        .lesson-btn:hover {
          color: #ffffff;
        }

        /* ─── CENTRAL PLAYER STAGE (CENTER) ─── */
        .player-stage {
          flex: 1;
          padding: 40px;
          background: #f1f5f9;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .video-box {
          width: 100%;
          aspect-ratio: 16/9;
          background: #000000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          position: relative;
        }

        .custom-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(45deg, #0f172a, #1e293b);
        }

        .round-play-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #6b21e8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 32px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(107, 33, 232, 0.5);
          transition: transform 0.2s;
        }
        .round-play-btn:hover {
          transform: scale(1.05);
        }

        .lesson-materials-container {
          margin-top: 32px;
          text-align: left;
        }

        .lesson-materials-title {
          font-size: 1.25rem;
          font-weight: 900;
          margin-bottom: 16px;
          color: #0f172a;
        }

        .material-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 12px 20px;
          border-radius: 10px;
          color: #0f172a;
          font-weight: 800;
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .material-download-btn:hover {
          border-color: #94a3b8;
          background-color: #f8fafc;
        }

        /* ─── MENTORSHIP SIDEBAR (RIGHT) ─── */
        .player-lead-panel {
          width: 400px;
          background: #ffffff;
          border-left: 1.5px solid #e2e8f0;
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow-y: auto;
          flex-shrink: 0;
        }

        .mentorship-badge {
          background: #f3e8ff;
          color: #6b21e8;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 20px;
          font-size: 0.85rem;
          display: inline-block;
          width: 100%;
          letter-spacing: 1px;
          box-sizing: border-box;
        }

        .mentorship-title {
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 32px;
          text-align: center;
          color: #0f172a;
          line-height: 1.3;
        }

        .form-group {
          margin-bottom: 16px;
          text-align: left;
        }
        .form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }
        .form-group input, .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 500;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: #6b21e8;
          background: #ffffff;
        }

        .btn-mentorship-submit {
          width: 100%;
          padding: 18px;
          background: #0f172a;
          color: #ffffff;
          font-weight: 900;
          font-size: 1.1rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.3s;
        }
        .btn-mentorship-submit:hover {
          background: #1e293b;
        }

        .locked-stage {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 15px 35px -10px rgba(0,0,0,0.05);
        }

        @media (max-width: 1100px) {
          .player-workspace {
            flex-direction: column;
          }
          .player-sidebar, .player-lead-panel {
            width: 100%;
            border: none;
          }
          .player-sidebar {
            border-bottom: 1px solid #e2e8f0;
          }
          .player-lead-panel {
            border-top: 1px solid #e2e8f0;
          }
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="player-header-bar">
        <div style={{ fontWeight: '900', fontSize: '1.5rem', color: '#0f172a' }}>
          Levlox Tech
        </div>
        <div style={{ fontWeight: '800', color: '#4f46e5', fontSize: '1.2rem', textTransform: 'uppercase' }}>
          {course.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()} Playbook
        </div>
        <button className="back-btn" onClick={onBack}>
          ← Exit Pathway
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-xs font-bold tracking-widest uppercase flex-1 flex items-center justify-center">
          Loading player modules...
        </div>
      ) : (
        <div className="player-workspace">
          {/* LEFT SIDEBAR (Syllabus) */}
          <div className="player-sidebar">
            <div style={{ padding: '0 24px', marginBottom: '24px', fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>
              Course Syllabus
            </div>

            <div className="sidebar-menu">
              {modules.map((mod, mIdx) => {
                const isExpanded = !!expandedModules[mIdx];
                return (
                  <div key={mod._id} className="module-accordion-group">
                    <button
                      className={`module-header ${activeModuleIdx === mIdx ? 'active' : ''}`}
                      onClick={() => toggleModule(mIdx)}
                    >
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: activeModuleIdx === mIdx ? '#4f46e5' : '#334155', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '10px', 
                        marginRight: '16px', 
                        fontWeight: 'bold', 
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s',
                        color: '#fff',
                        flexShrink: 0
                      }}>
                        ▶
                      </div>
                      <span className="truncate" style={{ flex: 1 }}>{mod.title}</span>
                    </button>

                    {isExpanded && (
                      <div className="lesson-list">
                        {mod.lessons && mod.lessons.map((lesson, lIdx) => {
                          const isSelected = activeModuleIdx === mIdx && activeLessonIdx === lIdx;
                          return (
                            <button
                              key={lesson._id}
                              className={`lesson-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => handleLessonChange(mIdx, lIdx)}
                            >
                              <span style={{ marginRight: '10px', fontSize: '12px', color: '#4f46e5', marginTop: '2px' }}>📄</span>
                              <span className="truncate" style={{ flex: 1, lineHeight: '1.4' }}>
                                {lesson.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="player-stage">
            {isLocked ? (
              <div className="locked-stage">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px', color: '#0f172a' }}>Module Content Locked</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                  This syllabus block contains premium scaling content. Please fill in your student details on the right to unlock all training resources instantly.
                </p>
              </div>
            ) : (
              activeLesson ? (
                <div>
                  <h2 style={{ 
                    fontFamily: '"Times New Roman", Times, Georgia, serif',
                    fontSize: '32px', 
                    fontWeight: '800', 
                    marginTop: '26.56px',
                    marginBottom: '24px', 
                    color: '#0F172A' 
                  }}>
                    {course.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}: {activeModule ? activeModule.title.replace(/Module \d+:\s*/, '') : ''}
                  </h2>
                  
                  <div className="video-box" style={{ background: '#1e293b' }}>
                    {activeLesson.video_url ? (
                      <iframe
                        src={activeLesson.video_url}
                        title={activeLesson.title}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="custom-play-overlay" style={{ background: '#1e293b' }}>
                        <div className="round-play-btn" style={{ fontSize: '1rem', width: 'auto', padding: '0 24px', borderRadius: '50px' }}>Play Video</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '24px', textSelf: 'left', textAlign: 'left' }}>
                    <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.6' }}>
                      {activeLesson.description || 'Welcome to this lesson. Review the video material above to complete this segment.'}
                    </p>
                  </div>

                  {/* Dynamic Materials Downloads Section */}
                  <div className="lesson-materials-container">
                    <h3 className="lesson-materials-title">Lesson Materials</h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                      <a 
                        href={activeLesson.pdf_url || '#'} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="material-download-btn"
                        style={{ opacity: activeLesson.pdf_url ? 1 : 0.5, pointerEvents: activeLesson.pdf_url ? 'auto' : 'none' }}
                      >
                        Download PDF
                      </a>
                      <a 
                        href={activeLesson.pdf_url || '#'} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="material-download-btn"
                        style={{ opacity: activeLesson.pdf_url ? 1 : 0.5, pointerEvents: activeLesson.pdf_url ? 'auto' : 'none' }}
                      >
                        Download Notes
                      </a>
                      <a 
                        href={activeLesson.code_url || '#'} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="material-download-btn"
                        style={{ opacity: activeLesson.code_url ? 1 : 0.5, pointerEvents: activeLesson.code_url ? 'auto' : 'none' }}
                      >
                        Download Assignment
                      </a>
                      <a 
                        href={activeLesson.files_url || '#'} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="material-download-btn"
                        style={{ opacity: activeLesson.files_url ? 1 : 0.5, pointerEvents: activeLesson.files_url ? 'auto' : 'none' }}
                      >
                        Download Resources
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <p style={{ color: '#64748b' }}>Select a lesson from the syllabus sidebar to play.</p>
                </div>
              )
            )}
          </div>

          {/* RIGHT SIDEBAR (Mentorship Form) */}
          <div className="player-lead-panel">
            <span className="mentorship-badge">1-ON-1 MENTORSHIP</span>
            
            <h3 className="mentorship-title">
              Need Personalized Help Getting Into <span style={{ color: '#4f46e5' }}>{course.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}</span>?
            </h3>
            
            <form onSubmit={handleMentorshipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="John" 
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  placeholder="john@gmail.com" 
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  required 
                  value={userPhone} 
                  onChange={(e) => setUserPhone(e.target.value)} 
                  placeholder="+91 98765 43210" 
                />
              </div>

              <div className="form-group">
                <label>I am a...</label>
                <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                  <option value="Student">Student</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>

              <div className="form-group">
                <label>Upload Resume *</label>
                <input 
                  type="file" 
                  required={!isEnrolled} 
                  accept=".pdf,.doc,.docx" 
                  onChange={(e) => setResumeFile(e.target.files[0])} 
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-mentorship-submit">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}