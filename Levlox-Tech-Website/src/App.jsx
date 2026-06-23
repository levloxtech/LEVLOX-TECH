import React, { useState, useEffect } from 'react';
import Popup from './components/Popup';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Results from './components/Results';
import CompanyPathways from './components/CompanyPathways';
import CareerPathways from './components/CareerPathways'; 
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import Founders from './components/Founders';
import Footer from './components/Footer';
import CourseEnrollPage from './components/CourseEnrollPage';
import CertificateVerification from './components/CertificateVerification';

import api from './api/axios';

export default function App() {
  const [coursesList, setCoursesList] = useState([]);
  const [enrolledCourse, setEnrolledCourse] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data && res.data.status === 'success') {
          const normalized = res.data.courses.map((c, idx) => ({
            id: c._id,
            _id: c._id,
            badgeText: c.badge || 'FREE',
            title: c.title,
            subtitle: c.desc || c.subtitle,
            buttonText: 'Take This Course',
            isAvailable: true,
            price: 'Free',
            desc: c.desc
          }));
          setCoursesList(normalized);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  // Animation Observer for smooth reveal
  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 50px 0px' });

    const observeElements = () => {
      const targets = document.querySelectorAll('.proof-card, .step-card, .founder-card, .faq-item');
      targets.forEach((el) => {
        if (!el.dataset.observed) {
          el.dataset.observed = 'true';
          el.style.opacity = '0';
          el.style.transform = 'translateY(24px)';
          el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
          observer.observe(el);
        }
      });
    };
    observeElements();
    return () => observer.disconnect();
  }, [enrolledCourse]);

  // Safe handler for Navbar Dropdown clicks
  const handleNavbarSelectCourse = (id) => {
    if (!id) {
      setEnrolledCourse(null);
      return;
    }
    const course = coursesList.find(c => c.id === id);
    if (course) {
      setEnrolledCourse(course);
    }
  };

  return (
    <>
      <Popup />
      <Navbar 
        isCoursePage={!!enrolledCourse} 
        onSelectCourse={handleNavbarSelectCourse} 
      />
      
      {enrolledCourse ? (
        <CourseEnrollPage 
          course={enrolledCourse} 
          onBack={() => setEnrolledCourse(null)} 
        />
      ) : (
        <main>
          <div id="hero"><Hero /></div>
          <div id="proof"><Results /></div>
          <div id="pathways"><CompanyPathways /></div>
          
          <div id="career-pathways">
            <CareerPathways onSelectCourse={(course) => setEnrolledCourse(course)} />
          </div>
                  
          <div id="how-it-works"><HowItWorks /></div>
          <div id="faq"><FAQ /></div>
          <div id="founders"><Founders /></div>
          
          {/* Certificate Verification Section */}
          <div id="certificate"><CertificateVerification /></div> 
          
          <div id="contact"><Footer /></div>
        </main>
      )}
    </>
  );
}