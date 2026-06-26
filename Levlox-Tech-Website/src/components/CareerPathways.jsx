import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import PathwayDetailLayout from './PathwayDetailLayout';

const syllabusData = {
  'GET HIRED': {
    title: 'GET HIRED',
    subtitle: 'The Hiring Formula',
    isAvailable: true,
    modules: [
      'How ATS Actually Works',
      'The 7 Second Resume Rule',
      'Red Flag Detection System',
      'Hireability Score Formula',
      'Referral Gatekeeper System',
      'Salary Negotiation Psychology'
    ]
  },
  'GET PROMOTED': {
    title: 'GET PROMOTED',
    subtitle: 'The Career Acceleration Formula',
    isAvailable: false,
    modules: [
      'The 3 Hidden Career Ladders',
      'Promotion Velocity Formula',
      'Decoding Your Manager’s Brain',
      'The Decision Matrix System',
      'Strategic Job Hopping',
      'Building Network Leverage'
    ]
  },
  'ESCAPE SERVICE COMPANIES': {
    title: 'ESCAPE SERVICE COMPANIES',
    subtitle: 'The Product Company Formula',
    isAvailable: false,
    modules: [
      'The 18-Month Escape Plan',
      'Skills Arbitrage Strategy',
      'Portfolio Acceleration',
      'LeetCode & Systems Design',
      'Internal Corporate Positioning',
      'The Strategic Jumping Framework',
      'Cracking the Product Interview',
      'Multi-Offer Negotiation'
    ]
  },
  'ELITE ENGINEER': {
    title: 'ELITE ENGINEER',
    subtitle: 'The Top 1% Formula',
    isAvailable: false,
    modules: [
      "The Engineer's Resilience Framework",
      'Senior Problem Solving Mentality',
      'Advanced Systems Thinking',
      'Influence Without Authority',
      'Flawless Execution Framework',
      'Scaling Your Technical Impact'
    ]
  }
};

export default function CareerPathways({ onSelectCourse, onDetailActive }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem('careerPathways_activeIndex');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [selectedDetailCourseId, setSelectedDetailCourseId] = useState(null);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);

  // Dynamic detail states
  const [detailCourseData, setDetailCourseData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userType, setUserType] = useState('Student');
  const [resumeFile, setResumeFile] = useState(null);
  const [userGoal, setUserGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadConfig, setUploadConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/settings/upload-config');
        setUploadConfig(res.data);
      } catch (err) {
        console.error('Failed to load upload configuration', err);
      }
    };
    fetchConfig();
  }, []);

  const stripEmojis = (str) => {
    if (!str) return '';
    return str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log("Fetching career pathways from API...");
        const res = await api.get('/career-pathways');
        console.log("API response data:", res.data);
        if (res.data && res.data.status === 'success') {
          // Safety filter: ensure we only get active career pathways
          const filtered = res.data.courses.filter(c => c.is_career_pathway === true || c.pathwayType === 'career');
          console.log("Filtered courses:", filtered);
          const normalized = filtered.map((c, idx) => {
            return {
              id: c._id,
              _id: c._id,
              badge: stripEmojis(c.badge || c.badgeText || 'FREE'),
              title: stripEmojis(c.title),
              subtitle: stripEmojis(c.subtitle || c.desc || c.shortDescription || ''),
              isAvailable: true,
              is_featured: c.is_featured || c.isFeatured || false,
              ...c
            };
          });
          setCourses(normalized);
          
          // Determine highlighted card index based on is_featured field or saved index
          const savedActiveIndex = localStorage.getItem('careerPathways_activeIndex');
          if (savedActiveIndex !== null) {
            setActiveIndex(parseInt(savedActiveIndex, 10));
          } else {
            const featIdx = normalized.findIndex(c => c.is_featured === true || c.isFeatured === true);
            const initialIdx = featIdx !== -1 ? featIdx : 0;
            setActiveIndex(initialIdx);
            localStorage.setItem('careerPathways_activeIndex', initialIdx);
          }
        }
      } catch (err) {
        console.error("Error loading career pathways list", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Map selectedDetailCourseId to selectedDetailCourse object
  useEffect(() => {
    if (courses.length > 0 && selectedDetailCourseId) {
      const course = courses.find(c => c._id === selectedDetailCourseId || c.id === selectedDetailCourseId);
      if (course) {
        setSelectedDetailCourse(course);
        if (onDetailActive) onDetailActive(true);
      } else {
        setSelectedDetailCourse(null);
        if (onDetailActive) onDetailActive(false);
      }
    } else {
      setSelectedDetailCourse(null);
      if (onDetailActive) onDetailActive(false);
    }
  }, [courses, selectedDetailCourseId]);

  // Fetch modules and lessons dynamically when a course is chosen
  useEffect(() => {
    if (!selectedDetailCourse) {
      setDetailCourseData(null);
      return;
    }
    const fetchCourseDetails = async () => {
      setDetailLoading(true);
      try {
        const res = await api.get(`/courses/${selectedDetailCourse._id}/player`);
        if (res.data && res.data.status === 'success') {
          setDetailCourseData(res.data);
        }
      } catch (err) {
        console.error("Error fetching course details", err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchCourseDetails();
    setActiveModuleIdx(0);
  }, [selectedDetailCourse]);

  const handleMentorshipSubmit = async (e) => {
    e.preventDefault();
    if (!userName || !userEmail || !userPhone) {
      alert('Please fill in all details to submit mentorship request!');
      return;
    }

    if (resumeFile) {
      const config = uploadConfig?.resume || { maxSizeMB: 3, extensions: ['pdf', 'doc', 'docx'] };
      const ext = resumeFile.name.split('.').pop().toLowerCase();
      if (!config.extensions.includes(ext) || resumeFile.size > config.maxSizeMB * 1024 * 1024) {
        alert('Invalid file format or size. Please check the resume upload guidelines.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', userName);
      formData.append('email', userEmail);
      formData.append('phone', userPhone);
      formData.append('targetCompany', selectedDetailCourse.title);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      formData.append('additionalInfo', `Type: ${userType}${userGoal ? ' | Goal: ' + userGoal : ''}`);

      const res = await api.post('/resume-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        alert('Your mentorship request has been submitted! A mentor will contact you shortly.');
        setUserName('');
        setUserEmail('');
        setUserPhone('');
        setResumeFile(null);
        setUserGoal('');
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

  if (selectedDetailCourse) {
    if (detailLoading) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b21e8', fontSize: '18px', fontWeight: 'bold' }}>
          Loading course syllabus...
        </div>
      );
    }

    const title = detailCourseData?.course?.title || selectedDetailCourse.title;
    const subtitle = detailCourseData?.course?.subtitle || detailCourseData?.course?.desc || selectedDetailCourse.subtitle;
    
    // Extract module/lesson names dynamically
    const lessons = [];
    if (detailCourseData && detailCourseData.modules) {
      detailCourseData.modules.forEach(m => {
        if (m.lessons) {
          m.lessons.forEach(l => {
            lessons.push(l);
          });
        }
      });
    }

    const moduleTitles = lessons.map(l => l.title);
    const activeLesson = lessons[activeModuleIdx];
    const videoUrl = activeLesson ? (activeLesson.videoUrl || activeLesson.video_url) : "";
    const isVideoLocked = activeLesson ? false : true;

    console.log("DEBUG: selectedDetailCourse =", selectedDetailCourse);
    console.log("DEBUG: detailCourseData =", detailCourseData);
    console.log("DEBUG: courseStatus being passed =", selectedDetailCourse?.status || detailCourseData?.course?.status);

    return (
      <div className="career-detail-container">
        <PathwayDetailLayout
          title={title}
          subtitle={subtitle}
          backLabel="← Back to Career Pathways"
          onBack={() => {
            setSelectedDetailCourseId(null);
          }}
          modules={moduleTitles}
          activeModuleIdx={activeModuleIdx}
          setActiveModuleIdx={setActiveModuleIdx}
          isVideoLocked={isVideoLocked}
          videoUrl={videoUrl}
          activeLesson={activeLesson}
          courseStatus={selectedDetailCourse?.status || detailCourseData?.course?.status}
          formTitle="Need Help With Your Career?"
          formContent={
            <form onSubmit={handleMentorshipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="f-group">
                <label className="f-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="John" 
                  className="f-input"
                />
              </div>

              <div className="f-group">
                <label className="f-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="email" 
                  required 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  placeholder="john@gmail.com" 
                  className="f-input"
                />
              </div>

              <div className="f-group">
                <label className="f-label">Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="tel" 
                  required 
                  value={userPhone} 
                  onChange={(e) => setUserPhone(e.target.value)} 
                  placeholder="+91 98765 43210" 
                  className="f-input"
                />
              </div>

              <div className="f-group">
                <label className="f-label">Student / Professional</label>
                <select 
                  className="f-input"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>

              <div className="f-group">
                <label className="f-label">Upload Resume <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="file" 
                  required
                  accept={uploadConfig?.resume?.extensions ? uploadConfig.resume.extensions.map(ext => `.${ext}`).join(',') : ".pdf,.doc,.docx"}
                  className="f-input" 
                  style={{ padding: '10px' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const config = uploadConfig?.resume || { maxSizeMB: 3, extensions: ['pdf', 'doc', 'docx'] };
                    const fileExt = file.name.split('.').pop().toLowerCase();
                    if (!config.extensions.includes(fileExt)) {
                      alert(`Only ${config.extensions.join(', ').toUpperCase()} files are allowed.`);
                      e.target.value = '';
                      setResumeFile(null);
                      return;
                    }
                    if (file.size > config.maxSizeMB * 1024 * 1024) {
                      alert(`Resume must be less than ${config.maxSizeMB} MB.`);
                      e.target.value = '';
                      setResumeFile(null);
                      return;
                    }
                    setResumeFile(file);
                  }}
                />
                {uploadConfig?.resume?.extensions && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                    Allowed: {uploadConfig.resume.extensions.join(', ').toUpperCase()} | Max Size: {uploadConfig.resume.maxSizeMB || 3} MB
                  </div>
                )}
              </div>

              <div className="f-group">
                <label className="f-label">What Is Your Goal? <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea 
                  required
                  rows="4" 
                  className="f-input" 
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  placeholder="Type your target role here..." 
                  style={{ resize: 'vertical' }}
                ></textarea>
              </div>

              <button type="submit" disabled={submitting} className="f-submit">
                {submitting ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </form>
          }
        />
      </div>
    );
  }

  return (
    <section id="career-pathways" className="pathways-wrapper">
      <style>{`
        .pathways-wrapper {
          padding: 50px 0;
          background-color: #fdfdfd;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .pathways-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 5%;
        }

        /* Header typography scaling */
        .pathways-header {
          text-align: center;
          margin-bottom: 60px;

        }
        .pathways-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: -1px;
          margin: 0 0 16px 0;
          line-height: 1.1;
        }
        .pathways-desc {
          font-size: clamp(15px, 2vw, 18px);
          color: #64748b;
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ─── GRID LAYOUT ─── */
        .pathways-grid {
          display: grid;
          /* Desktop defaults to 4 columns */
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }

        /* ─── CARD STYLING ─── */
        .pathway-card {
          background-color: #ffffff;
          border-radius: 20px;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          box-sizing: border-box;
        }

        .pathway-card.highlight {
          border: 2px solid #6b21e8;
          box-shadow: 0 20px 40px -10px rgba(107, 33, 232, 0.15);
        }
        .pathway-card.highlight:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -12px rgba(107, 33, 232, 0.25);
        }

        .pathway-card.standard {
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
        }
        .pathway-card.standard:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px -10px rgba(0,0,0,0.1);
        }

        /* Card Elements */
        .card-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 24px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .card-badge.highlight { background: #6b21e8; color: #ffffff; }
        .card-badge.standard { background: #f1f5f9; color: #64748b; }

        .card-title {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 12px 0;
          line-height: 1.2;
        }

        .card-subtitle {
          color: #475569;
          font-size: 15px;
          margin: 0 0 32px 0;
          flex-grow: 1;
          line-height: 1.5;
        }

        .card-btn {
          width: 100%;
          padding: 16px 10px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .card-btn.highlight {
          background-color: #6b21e8;
          color: #ffffff;
          border: none;
        }
        .card-btn.highlight:hover { background-color: #581c87; }
        
        .card-btn.standard {
          background-color: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }
        .card-btn.standard:hover { border-color: #cbd5e1; background-color: #f1f5f9; }

        /* ─── RESPONSIVE BREAKPOINTS ─── */
        
        /* Tablets (Below 1024px) */
        @media (max-width: 1024px) {
          .pathways-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Mobile (Below 640px) - Forces 2 Columns */
        @media (max-width: 640px) {
          .pathways-wrapper {
            padding: 40px 0;
          }
          .pathways-header {
            margin-bottom: 40px;
          }
          .pathways-grid {
            grid-template-columns: repeat(2, 1fr); /* FORCES 2 CARDS PER ROW */
            gap: 12px; /* Tightens the gap between cards */
          }
          
          /* Card resizing to fit 2-columns on narrow screens */
          .pathway-card {
            padding: 24px 12px; /* Reduces inner padding */
            border-radius: 16px;
          }
          .card-badge {
            font-size: 10px;
            padding: 4px 10px;
            margin-bottom: 16px;
          }
          .card-title {
            font-size: 15px; /* Smaller title to prevent overflow */
            margin-bottom: 8px;
          }
          .card-subtitle {
            font-size: 12px; /* Smaller description */
            margin-bottom: 20px;
          }
          .card-btn {
            padding: 12px 6px;
            font-size: 12px; /* Scales button text down */
            border-radius: 8px;
          }
        }
      `}</style>

      <div className="pathways-container">
        
        {/* Section Header */}
        <div className="pathways-header">
          <h2 className="pathways-title">Career Pathways</h2>
          <p className="pathways-desc">
            Learn the systems behind getting hired, growing faster, transitioning into better opportunities, and becoming a top performer.
          </p>
        </div>
        
        {/* Course Grid */}
        <div className="pathways-grid">
          {courses.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: 'span 4', textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: '18px', fontWeight: 'bold' }}>
              No Career Pathways Available
            </div>
          ) : (
            courses.map((course, idx) => {
              const isHigh = idx === activeIndex;
              
              return (
                <div 
                  key={course.id} 
                  className={`pathway-card ${isHigh ? 'highlight' : 'standard'}`}
                  onClick={() => {
                    setActiveIndex(idx);
                    localStorage.setItem('careerPathways_activeIndex', idx);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`card-badge ${isHigh ? 'highlight' : 'standard'}`}>
                    {course.badge}
                  </div>
                  
                  <h3 className="card-title">
                    {course.title}
                  </h3>
                  
                  <p className="card-subtitle">
                    {course.subtitle}
                  </p>
  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const courseId = course._id || course.id;
                      setSelectedDetailCourseId(courseId);
                    }}
                    className={`card-btn ${isHigh ? 'highlight' : 'standard'}`}
                  >
                    Enter Course
                  </button>
                </div>
              )
            })
          )}
        </div>

      </div>
    </section>
  );
}