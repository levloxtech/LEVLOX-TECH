import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Footer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Student',
    resume: null,
    goal: '',
    targetCompany: '',
    notes: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const config = uploadConfig?.resume || { maxSizeMB: 3, extensions: ['pdf', 'doc', 'docx'] };
    const ext = file.name.split('.').pop().toLowerCase();

    if (!config.extensions.includes(ext)) {
      alert(`Only ${config.extensions.join(', ').toUpperCase()} files are allowed.`);
      e.target.value = '';
      return;
    }

    if (file.size > config.maxSizeMB * 1024 * 1024) {
      alert(`Resume must be less than ${config.maxSizeMB} MB.`);
      e.target.value = '';
      return;
    }

    setFormData({ ...formData, resume: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.resume) {
      alert('Please fill in Name, Email, Phone Number, and upload your Resume!');
      return;
    }

    const config = uploadConfig?.resume || { maxSizeMB: 3, extensions: ['pdf', 'doc', 'docx'] };
    const ext = formData.resume.name.split('.').pop().toLowerCase();

    if (!config.extensions.includes(ext) || formData.resume.size > config.maxSizeMB * 1024 * 1024) {
      alert('Invalid file format or size. Please check the resume upload guidelines.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone || 'N/A');
      data.append('help_type', 'Mentorship Request');
      data.append('company', formData.targetCompany);
      data.append('message', `Goal: ${formData.goal}\nTarget Company: ${formData.targetCompany}\nNotes: ${formData.notes}`);
      if (formData.resume) {
        data.append('resume', formData.resume);
      }

      const res = await api.post('/contact', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        setIsSubmitted(true);
      } else {
        alert(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to contact server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer id="contact" className="premium-light-footer">
      <style>{`
        .premium-light-footer {
          background-color: #f8fafc; 
          /* Reduced top padding from 100px to 40px */
          padding: 40px 20px 40px;
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          border-top: 1px solid #e2e8f0;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ─── 2-COLUMN GRID LAYOUT ─── */
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-bottom: 80px;
        }

        /* ─── LEFT COLUMN: INFO & LOCATION ─── */
        .footer-info-col {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .footer-brand h3 {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -1px;
        }
        .footer-brand p {
          color: #64748b;
          font-size: 16px;
          line-height: 1.6;
          margin: 0;
          max-width: 400px;
        }

        /* Info Blocks */
        .info-group h4 {
          font-size: 14px;
          font-weight: 800;
          color: #6b21e8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0 0 20px 0;
        }

        .contact-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #475569;
          font-size: 15px;
          font-weight: 500;
        }
        .icon-box {
          width: 40px;
          height: 40px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b21e8;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        .icon-box svg { width: 18px; height: 18px; }
        
        .contact-item a {
          color: #0f172a;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .contact-item a:hover { color: #6b21e8; }
        .contact-item a:hover .icon-box {
          background: #6b21e8;
          color: #ffffff;
          border-color: #6b21e8;
          transition: all 0.2s ease;
        }

        /* Social Links */
        .social-links {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .social-btn {
          width: 40px;
          height: 40px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background: #6b21e8;
          color: #ffffff;
          border-color: #6b21e8;
          transform: translateY(-2px);
        }
        .social-btn svg { width: 18px; height: 18px; }


        /* ─── RIGHT COLUMN: FLOATING FORM CARD ─── */
        .footer-form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05);
        }

        .footer-form-card h4 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        .footer-form-card > p {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 32px 0;
        }

        .form-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-family: inherit;
          font-size: 15px;
          color: #0f172a;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        .form-input:focus {
          outline: none;
          border-color: #6b21e8;
          box-shadow: 0 0 0 3px rgba(107, 33, 232, 0.1);
          background: #ffffff;
        }
        
        textarea.form-input {
          resize: vertical;
          min-height: 100px;
        }

        /* Two column row inside form */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: #6b21e8;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          margin-top: 8px;
        }
        .submit-btn:hover {
          background: #5b1bc6;
          transform: translateY(-2px);
        }

        /* Success State */
        .success-state {
          text-align: center;
          padding: 40px 20px;
        }
        .success-icon {
          width: 64px;
          height: 64px;
          background: #d1fae5;
          color: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .success-icon svg { width: 32px; height: 32px; }
        .success-state h5 { font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a; }
        .success-state p { color: #64748b; line-height: 1.6; margin: 0 0 32px 0; }
        
        .reset-btn {
          background: transparent;
          border: 1px solid #cbd5e1;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reset-btn:hover { background: #f1f5f9; color: #0f172a; }

        /* ─── FOOTER BOTTOM ─── */
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 40px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 20px;
        }
        .footer-bottom p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
        .footer-links a {
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          margin-left: 24px;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #6b21e8; }

        /* ─── RESPONSIVE RULES ─── */
        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }
          .footer-form-card {
            padding: 32px 24px;
          }
        }
        
        @media (max-width: 640px) {
          /* Reduced top padding on mobile as well */
          .premium-light-footer { padding: 40px 20px 30px; }
          .form-row { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; text-align: center; justify-content: center; }
          .footer-links a { margin: 0 12px; }
        }

        /* ─── GOOGLE MAP CARD ─── */
        .map-card {
          width: 100%;
          border-radius: 20px;
          border: 1px solid #E8EAF2;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          background: #ffffff;
          display: flex;
          flex-direction: column;
          margin-top: 24px;
        }

        .map-iframe-container {
          position: relative;
          width: 100%;
          height: 320px; /* desktop */
        }

        @media (max-width: 992px) {
          .map-iframe-container {
            height: 250px; /* tablet */
          }
        }

        @media (max-width: 640px) {
          .map-iframe-container {
            height: 220px; /* mobile */
          }
        }

        .map-info-bar {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
        }

        .map-info-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .map-info-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .map-info-sub {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .map-btn {
          padding: 8px 16px;
          background: #6b21e8;
          color: #ffffff;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
          transition: all 0.2s;
        }

        .map-btn:hover {
          background: #5b1bc6;
        }
      `}</style>

      <div className="footer-container">
        <div className="footer-grid">

          {/* LEFT COLUMN: BRAND & CONTACT INFO */}
          <div className="footer-info-col">

            <div className="footer-brand">
              <h3>Levlox Tech</h3>
              <p>We're a team of educators and engineers dedicated to helping you build a career you never want to escape from.</p>
            </div>

            <div className="info-group">
              <h4>Get In Touch</h4>
              <div className="contact-list">
                <div className="contact-item">
                  <div className="icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>EMAIL US</span>
                    <a href="mailto:sales@levlox.in">sales@levlox.in</a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>SUPPORT</span>
                    <span>Live chat · Mon–Sat, 9AM–8PM IST</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-group">
              <h4>Headquarters</h4>
              <div className="contact-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: '#475569' }}>
                  <div className="icon-box" style={{ flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <span style={{ lineHeight: 1.5, color: '#475569', fontWeight: 500 }}>
                    L-2-1754-A, 120 feet road,<br />Anna Nagar, Trichy, Tamil Nadu 620026
                  </span>
                </div>
              </div>

              {/* GOOGLE MAP CARD */}
              <div className="map-card" style={{ marginTop: '16px', marginBottom: '24px' }}>
                <div className="map-iframe-container" style={{ position: 'relative', background: '#e5e7eb' }}>
                  {/* Invisible Link Overlay to make the whole map clickable */}
                  <a 
                    href="https://www.google.com/maps/place/10%C2%B044'04.1%22N+78%C2%B045'25.6%22E/@10.7344606,78.7571198" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ position: 'absolute', inset: 0, zIndex: 3, cursor: 'pointer' }}
                    aria-label="Open LevLox Headquarters in Google Maps"
                  />

                  {/* Fallback Static Map Preview */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80')",
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', color: '#1e293b', zIndex: 1
                  }}>
                    <span style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', textAlign: 'center', color: '#0f172a' }}>Interactive Map Unavailable</span>
                    <span style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '4px', maxWidth: '200px' }}>Use the button below to view location on Google Maps.</span>
                  </div>
                  
                  {/* Embedded Interactive Map */}
                  <iframe
                    title="LevLox Headquarters Location Map"
                    src="https://maps.google.com/maps?q=10.7344606,78.7571198&z=15&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, position: 'relative', zIndex: 2, background: 'transparent' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <div className="map-info-bar">
                  <div className="map-info-text">
                    <p className="map-info-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', color: '#6b21e8', flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>LevLox Headquarters</span>
                    </p>
                    <p className="map-info-sub">Anna Nagar, Trichy, Tamil Nadu</p>
                  </div>
                  <a 
                    href="https://www.google.com/maps/place/10%C2%B044'04.1%22N+78%C2%B045'25.6%22E/@10.7344606,78.7571198" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="map-btn"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>

            <div className="social-links" style={{ marginTop: '0px' }}>
              <a href="https://www.linkedin.com/company/levlox-tech/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="social-btn" title="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
              <a href="https://www.instagram.com/levloxtech?igsh=MWd1enJvNGxkcWxheQ==" target="_blank" rel="noopener noreferrer" className="social-btn" title="Instagram (Levlox Tech)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
              <a href="https://www.instagram.com/levloxacademy?igsh=bGV4emdrdHJ1MDd5" target="_blank" rel="noopener noreferrer" className="social-btn" title="Instagram (Levlox Academy)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
            </div>
          </div>


          </div>

          {/* RIGHT COLUMN: GUIDANCE FORM CARD */}
          <div className="footer-form-card">
            {!isSubmitted ? (
              <>
                <h4>Request Mentorship Guidance</h4>
                <p>Fill out the form below and our team will reach out within 24 hours.</p>

                <form className="form-layout" onSubmit={handleSubmit}>

                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="footer-name">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        id="footer-name"
                        className="form-input"
                        placeholder="John"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="footer-email">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="email"
                        id="footer-email"
                        className="form-input"
                        placeholder="john@gmail.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="footer-phone">Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="tel"
                      id="footer-phone"
                      className="form-input"
                      placeholder="+91 98765 43210"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="footer-status">I am a...</label>
                      <select
                        id="footer-status"
                        className="form-input"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Student">Student</option>
                        <option value="Professional">Professional</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label htmlFor="footer-resume">Upload Resume <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="file"
                        id="footer-resume"
                        className="form-input"
                        style={{ padding: '11px 16px' }}
                        accept={uploadConfig?.resume?.extensions ? uploadConfig.resume.extensions.map(ext => `.${ext}`).join(',') : ".pdf,.doc,.docx"}
                        required
                        onChange={handleFileChange}
                      />
                      {uploadConfig?.resume?.extensions && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                          Allowed: {uploadConfig.resume.extensions.join(', ').toUpperCase()} | Max Size: {uploadConfig.resume.maxSizeMB || 3} MB
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="footer-goal">What Is Your Core Goal?</label>
                    <input
                      type="text"
                      id="footer-goal"
                      className="form-input"
                      placeholder="e.g., Transition to a product company"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="footer-company">Target Company / Role</label>
                    <input
                      type="text"
                      id="footer-company"
                      className="form-input"
                      placeholder="e.g., SDE at Amazon, Full Stack at Startup"
                      value={formData.targetCompany}
                      onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="footer-notes">Additional Context</label>
                    <textarea
                      id="footer-notes"
                      className="form-input"
                      placeholder="Tell us a bit about your current situation so we can best match you with a mentor."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="submit-btn">
                    Submit Request &nbsp;➔
                  </button>
                </form>
              </>
            ) : (
              <div className="success-state">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h5>Request Received!</h5>
                <p>Thank you for reaching out. A Levlox Tech mentor will review your details and contact you within 24 hours.</p>
                <button
                  className="reset-btn"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ status: 'Student', resume: null, goal: '', targetCompany: '', notes: '' });
                  }}
                >
                  Submit another request
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ─── FOOTER BOTTOM ─── */}
        <div className="footer-bottom">
          <p>© 2026 Levlox Tech. All rights reserved. Built with ❤ in India.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}