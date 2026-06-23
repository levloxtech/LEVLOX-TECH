import React, { useState, useEffect } from 'react';
import logo from '../assets/levolox-logo.PNG'; // Assuming you have the exact logo here

export default function Navbar({ onSelectCourse, isCoursePage }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // 1. Handle Navbar Shadow on Scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Rock-Solid Scroll-Spy
  useEffect(() => {
    if (isCoursePage) return;

    const sections = ['hero', 'proof', 'pathways', 'career-pathways', 'faq', 'founders', 'contact'];
    
    const handleScrollSpy = () => {
      const scrollPosition = window.scrollY + 150; 

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i];
        const element = document.getElementById(sectionId);
        
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy);
    handleScrollSpy();

    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [isCoursePage]);

  // 3. Smooth Underline Positional Tracker
  useEffect(() => {
    const updateUnderline = () => {
      const activeEl = document.querySelector('.nav-desktop-menu .nav-link-item.active');
      if (activeEl) {
        setUnderlineStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      } else {
        setUnderlineStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    // Calculate immediately
    updateUnderline();

    // Re-run after short delay to catch late paints
    const timer = setTimeout(updateUnderline, 100);

    window.addEventListener('resize', updateUnderline);
    return () => {
      window.removeEventListener('resize', updateUnderline);
      clearTimeout(timer);
    };
  }, [activeSection, isCoursePage]);

  // 4. Smooth Scroll Click Handler
  const handleNavClick = (e, id) => {
    e.preventDefault();
    
    if (isCoursePage && onSelectCourse) {
      onSelectCourse(null);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) window.scrollTo({ top: element.offsetTop - 70, behavior: 'smooth' });
      }, 100);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 70, behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        /* ─── DESKTOP TYPOGRAPHY & SPACING ─── */
        .nav-desktop-menu {
          display: flex;
          gap: 32px; /* Perfect spacing between text links */
          align-items: center;
          position: relative;
          padding-bottom: 6px; /* Added padding to give breathing room for active indicator */
        }
        
        .nav-link-item {
          font-size: 16px;
          text-decoration: none;
          transition: color 0.2s ease;
          position: relative;
          padding: 4px 0;
        }
        
        .nav-link-item.active {
          color: #6b21e8; 
          font-weight: 800;
        }
        
        .nav-link-item.inactive {
          color: #334155; 
          font-weight: 700;
        }

        .nav-link-item.inactive:hover {
          color: #0f172a;
        }

        /* Reusable Smooth Sliding Underline */
        .nav-underline {
          position: absolute;
          bottom: -4px;
          height: 3px;
          background-color: #6b21e8;
          border-radius: 4px;
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(107, 33, 232, 0.2);
        }

        /* ─── LOGO ANCHOR INTERACTION ─── */
        .nav-logo-link {
          text-decoration: none; 
          position: relative; 
          zIndex: 1005; 
          display: flex; 
          align-items: center;
          transition: transform 0.2s ease;
        }
        .nav-logo-link:hover {
          transform: scale(1.03);
        }
        .nav-logo-img {
          height: 38px; /* Slightly increased from 32px for premium prominent presence */
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.04)); /* Lighter prominent visual cue */
        }

        .nav-cta-btn {
          background: #7c3aed; /* Adjusted to match your screenshot's vivid purple */
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          transition: background 0.2s ease, transform 0.2s ease;
          display: block;
          margin-left: 32px; /* Gap between links and the button */
        }
        .nav-cta-btn:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }

        /* ─── FLOATING CURVED MOBILE BOTTOM NAV BAR CSS ─── */
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 480px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(107, 33, 232, 0.15), 0 2px 10px rgba(0, 0, 0, 0.05);
          border-radius: 30px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 1005;
          padding: 8px 12px;
          box-sizing: border-box;
        }

        .mobile-bottom-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .mobile-bottom-link-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          position: relative;
          width: 60px;
          height: 52px;
          justify-content: flex-end;
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-bottom-link-item .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: transparent;
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-bottom-link-item .icon-wrapper svg {
          width: 18px;
          height: 18px;
          transition: all 0.3s ease;
        }

        .mobile-bottom-link-item .label-text {
          font-size: 10px;
          font-weight: 700;
          margin-top: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.7;
          text-transform: capitalize;
        }

        /* Active State raised circular highlight bubble style */
        .mobile-bottom-link-item.active {
          color: #6b21e8;
        }

        .mobile-bottom-link-item.active .icon-wrapper {
          background: #ffffff;
          color: #6b21e8;
          transform: translateY(-20px);
          box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(107, 33, 232, 0.3);
          position: absolute;
          top: 0;
          width: 44px;
          height: 44px;
          border: 1.5px solid rgba(107, 33, 232, 0.1);
        }

        .mobile-bottom-link-item.active .icon-wrapper svg {
          width: 20px;
          height: 20px;
          stroke-width: 2.5;
        }

        .mobile-bottom-link-item.active .label-text {
          font-weight: 800;
          color: #6b21e8;
          opacity: 1;
          transform: translateY(2px);
        }

        /* ─── RESPONSIVE BREAKPOINTS ─── */
        @media (max-width: 1100px) {
          .nav-desktop-menu { display: none; }
          .nav-cta-btn { display: none; }
          .mobile-bottom-nav { display: block; }
          .mobile-header-contact { display: inline-block !important; }
          
          /* Align the Logo to left corner on mobile top bar and contact us to right */
          .nav-inner-container { 
            justify-content: space-between !important; 
            padding: 16px 24px !important;
          }
        }
        @media (min-width: 1101px) {
          .mobile-bottom-nav { display: none !important; }
          .mobile-header-contact { display: none !important; }
        }
      `}</style>

      {/* Top Navbar */}
      <nav style={{ 
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none', 
        borderBottom: isScrolled ? 'none' : '1px solid #f8fafc',
        zIndex: 1004,
        position: 'fixed',
        top: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        transition: 'box-shadow 0.3s ease',
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}>
        {/* Container spreads logo to far left, nav to far right on desktop */}
        <div className="nav-inner-container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 4%', 
          maxWidth: '1600px', 
          margin: '0 auto' 
        }}>
          
          {/* Logo */}
          <a href="#hero" className="nav-logo-link" onClick={(e) => handleNavClick(e, 'hero')}>
            <img src={logo} alt="Levlox Logo" className="nav-logo-img" />
          </a>
          
          {/* Mobile visible Contact Us on top-right */}
          <a 
            href="#contact" 
            className="mobile-header-contact" 
            onClick={(e) => handleNavClick(e, 'contact')}
            style={{
              display: 'none',
              background: '#7c3aed',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            Contact Us
          </a>

          {/* Desktop Navigation Items & CTA */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="nav-desktop-menu">
              <a href="#hero" className={`nav-link-item ${activeSection === 'hero' ? 'active' : 'inactive'}`} onClick={(e) => handleNavClick(e, 'hero')}>Home</a>
              <a href="#proof" className={`nav-link-item ${activeSection === 'proof' ? 'active' : 'inactive'}`} onClick={(e) => handleNavClick(e, 'proof')}>Results</a>
              <a href="#pathways" className={`nav-link-item ${activeSection === 'pathways' ? 'active' : 'inactive'}`} onClick={(e) => handleNavClick(e, 'pathways')}>Company Pathways</a>
              <a href="#career-pathways" className={`nav-link-item ${activeSection === 'career-pathways' ? 'active' : 'inactive'}`} onClick={(e) => handleNavClick(e, 'career-pathways')}>Career Pathways</a>
              <a href="#faq" className={`nav-link-item ${activeSection === 'faq' ? 'active' : 'inactive'}`} onClick={(e) => handleNavClick(e, 'faq')}>FAQ</a>
              <a href="#founders" className={`nav-link-item ${activeSection === 'founders' ? 'active' : 'inactive'}`} onClick={(e) => handleNavClick(e, 'founders')}>About</a>

              {/* Smooth Dynamic Underline Element */}
              <span 
                className="nav-underline" 
                style={{
                  left: `${underlineStyle.left}px`,
                  width: `${underlineStyle.width}px`,
                  opacity: underlineStyle.opacity,
                  transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease'
                }}
              />
            </div>

            <a href="#contact" className="nav-cta-btn" onClick={(e) => handleNavClick(e, 'contact')}>
              Contact Us &rarr;
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          <a href="#hero" className={`mobile-bottom-link-item ${activeSection === 'hero' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'hero')}>
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="label-text">Home</span>
          </a>
          <a href="#proof" className={`mobile-bottom-link-item ${activeSection === 'proof' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'proof')}>
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <span className="label-text">Results</span>
          </a>
          <a href="#pathways" className={`mobile-bottom-link-item ${activeSection === 'pathways' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'pathways')}>
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                <path d="M7 21V11a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M12 6h.01" />
                <path d="M12 12h.01" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <span className="label-text">Company</span>
          </a>
          <a href="#career-pathways" className={`mobile-bottom-link-item ${activeSection === 'career-pathways' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'career-pathways')}>
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <span className="label-text">Careers</span>
          </a>
          <a href="#faq" className={`mobile-bottom-link-item ${activeSection === 'faq' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'faq')}>
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="label-text">FAQ</span>
          </a>
          <a href="#founders" className={`mobile-bottom-link-item ${activeSection === 'founders' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'founders')}>
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="label-text">About</span>
          </a>
        </div>
      </div>
    </>
  );
}