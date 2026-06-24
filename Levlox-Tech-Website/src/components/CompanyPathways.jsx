import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import PathwayDetailLayout from './PathwayDetailLayout';

// Using standard image URLs. If these fail to load, ensure your browser isn't blocking external images!
const companyLogos = {
  tcs: "https://i.pinimg.com/736x/4e/a8/84/4ea8845ef375d645723f8f74315ca1a1.jpg",
  infosys: "https://i.pinimg.com/736x/c2/98/5e/c2985e50b1c7d8f3c4ff6bd9d6e185bf.jpg",
  wipro: "https://i.pinimg.com/736x/88/0c/cf/880ccfdf86bbe3c02cb6a3d181d2b5ce.jpg",
  cognizant: "https://i.pinimg.com/736x/da/eb/d4/daebd47fd42b137084c4c7f6e083e227.jpg",
  apple: "https://i.pinimg.com/736x/1b/56/fd/1b56fd706cdbaa4646fd0472193d5005.jpg",
  meta: "https://i.pinimg.com/736x/0a/db/09/0adb09b6580d9c13a6fd4af026649940.jpg",
  oracle: "https://i.pinimg.com/736x/13/59/fd/1359fdd23060111974f7b05813b29264.jpg",
  adobe: "https://i.pinimg.com/736x/62/3c/b6/623cb67a352ad783bfa394952dc56af2.jpg",
  accenture: "https://i.pinimg.com/736x/b6/38/03/b63803d954b0d1244bda8d828728bf10.jpg",
  deloitte: "https://i.pinimg.com/736x/fb/10/d6/fb10d6296584daeb82dd208c046d583e.jpg",
  zoho: "https://i.pinimg.com/736x/36/76/4c/36764cad429d97090de6e08a7ef82c7b.jpg",
  amazon: "https://i.pinimg.com/736x/5d/b9/cb/5db9cb7eb89795758c5cfd66876e6837.jpg",
  google: "https://i.pinimg.com/736x/3a/12/af/3a12afc76273f948c4889a1d2d74e1a5.jpg",
  microsoft: "https://i.pinimg.com/736x/15/cf/7f/15cf7f65d56e8fcf16fa08e45ceae81d.jpg",
  hcl: "https://i.pinimg.com/736x/83/cf/05/83cf05e936366d14491ce0b77c887767.jpg"
};

const companies = [
  'TCS', 'Infosys', 'Wipro', 'HCL', 'Cognizant', 
  'Accenture', 'Deloitte', 'Zoho', 'Amazon', 'Google', 'Microsoft',
  'Apple', 'Meta', 'Oracle', 'Adobe'
];

const syllabus = [
  { id: 1, title: 'Hiring Process', lessons: ['The Corporate Mindset', 'Recruitment Timeline', 'What HR Actually Wants'] },
  { id: 2, title: 'Eligibility', lessons: ['Academic Criteria', 'Handling Active Backlogs', 'The Year Gap Rules'] },
  { id: 3, title: 'Resume Strategy', lessons: ['ATS Optimization Secrets', 'Formatting Your Projects', 'Keywords They Scan For'] },
  { id: 4, title: 'Interview Rounds', lessons: ['Cracking the Aptitude Test', 'Technical Round Deep-Dive', 'Mastering the HR Round'] },
  { id: 5, title: 'Preparation Roadmap', lessons: ['The 4-Week Execution Plan', 'Mock Interview Strategy', 'Resource Toolkit'] }
];

// Auto-Scrolling Marquee for the bottom
const LogoMarquee = () => (
  <div className="marquee-container">
    <div className="marquee-track">
      {Object.entries(companyLogos).map(([key, url]) => (
        <div key={key} className="marquee-logo-circle">
          <img src={url} alt={`${key} logo`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ))}
      {Object.entries(companyLogos).map(([key, url]) => (
        <div key={`${key}-dup`} className="marquee-logo-circle">
          <img src={url} alt={`${key} logo`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ))}
    </div>
  </div>
);

export default function CompanyPathways({ onDetailActive }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [targetCompany, setTargetCompany] = useState('');
  const [expandedModule, setExpandedModule] = useState(0);

  const updateTargetCompany = (company) => {
    setTargetCompany(company);
  };

  const updateHasAccess = (access) => {
    setHasAccess(access);
    if (onDetailActive) {
      onDetailActive(access);
    }
  };

  const updateExpandedModule = (idx) => {
    setExpandedModule(idx);
  };

  const [companyCourses, setCompanyCourses] = useState([]);
  const [detailCourseData, setDetailCourseData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchCompanyCourses = async () => {
      try {
        const res = await api.get('/company-pathways');
        if (res.data && res.data.status === 'success') {
          setCompanyCourses(res.data.courses || []);
        }
      } catch (err) {
        console.error("Error loading company pathways list", err);
      }
    };
    fetchCompanyCourses();
  }, []);

  const matchingCourse = companyCourses.find(
    c => c && c.title && targetCompany && c.title.toLowerCase().trim() === targetCompany.toLowerCase().trim()
  );

  useEffect(() => {
    if (!matchingCourse || !hasAccess) {
      setDetailCourseData(null);
      return;
    }

    const fetchCourseDetails = async () => {
      setDetailLoading(true);
      try {
        const res = await api.get(`/courses/${matchingCourse._id}/player`);
        if (res.data && res.data.status === 'success') {
          setDetailCourseData(res.data);
        }
      } catch (err) {
        console.error("Error fetching company course details", err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchCourseDetails();
    setExpandedModule(0);
  }, [matchingCourse, hasAccess]);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [mentorType, setMentorType] = useState('Student');
  const [mentorResume, setMentorResume] = useState(null);
  const [mentorCompany, setMentorCompany] = useState('');
  const [mentorNotes, setMentorNotes] = useState('');
  const [mentorSubmitting, setMentorSubmitting] = useState(false);

  const handleMentorshipSubmit = async (e) => {
    e.preventDefault();
    if (!mentorName || !mentorEmail || !mentorPhone || !mentorResume) {
      alert('Please fill in Name, Email, Phone, and upload your Resume!');
      return;
    }
    setMentorSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', mentorName);
      formData.append('email', mentorEmail);
      formData.append('phone', mentorPhone);
      formData.append('targetCompany', targetCompany);
      formData.append('resume', mentorResume);
      formData.append('notes', mentorNotes);
      formData.append('additionalInfo', `Type: ${mentorType}, College/Company: ${mentorCompany}`);

      const res = await api.post('/resume-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        alert('Your 1-on-1 mentorship request has been submitted! A mentor will contact you shortly.');
        setMentorName('');
        setMentorEmail('');
        setMentorPhone('');
        setMentorCompany('');
        setMentorNotes('');
        setMentorResume(null);
      } else {
        alert(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit mentorship request.');
    } finally {
      setMentorSubmitting(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!targetCompany || !userName || !userEmail || !userPhone || !resumeFile) {
      alert('Please fill in all fields and select your resume file!');
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', userName);
      formData.append('email', userEmail);
      formData.append('phone', userPhone);
      formData.append('targetCompany', targetCompany);
      formData.append('resume', resumeFile);

      const res = await api.post('/resume-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        alert('Pathway request submitted successfully! Your playbook is unlocked.');
        updateHasAccess(true);
      } else {
        alert(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to backend API. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (detailLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b21e8', fontSize: '18px', fontWeight: 'bold', paddingTop: '100px' }}>
        Loading playbook details...
      </div>
    );
  }

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

  const hasDynamicLessons = lessons.length > 0;
  const moduleTitles = hasDynamicLessons
    ? lessons.map(l => l.title)
    : syllabus.flatMap(m => m.lessons);

  const activeLesson = hasDynamicLessons ? lessons[expandedModule] : null;
  const videoUrl = activeLesson ? activeLesson.video_url : "";
  const title = detailCourseData?.course?.title || `${targetCompany} PLAYBOOK`;
  const subtitle = detailCourseData?.course?.subtitle || detailCourseData?.course?.desc || `Learn How To Get Into ${targetCompany}`;

  return (
    <>
      <style>{`
        /* ─── BASE SECTION STYLES ─── */
        .pathways-section {
          background-color: #ffffff;
          padding:20px 0 60px 0; 
          overflow: hidden;
          position: relative;
        }
        .pathways-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 0 20px;
        }
        .headline-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .headline-text {
          font-family: 'Georgia', serif;
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -1.5px;
          margin: 0;
          text-transform: capitalize;
        }
        .subheadline-text {
          font-size: clamp(16px, 1.8vw, 22px);
          color: #475569;
          font-weight: 500;
          margin: 0;
        }
        .subheadline-text span {
          color: #6b21e8;
          font-weight: 700;
        }

        /* ─── SIDE-BRAND CANVAS GRID (DESKTOP) ─── */
        .showcase-layout-canvas {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 50px;
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          padding: 0 20px;
        }
        .brand-vertical-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 2;
          width: 260px;
        }
        .brand-showcase-item {
          background: #ffffff;
          border-radius: 14px;
          padding: 12px 16px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
          position: relative;
          box-sizing: border-box;
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        .brand-showcase-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(107, 33, 232, 0.1);
        }
        .brand-showcase-item.highlighted {
          border: 2px solid #6b21e8 !important;
          box-shadow: 0 10px 25px rgba(107, 33, 232, 0.15) !important;
        }
        
        /* Dashed connector lines (Desktop) */
        .brand-showcase-item.left-panel::after {
          content: '';
          position: absolute;
          right: -50px;
          top: 50%;
          width: 50px;
          border-top: 2px dashed #cbd5e1;
          z-index: -1;
        }
        .brand-showcase-item.right-panel::after {
          content: '';
          position: absolute;
          left: -50px;
          top: 50%;
          width: 50px;
          border-top: 2px dashed #cbd5e1;
          z-index: -1;
        }

        .brand-name-logo {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .brand-logo-trigger {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          padding: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .brand-logo-trigger img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* ─── CENTRAL FORM CARD ─── */
        .central-form-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          width: 100%;
          max-width: 540px;
          padding: 40px;
          position: relative;
          z-index: 10; 
          box-sizing: border-box;
        }
        .form-title {
          font-family: 'Georgia', serif;
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          text-align: center;
          margin-bottom: 32px;
        }
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .form-input-box {
          width: 100%;
          padding: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 15px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: #f8fafc;
          box-sizing: border-box;
          color: #0f172a;
          margin-bottom: 24px;
          transition: border-color 0.2s;
        }
        .form-input-box:focus {
          outline: none;
          border-color: #6b21e8;
          background: #ffffff;
        }
        input[type="file"]::file-selector-button {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
          color: #0f172a;
          margin-right: 10px;
          font-weight: 600;
        }
        .form-submit-btn {
          width: 100%;
          padding: 16px;
          background: #6b21e8;
          color: #ffffff;
          font-size: 16px;
          font-weight: 800;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .form-submit-btn:hover {
          background: #5b1bc6;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(107, 33, 232, 0.4);
        }

        /* ─── AUTO-SCROLLING MARQUEE (CIRCLES) ─── */
        .marquee-container {
          margin-top: 60px;
          padding: 20px 0;
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
          position: relative;
        }
        .marquee-container::before, .marquee-container::after {
          content: "";
          position: absolute;
          top: 0;
          width: 80px;
          height: 100%;
          z-index: 2;
        }
        .marquee-container::before { left: 0; background: linear-gradient(to right, #ffffff, transparent); }
        .marquee-container::after { right: 0; background: linear-gradient(to left, #ffffff, transparent); }

        .marquee-track {
          display: inline-flex;
          align-items: center;
          animation: marquee 35s linear infinite; 
          gap: 20px;
          padding-left: 20px;
        }
        .marquee-logo-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.03);
          flex-shrink: 0;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ─── PERFECT MOBILE LAYOUT ─── */
        @media (max-width: 1100px) {
          .showcase-layout-canvas {
            flex-direction: column;
            gap: 0; 
            padding: 0; 
          }
          
          .central-form-card { 
            order: 2; 
            width: 92%; 
            margin: 0 auto;
            z-index: 10; 
          }
          
          .brand-vertical-column {
            flex-direction: row;
            width: 100%;
            overflow-x: auto;
            /* Increased padding to 80px to accommodate the longer lines */
            padding: 80px 10px; 
            gap: 10px; 
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            z-index: 1;
            box-sizing: border-box;
          }
          .brand-vertical-column::-webkit-scrollbar { display: none; }
          
          /* Pull the columns tight against the form so the lines connect */
          .brand-vertical-column:first-child { order: 1; margin-bottom: -80px; } 
          .brand-vertical-column:last-child { order: 3; margin-top: -80px; } 

          .brand-vertical-column:first-child .brand-showcase-item { flex-direction: column-reverse; }
          .brand-vertical-column:last-child .brand-showcase-item { flex-direction: column; }

          .brand-showcase-item {
            min-width: 72px; 
            max-width: 72px;
            justify-content: center;
            gap: 6px;
            text-align: center;
            scroll-snap-align: center;
            padding: 10px 4px;
            border-radius: 12px;
          }

          .brand-name-logo {
            font-size: 11px !important;
            flex-wrap: wrap;
            justify-content: center;
            line-height: 1.1;
          }
          .brand-name-logo span { font-size: inherit !important; }
          
          .desktop-only-text { display: none !important; }

          .brand-logo-trigger {
            width: 32px;
            height: 32px;
            padding: 4px;
          }

          .brand-showcase-item::after { display: none !important; }

          /* LONGER TOP STRINGS (Increased to 80px) */
          .brand-vertical-column:first-child .brand-showcase-item::before {
            content: '';
            position: absolute;
            bottom: -80px; 
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 80px; 
            background: repeating-linear-gradient(to bottom, #cbd5e1 0, #cbd5e1 4px, transparent 4px, transparent 8px);
            z-index: -1;
          }

          /* LONGER BOTTOM STRINGS (Increased to 80px) */
          .brand-vertical-column:last-child .brand-showcase-item::before {
            content: '';
            position: absolute;
            top: -80px; 
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 80px; 
            background: repeating-linear-gradient(to top, #cbd5e1 0, #cbd5e1 4px, transparent 4px, transparent 8px);
            z-index: -1;
          }

          .marquee-container::before, .marquee-container::after { display: none; }
        }

        /* ─── REAL MOBILE RESPONSIVE CLEANUP (<= 768px) ─── */
        @media (max-width: 768px) {
          .pathways-section {
            padding: 10px 0 30px 0 !important;
          }
          .pathways-header {
            margin-bottom: 12px !important;
          }
          .headline-text {
            font-size: 28px !important;
          }
          .subheadline-text {
            font-size: 14px !important;
          }
          .central-form-card {
            padding: 24px 16px !important;
            margin-top: 10px !important;
            margin-bottom: 20px !important;
          }
          .form-title {
            margin-bottom: 20px !important;
            font-size: 18px !important;
          }
          .form-input-box {
            margin-bottom: 14px !important;
            padding: 10px 12px !important;
          }
          .brand-vertical-column {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            padding: 10px 16px !important;
            margin: 0 !important;
            gap: 8px !important;
            width: 100% !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }
          .brand-vertical-column:first-child {
            order: 1 !important;
            margin-bottom: 5px !important;
          }
          .brand-vertical-column:last-child {
            order: 3 !important;
            margin-top: 5px !important;
          }
          .brand-showcase-item {
            min-width: 70px !important;
            max-width: 90px !important;
            flex: 1 1 70px !important;
            padding: 8px 4px !important;
            border-radius: 10px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
          }
          .brand-showcase-item::before, .brand-showcase-item::after {
            display: none !important;
          }
          .brand-name-logo {
            font-size: 10px !important;
            flex-direction: column !important;
            gap: 2px !important;
            margin: 0 !important;
            text-align: center !important;
          }
          .brand-logo-trigger {
            width: 32px !important;
            height: 32px !important;
            padding: 4px !important;
          }
        }

        /* ─── DASHBOARD VIEW STYLES ─── */
        .dashboard-container { background: #F7F9FA; min-height: 100vh; display: flex; flex-direction: column; }
        .dashboard-header { background: #ffffff; padding: 16px 40px; border-bottom: 1.5px solid #E5E7E6; display: flex; justify-content: space-between; align-items: center; }
        .dashboard-workspace { display: flex; flex: 1; min-height: calc(100vh - 73px); }
        .dashboard-sidebar-menu { width: 300px; background: #0f172a; color: #ffffff; padding: 32px 0; display: flex; flex-direction: column; }
        .dashboard-accordion-header { padding: 16px 24px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; cursor: pointer; transition: background 0.2s; }
        .dashboard-accordion-header.active-group { background: #1e293b; }
        .dashboard-lessons-block { background: #0b1120; padding: 12px 24px 16px 56px; border-bottom: 1px solid #1e293b; }
        .dashboard-lesson-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; font-size: 13px; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
        .dashboard-lesson-row:hover { color: #ffffff; }
        .dashboard-center-stage { flex: 1; padding: 40px; background: #f1f5f9; }
        .dashboard-form-panel { width: 400px; background: #ffffff; border-left: 1px solid #e2e8f0; padding: 32px; box-sizing: border-box; overflow-y: auto; }

        @media (max-width: 768px) {
          .central-form-card { padding: 32px 20px; }
          .dashboard-workspace { flex-direction: column; }
          .dashboard-sidebar-menu, .dashboard-form-panel { width: 100%; height: auto; }
          .dashboard-form-panel { border-left: none; border-top: 1px solid #e2e8f0; }
          .dashboard-header { padding: 16px 20px; flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      {!hasAccess ? (
        <section id="pathways" className="pathways-section">
          
          <div className="pathways-header">
            <div className="headline-wrapper">
              <h2 className="headline-text">Company Pathway</h2>
            </div>
            <p className="subheadline-text">Learn How To Get Into A <span>Specific Company</span></p>
          </div>

          <div className="showcase-layout-canvas">
            
            {/* TOP/LEFT BRANDS ROW */}
            <div className="brand-vertical-column">
              <div 
                className={`brand-showcase-item left-panel ${targetCompany === 'TCS' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('TCS')}
              >
                <span className="brand-name-logo">
                  <span style={{ color: '#E31837', fontSize: '24px' }}>tcs</span>
                  <span className="desktop-only-text" style={{ fontSize: '7px', lineHeight: '1', color: '#0f172a', textAlign: 'left' }}>TATA<br/>CONSULTANCY<br/>SERVICES</span>
                </span>
                <span className="brand-logo-trigger"><img src={companyLogos.tcs} alt="TCS Logo" /></span>
              </div>
              
              <div 
                className={`brand-showcase-item left-panel ${targetCompany === 'Infosys' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Infosys')}
              >
                <span className="brand-name-logo" style={{ color: '#007CC3' }}>Infosys</span>
                <span className="brand-logo-trigger"><img src={companyLogos.infosys} alt="Infosys Logo" /></span>
              </div>
              
              <div 
                className={`brand-showcase-item left-panel ${targetCompany === 'Wipro' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Wipro')}
              >
                <span className="brand-name-logo">
                  <span style={{ fontSize: '24px', letterSpacing: '-4px' }}>
                    <span style={{color:'green'}}>●</span><span style={{color:'blue'}}>●</span><span style={{color:'purple'}}>●</span>
                  </span>
                  <span style={{ color: '#0f172a', marginLeft: '6px' }}>wipro</span>
                </span>
                <span className="brand-logo-trigger"><img src={companyLogos.wipro} alt="Wipro Logo" /></span>
              </div>
              
              <div 
                className={`brand-showcase-item left-panel ${targetCompany === 'Cognizant' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Cognizant')}
              >
                <span className="brand-name-logo">
                  <span style={{ color: '#000048', fontSize: '20px' }}>▶</span>
                  <span style={{ color: '#000048' }}>Cognizant</span>
                </span>
                <span className="brand-logo-trigger"><img src={companyLogos.cognizant} alt="Cognizant Logo" /></span>
              </div>
            </div>

            {/* CENTRAL FORM CARD */}
            <div className="central-form-card">
              <h3 className="form-title">Get Your Custom Company Pathway</h3>
              
              <form onSubmit={handleUnlock}>
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  className="form-input-box" 
                  placeholder="John" 
                />

                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  required 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  className="form-input-box" 
                  placeholder="john@gmail.com" 
                />

                <label className="form-label">Phone Number *</label>
                <input 
                  type="tel" 
                  required 
                  value={userPhone} 
                  onChange={(e) => setUserPhone(e.target.value)} 
                  className="form-input-box" 
                  placeholder="+91 98765 43210" 
                />

                <label className="form-label">Upload Resume *</label>
                <input 
                  type="file" 
                  required 
                  accept=".pdf,.doc,.docx" 
                  onChange={(e) => setResumeFile(e.target.files[0])} 
                  className="form-input-box" 
                />
                
                <label className="form-label">Which Company Do You Want To Get Into? *</label>
                <select 
                  required 
                  value={targetCompany} 
                  onChange={(e) => updateTargetCompany(e.target.value)} 
                  className="form-input-box"
                >
                  <option value="" disabled>Select a company...</option>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button type="submit" disabled={submitting} className="form-submit-btn">
                  {submitting ? 'Submitting Request...' : 'Submit & Unlock Pathway →'}
                </button>
              </form>
            </div>

            {/* BOTTOM/RIGHT BRANDS ROW */}
            <div className="brand-vertical-column">
              <div 
                className={`brand-showcase-item right-panel ${targetCompany === 'Apple' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Apple')}
              >
                <span className="brand-logo-trigger"><img src={companyLogos.apple} alt="Apple Logo" /></span>
                <span className="brand-name-logo"> Apple</span>
              </div>
              
              <div 
                className={`brand-showcase-item right-panel ${targetCompany === 'Meta' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Meta')}
              >
                <span className="brand-logo-trigger"><img src={companyLogos.meta} alt="Meta Logo" /></span>
                <span className="brand-name-logo" style={{ color: '#0668E1' }}>∞ Meta</span>
              </div>
              
              <div 
                className={`brand-showcase-item right-panel ${targetCompany === 'Oracle' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Oracle')}
              >
                <span className="brand-logo-trigger"><img src={companyLogos.oracle} alt="Oracle Logo" /></span>
                <span className="brand-name-logo" style={{ color: '#F80000', letterSpacing: '-0.5px' }}>ORACLE</span>
              </div>
              
              <div 
                className={`brand-showcase-item right-panel ${targetCompany === 'Adobe' ? 'highlighted' : ''}`}
                onClick={() => updateTargetCompany('Adobe')}
              >
                <span className="brand-logo-trigger"><img src={companyLogos.adobe} alt="Adobe Logo" /></span>
                <span className="brand-name-logo" style={{ color: '#FF0000' }}>A Adobe</span>
              </div>
            </div>

          </div>

          {/* MARQUEE AT THE VERY BOTTOM */}
          <LogoMarquee />

        </section>
      ) : (
        /* =========================================================
            VIEW 2: NEW PREMIUM UNLOCKED CONSOLE DASHBOARD VIEW
            ========================================================= */
        <div className="company-detail-wrapper" style={{ paddingTop: '70px' }}>
          <PathwayDetailLayout
            title={title}
            subtitle={subtitle}
            backLabel={`← Back to Company Pathways`}
            onBack={() => updateHasAccess(false)}
            modules={moduleTitles}
            activeModuleIdx={expandedModule}
            setActiveModuleIdx={updateExpandedModule}
            isVideoLocked={false}
            videoUrl={videoUrl}
            activeLesson={activeLesson}
            formTitle={`Need Personalized Help Getting Into ${targetCompany}?`}
            formContent={
              <form onSubmit={handleMentorshipSubmit}>
                <div className="f-group">
                  <label className="f-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    className="f-input"
                    placeholder="John"
                  />
                </div>

                <div className="f-group">
                  <label className="f-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    className="f-input"
                    placeholder="john@gmail.com"
                  />
                </div>

                <div className="f-group">
                  <label className="f-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={mentorPhone}
                    onChange={(e) => setMentorPhone(e.target.value)}
                    className="f-input"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="f-group">
                  <label className="f-label">I am a...</label>
                  <select
                    value={mentorType}
                    onChange={(e) => setMentorType(e.target.value)}
                    className="f-input"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div className="f-group">
                  <label className="f-label">Upload Resume *</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setMentorResume(e.target.files[0])}
                    className="f-input"
                    style={{ padding: '10px' }}
                  />
                </div>

                <div className="f-group">
                  <label className="f-label">Current Company / College</label>
                  <input
                    type="text"
                    value={mentorCompany}
                    onChange={(e) => setMentorCompany(e.target.value)}
                    className="f-input"
                    placeholder="e.g. VIT / TCS"
                  />
                </div>

                <div className="f-group">
                  <label className="f-label">Target Company</label>
                  <input
                    type="text"
                    disabled
                    value={targetCompany}
                    className="f-input"
                    style={{ background: '#e2e8f0', color: '#64748b', fontWeight: '600' }}
                  />
                </div>

                <div className="f-group">
                  <label className="f-label">Additional Notes</label>
                  <textarea
                    rows="3"
                    value={mentorNotes}
                    onChange={(e) => setMentorNotes(e.target.value)}
                    className="f-input"
                    placeholder="Where are you stuck?"
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <button type="submit" disabled={mentorSubmitting} className="f-submit">
                  {mentorSubmitting ? 'Submitting Request...' : 'Submit Request'}
                </button>
              </form>
            }
          />
        </div>
      )}
    </>
  );
}