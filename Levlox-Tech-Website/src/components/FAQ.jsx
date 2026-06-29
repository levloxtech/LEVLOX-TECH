import React, { useState } from 'react';

const faqs = [
  {
    question: "Are all the courses and resources on the website free?",
    answer: "Yes, all the courses, playbooks, and resources available on the Levlox Tech platform are completely free."
  },
  {
    question: "Who is the 90-day program designed for?",
    answer: "It is specifically designed for freshers and final-year students who want to bridge the gap between college and the tech industry."
  },
  {
    question: "Do I need prior coding knowledge to join?",
    answer: "No, prior coding knowledge is not required. Our pathways are designed to help you learn and build from the ground up."
  },
  {
    question: "Will I get placement and interview preparation support?",
    answer: "Yes! Our entire process is built around getting you hired, including resume strategies, mock interviews, and company-specific playbooks."
  },
  {
    question: "How can I contact Levlox for guidance?",
    answer: "You can easily reach out to our mentors using the contact form in the section just below!"
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="responsive-faq-section">
      <style>{`
        /* ─── BASE MOBILE STYLES ─── */
        .responsive-faq-section {
          padding: 40px 20px; /* Reduced from 60px */
          background-color: #fdfdfd;
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
          width: 100%;
          box-sizing: border-box;
        }

        .faq-inner-container {
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .faq-subtitle {
          color: #6b21e8;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .faq-title {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -1px;
          margin: 0;
          line-height: 1.2;
        }

        .faq-card {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          transition: border-color 0.2s ease;
          margin-bottom: 16px;
        }
        .faq-card:hover {
          border-color: #cbd5e1;
        }

        .faq-btn {
          width: 100%;
          padding: 20px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 16px;
          font-weight: 700;
          transition: color 0.2s ease;
          gap: 16px;
        }

        .faq-icon {
          font-size: 24px;
          transition: transform 0.3s ease;
          flex-shrink: 0; 
        }

        .faq-answer-box {
          background-color: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }

        .faq-answer-text {
          padding: 20px 16px;
          margin: 0;
          color: #475569;
          line-height: 1.6;
          font-size: 15px;
        }

        /* ─── DESKTOP UPSCALING ─── */
        @media (min-width: 768px) {
          .responsive-faq-section {
            padding: 60px 20px; /* Reduced from 100px */
          }
          .faq-header {
            margin-bottom: 60px;
          }
          .faq-subtitle {
            font-size: 14px;
          }
          .faq-title {
            font-size: 48px;
          }
          .faq-btn {
            padding: 24px;
            font-size: 18px;
          }
          .faq-answer-text {
            padding: 24px;
            font-size: 16px;
          }
        }
      `}</style>

      <div className="faq-inner-container">
        
        {/* Section Header */}
        <div className="faq-header">
          <div className="faq-subtitle">Got Questions?</div>
          <h2 className="faq-title">Frequently Asked Questions</h2>
        </div>

        {/* Accordion Container */}
        <div>
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;

            return (
              <div key={index} className="faq-card">
                
                {/* Question Button */}
                <button 
                  onClick={() => toggleFAQ(index)}
                  className="faq-btn"
                  style={{ color: isOpen ? '#4f46e5' : '#0f172a' }}
                >
                  <span style={{ lineHeight: '1.4' }}>{faq.question}</span>
                  <span 
                    className="faq-icon"
                    style={{ 
                      color: isOpen ? '#4f46e5' : '#6b21e8',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0)'
                    }}
                  >
                    +
                  </span>
                </button>
                
                {/* Expandable Answer Content */}
                {isOpen && (
                  <div className="faq-answer-box">
                    <p className="faq-answer-text">
                      {faq.answer}
                    </p>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}