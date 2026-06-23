import React, { useState } from 'react';

const coursesData = {
  1: { title: 'Company Interview Playbooks', category: 'Interview Strategy' },
  2: { title: 'Get Hired', category: 'Placement System' },
  3: { title: 'Get Promoted', category: 'Career Growth' },
  4: { title: 'Escape Service Companies', category: 'Career Transition' },
  5: { title: 'Think Like Elite Engineers', category: 'Engineering Mindset' }
};

// 10 Main Topics with Sub-topics
const syllabusTopics = [
  {
    id: 't1',
    title: '1. Foundation & Mindset',
    subtopics: [
      { id: 's1_1', title: 'Welcome to Scaling Bootcamp', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '12 min', content: 'In this module, you will learn the mental shift required to go from freelancer to agency owner. We cover leverage, productivity secrets, and goal setting.', quiz: { question: 'What is the primary key to scaling a business?', options: ['Working more hours', 'Building systems and leverage', 'Lowering prices'], answer: 1 } },
      { id: 's1_2', title: 'The Core Scaling Framework', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '18 min', content: 'Understand the three levers of business growth: Acquisition, Retention, and Monetization. Learn how to map your business metrics.', quiz: { question: 'Which of the following is NOT one of the 3 main levers of growth?', options: ['Retention', 'Acquisition', 'Competitor sabotage'], answer: 2 } }
    ]
  },
  {
    id: 't2',
    title: '2. Market & Niche Research',
    subtopics: [
      { id: 's2_1', title: 'Finding Hungry Markets', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '15 min', content: 'How to validate market demand using Google Trends, Reddit, and competitive analytical tools. Target high-budget clients.', quiz: { question: 'What is a "hungry market"?', options: ['A market with high demand and pain points', 'A food delivery niche', 'A market with zero competitors'], answer: 0 } },
      { id: 's2_2', title: 'Competitor Positioning', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '22 min', content: 'Learn to map out competitors and find blue oceans in saturated service niches.', quiz: { question: 'What does blue ocean strategy focus on?', options: ['Beating competitors on price', 'Creating new, uncontested market space', 'Copying top competitors'], answer: 1 } }
    ]
  },
  {
    id: 't3',
    title: '3. Irresistible Offer Creation',
    subtopics: [
      { id: 's3_1', title: 'The Grandslam Offer Concept', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '25 min', content: 'Create offers that make clients feel stupid saying no. Define core value propositions and stack bonuses.', quiz: { question: 'What is a key element of a Grandslam Offer?', options: ['High discount pricing', 'Risk reversal / Guarantees', 'Vague deliverables'], answer: 1 } },
      { id: 's3_2', title: 'Pricing Your Offer', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '14 min', content: 'How to charge premium pricing based on value delivered rather than hours spent.', quiz: { question: 'Premium pricing should be based on:', options: ['Hours worked', 'Competitor average price', 'Value and outcomes delivered'], answer: 2 } }
    ]
  },
  {
    id: 't4',
    title: '4. Lead Generation Engine',
    subtopics: [
      { id: 's4_1', title: 'Warm Outreach Strategies', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '19 min', content: 'How to leverage your existing network to land your first 3 high-paying agency clients.', quiz: { question: 'Who is the best target for initial warm outreach?', options: ['Stranger on LinkedIn', 'Past clients, colleagues, and warm contacts', 'Random email lists'], answer: 1 } },
      { id: 's4_2', title: 'Cold Outbound Campaigns', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '30 min', content: 'Cold email templates and LinkedIn scripts that convert strangers into booking calendar appointments.', quiz: { question: 'What makes a cold email convert best?', options: ['Long essay about your company', 'Highly personalized value-first hook', 'Attaching a giant brochure'], answer: 1 } }
    ]
  },
  {
    id: 't5',
    title: '5. Paid Advertising Blueprint',
    subtopics: [
      { id: 's5_1', title: 'Launching Meta Ads', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '28 min', content: 'Setup your Meta Ads Manager, pixels, custom conversions and launch your first lead-generation campaign.', quiz: { question: 'What is the purpose of the Meta Pixel?', options: ['To design images', 'To track visitor behavior and optimize campaigns', 'To speed up site load times'], answer: 1 } },
      { id: 's5_2', title: 'Scaling Campaign Budgets', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '20 min', content: 'How to scale budget daily without breaking the ad algorithm or increasing cost per acquisition.', quiz: { question: 'When scaling campaigns, you should:', options: ['Double the budget every hour', 'Scale incrementally by 15-20% daily', 'Turn ads off and on'], answer: 1 } }
    ]
  },
  {
    id: 't6',
    title: '6. High-Ticket Sales Conversion',
    subtopics: [
      { id: 's6_1', title: 'The Two-Step Sales Script', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '24 min', content: 'Break down discovery calls and demo calls. Learn how to diagnose client problems instead of pitching.', quiz: { question: 'What is the goal of a discovery call?', options: ['To pitch your product immediately', 'To qualify the lead and diagnose their problems', 'To take credit card details'], answer: 1 } },
      { id: 's6_2', title: 'Overcoming Common Objections', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '17 min', content: 'How to handle "I need to think about it", "It is too expensive", or "I need to talk to my partner".', quiz: { question: 'What is the first step to handle an objection?', options: ['Argue with the client', 'Acknowledge and clarify the underlying concern', 'Lower your price'], answer: 1 } }
    ]
  },
  {
    id: 't7',
    title: '7. Operations & Delivery',
    subtopics: [
      { id: 's7_1', title: 'Productizing Your Services', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '16 min', content: 'Standardize your deliverables and create standard operating procedures (SOPs) to execute work efficiently.', quiz: { question: 'Why should you productize services?', options: ['To work longer hours', 'To make delivery predictable and scalable', 'To charge less money'], answer: 1 } },
      { id: 's7_2', title: 'Hiring Your Team', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '22 min', content: 'Where to find talented virtual assistants, developers, or media buyers and how to vet them.', quiz: { question: 'Who should be your first key hire?', options: ['High-paid CEO replacement', 'Unpaid intern', 'Assistant or specialist to handle repetitive tasks'], answer: 2 } }
    ]
  },
  {
    id: 't8',
    title: '8. Financial Planning',
    subtopics: [
      { id: 's8_1', title: 'Cashflow Management', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '13 min', content: 'Learn to track revenue, expenses, profit margins, and calculate your business runway.', quiz: { question: 'What is business runway?', options: ['How fast your website loads', 'How long your business survives without new revenue', 'Your office building design'], answer: 1 } },
      { id: 's8_2', title: 'Tax Planning & Business Setup', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '19 min', content: 'Structuring your business as a legal entity and optimizing taxes lawfully.', quiz: { question: 'Why set up a legal entity?', options: ['To hide assets', 'For liability protection and tax benefits', 'To sound fancy'], answer: 1 } }
    ]
  },
  {
    id: 't9',
    title: '9. Customer Retention',
    subtopics: [
      { id: 's9_1', title: 'Onboarding Clients Successfully', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '21 min', content: 'Create a wow experience in the first 24 hours to ensure long term retention.', quiz: { question: 'What is the goal of onboarding?', options: ['Make the client feel secure and set clear expectations', 'Get more reviews immediately', 'Charge extra setup fees'], answer: 0 } },
      { id: 's9_2', title: 'Designing Referral Programs', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '15 min', content: 'Turn happy clients into your primary sales force by offering referral rewards.', quiz: { question: 'When is the best time to ask for a referral?', options: ['When delivering a big win or positive result', 'Immediately after payment', 'During a billing dispute'], answer: 0 } }
    ]
  },
  {
    id: 't10',
    title: '10. The Scaling Roadmap',
    subtopics: [
      { id: 's10_1', title: 'Reaching ₹10L/Month Milestone', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '26 min', content: 'A step-by-step master plan synthesizing all learnings to hit the milestone target in 90 days.', quiz: { question: 'What is key to reaching ₹10L/month?', options: ['Consistency in lead gen and sales execution', 'Changing your offer daily', 'Hiring 50 employees immediately'], answer: 0 } },
      { id: 's10_2', title: 'Graduation & Next Steps', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '11 min', content: 'Congratulations! Access alumni circles, certificates, and continue scaling.', quiz: { question: 'What should you do after completing the course?', options: ['Stop learning', 'Join the alumni network and start executing systems', 'Delete your accounts'], answer: 1 } }
    ]
  }
];

export default function CourseEnrollModal({ course, onClose }) {
  const isFree = course.badge === 'Free' || course.badge === 'Roadmap' || course.price === 'Free' || course.price === 'Start Reading' || course.enrolled === 'Free Access';

  // Lead Collection State (Enrollment Form)
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // Syllabus state
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);
  const [activeSubtopicIdx, setActiveSubtopicIdx] = useState(0);
  const [expandedTopics, setExpandedTopics] = useState({ 0: true });

  const toggleTopic = (idx) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const currentTopic = syllabusTopics[activeTopicIdx];
  const currentSubtopic = currentTopic.subtopics[activeSubtopicIdx];

  // Locked check: Topic index > 0 is locked unless enrolled
  const isLocked = !isEnrolled && activeTopicIdx > 0;

  // Quiz state
  const [selectedQuizOpt, setSelectedQuizOpt] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  // Paid/Premium state (used if the course is not free)
  const [premiumFullName, setPremiumFullName] = useState('');
  const [premiumEmail, setPremiumEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [txId, setTxId] = useState('');

  // Handle lead submission
  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    if (!userName || !userEmail || !userPhone) {
      alert('Please fill all details to enroll!');
      return;
    }
    setIsEnrolled(true);
    alert('Congratulations! 🎉 You have unlocked the full course scaling modules.');
  };

  // Submit Quiz answer
  const checkQuiz = () => {
    if (selectedQuizOpt === null) return;
    setQuizChecked(true);
    const correct = selectedQuizOpt === currentSubtopic.quiz.answer;
    setQuizCorrect(correct);
  };

  // Reset quiz when lesson changes
  const handleLessonChange = (topicIdx, subIdx) => {
    setActiveTopicIdx(topicIdx);
    setActiveSubtopicIdx(subIdx);
    setSelectedQuizOpt(null);
    setQuizChecked(false);
    setQuizCorrect(false);
  };

  // Premium Payment Processing
  const handlePayment = (e) => {
    e.preventDefault();
    if (!premiumEmail || !premiumFullName) {
      alert('Please fill in your name and email first.');
      return;
    }
    setPaymentStatus('processing');
    setTimeout(() => {
      setTxId('TXN-' + Math.floor(100000000 + Math.random() * 900000000));
      setPaymentStatus('success');
    }, 2000);
  };

  return (
    <div className="course-modal-overlay" onClick={onClose}>
      <div 
        className={`course-modal-container ${isFree ? 'modal-free-layout' : 'modal-premium-layout'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {isFree ? (
          // ─── FREE / ROADMAP: ACQUISITION.COM TRAINING AREA LAYOUT ───
          <>
            {/* Left Sidebar: Modules & Lessons */}
            <div className="modal-sidebar" style={{ width: '320px', padding: '16px' }}>
              <div className="sidebar-brand">
                <span className="logo-dot"></span>
                <h3 style={{ fontSize: '14px' }}>Course Modules</h3>
              </div>
              <div className="sidebar-course-title" style={{ marginBottom: '16px' }}>{course.title}</div>
              
              <div className="sidebar-menu" style={{ gap: '10px' }}>
                {syllabusTopics.map((topic, tIdx) => {
                  const isTopicExpanded = !!expandedTopics[tIdx];
                  return (
                    <div key={topic.id} className="accordion-group" style={{ display: 'flex', flexDirection: 'column' }}>
                      <button
                        className="accordion-header"
                        onClick={() => toggleTopic(tIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontFamily: 'Satoshi',
                          fontSize: '13px',
                          fontWeight: '700',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderRadius: '6px',
                          color: activeTopicIdx === tIdx ? 'var(--violet)' : 'var(--black)',
                          backgroundColor: activeTopicIdx === tIdx ? 'var(--gray-50)' : 'transparent',
                          width: '100%'
                        }}
                      >
                        <span>{topic.title}</span>
                        <span>{isTopicExpanded ? '▼' : '►'}</span>
                      </button>

                      {isTopicExpanded && (
                        <div className="accordion-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px', marginTop: '4px' }}>
                          {topic.subtopics.map((sub, sIdx) => {
                            const isSelected = activeTopicIdx === tIdx && activeSubtopicIdx === sIdx;
                            const isSubtopicLocked = !isEnrolled && tIdx > 0;
                            return (
                              <button
                                key={sub.id}
                                className={`subtopic-item ${isSelected ? 'active' : ''}`}
                                onClick={() => handleLessonChange(tIdx, sIdx)}
                                style={{
                                  background: isSelected ? 'var(--violet-pale)' : 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontFamily: 'Satoshi',
                                  fontSize: '12px',
                                  fontWeight: isSelected ? '600' : '400',
                                  color: isSelected ? 'var(--violet)' : 'var(--gray-600)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'var(--transition)'
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{isSubtopicLocked ? '🔒' : '▶'}</span>
                                  <span>{sub.title}</span>
                                </span>
                                <span style={{ fontSize: '10px', opacity: 0.6 }}>{sub.duration}</span>
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

            {/* Center Area: Video + Lesson Notes + Quiz */}
            <div className="modal-main-content" style={{ padding: '24px', flexGrow: 1, backgroundColor: 'var(--off-white)' }}>
              {isLocked ? (
                <div className="lock-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Module Locked</h3>
                  <p style={{ color: 'var(--gray-600)', maxWidth: '400px', marginBottom: '24px', fontSize: '14px' }}>
                    This module is premium scaling content. Please fill in your details in the enrollment box on the right to unlock all 10 modules instantly!
                  </p>
                  <button className="btn-primary" onClick={() => {
                    const formEl = document.getElementById('lead-form-name');
                    if (formEl) formEl.focus();
                  }}>
                    Fill Details on Right Sidebar
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Video Player */}
                  <div className="video-player-container" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                    <iframe
                      src={currentSubtopic.videoUrl}
                      title={currentSubtopic.title}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                    ></iframe>
                  </div>

                  {/* Title & Notes below Video */}
                  <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>{currentSubtopic.title}</h2>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--gray-600)', marginBottom: '0' }}>
                      {currentSubtopic.content}
                    </p>
                  </div>

                  {/* Quiz Component below text */}
                  {currentSubtopic.quiz && (
                    <div className="lesson-quiz-box" style={{ backgroundColor: 'var(--white)', border: '1.5px solid var(--gray-200)' }}>
                      <h5 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Video Checkpoint Quiz</h5>
                      <p className="quiz-question">{currentSubtopic.quiz.question}</p>
                      
                      <div className="quiz-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {currentSubtopic.quiz.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            className={`quiz-opt-btn ${selectedQuizOpt === oIdx ? 'selected' : ''}`}
                            onClick={() => {
                              if (!quizChecked) setSelectedQuizOpt(oIdx);
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <div className="quiz-action-bar" style={{ marginTop: '16px' }}>
                        {!quizChecked ? (
                          <button 
                            className="check-answer-btn" 
                            disabled={selectedQuizOpt === null}
                            onClick={checkQuiz}
                          >
                            Check Answer
                          </button>
                        ) : (
                          <div className="quiz-result-msg">
                            {quizCorrect ? (
                              <span className="success-txt">Correct! You've grasped this concept.</span>
                            ) : (
                              <span className="error-txt">Incorrect. Give it another try!</span>
                            )}
                            <button className="retry-btn" onClick={() => {
                              setQuizChecked(false);
                              setSelectedQuizOpt(null);
                            }}>Retry</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar: Enroll Form / User Details Collection */}
            <div className="modal-right-sidebar" style={{ width: '300px', borderLeft: '1px solid var(--gray-200)', padding: '24px', backgroundColor: 'var(--white)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {!isEnrolled ? (
                <form onSubmit={handleEnrollSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <span className="premium-label" style={{ background: 'var(--violet-pale)', color: 'var(--violet)' }}>FREE ACCESS</span>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '12px 0 8px' }}>Unlock Scaling Course</h3>
                    <p style={{ fontSize: '12px', color: 'var(--gray-600)', lineHeight: '1.5', marginBottom: '20px' }}>
                      Enter your details to enroll in the scaling bootcamp and unlock all 10 modules + interactive worksheets!
                    </p>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px' }}>Full Name</label>
                      <input
                        id="lead-form-name"
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="John"
                        style={{ padding: '10px 12px', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px' }}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="john@gmail.com"
                        style={{ padding: '10px 12px', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px' }}>Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        style={{ padding: '10px 12px', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="secure-checkout-btn" style={{ padding: '12px', fontSize: '14px', marginTop: '20px' }}>
                    Enroll Now & Unlock Free
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
                      Enrolled Successfully
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Welcome, {userName}!</h4>
                    <p style={{ fontSize: '12px', color: 'var(--gray-600)', lineHeight: '1.5', marginBottom: '20px' }}>
                      You have full access to the training console. Progress through the 10 core modules to graduate.
                    </p>

                    <div className="included-perks" style={{ marginTop: '16px' }}>
                      <h5 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Your Student Bonuses:</h5>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li style={{ fontSize: '11px', color: 'var(--gray-600)' }}>scaling-blueprint.pdf</li>
                        <li style={{ fontSize: '11px', color: 'var(--gray-600)' }}>calculator-template.xlsx</li>
                      </ul>
                    </div>
                  </div>

                  <button 
                    className="slack-join-btn" 
                    onClick={() => alert('Downloading scaling worksheets & workbook package...')} 
                    style={{ padding: '10px', fontSize: '13px' }}
                  >
                    Download Worksheets
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          // ─── PREMIUM / PAID: CHECKOUT MODAL ───
          <div className="premium-checkout-inner">
            {paymentStatus === 'success' ? (
              <div className="checkout-success-view">
                <h2>Enrollment Successful!</h2>
                <p>Welcome aboard! You have successfully purchased <strong>{course.title}</strong>.</p>
                
                <div className="receipt-box">
                  <div className="receipt-row"><span>Transaction ID:</span> <strong>{txId}</strong></div>
                  <div className="receipt-row"><span>Course price:</span> <strong>{course.price}</strong></div>
                  <div className="receipt-row"><span>Status:</span> <strong style={{ color: '#16A34A' }}>Paid</strong></div>
                </div>

                <div className="success-actions">
                  <button className="receipt-download-btn" onClick={() => window.print()}>
                    Print Invoice Receipt
                  </button>
                  <button className="slack-join-btn" onClick={() => alert('Redirecting to Levlox Tech Slack workspace...')}>
                    Join Alumni Discord/Slack
                  </button>
                </div>
                <button className="success-continue-btn" onClick={onClose}>Done, Back to Dashboard</button>
              </div>
            ) : (
              <>
                <div className="checkout-summary-panel">
                  <span className="premium-label">PREMIUM PROGRAM</span>
                  <h2>{course.title}</h2>
                  <p>{course.desc}</p>

                  <div className="included-perks">
                    <h4>What you get:</h4>
                    <ul>
                      <li>60+ Hours of On-Demand HD Videos</li>
                      <li>1-on-1 Dedicated Industry Mentor Support</li>
                      <li>Verified Completion Certificate</li>
                      <li>Live Placement Drive Access & Resume Review</li>
                    </ul>
                  </div>

                  <div className="pricing-info">
                    <div className="price-tag">
                      <span>Total Value:</span>
                      <span className="og-strike">{course.originalPrice}</span>
                    </div>
                    <div className="price-tag main-price">
                      <span>Deal Price:</span>
                      <span className="now-price">{course.price}</span>
                    </div>
                    <div className="savings-badge">
                      You save over 60% instantly!
                    </div>
                  </div>
                </div>

                <div className="checkout-form-panel">
                  {paymentStatus === 'processing' ? (
                    <div className="processing-payment-view">
                      <div className="payment-spinner"></div>
                      <h3>Securing Your Connection...</h3>
                      <p>Do not reload or close this window. Processing your secure payment through Razorpay Gateway.</p>
                    </div>
                  ) : (
                    <form onSubmit={handlePayment}>
                      <h3>Secure Checkout</h3>
                      
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          required
                          value={premiumFullName}
                          onChange={(e) => setPremiumFullName(e.target.value)}
                          placeholder="John"
                        />
                      </div>

                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          required
                          value={premiumEmail}
                          onChange={(e) => setPremiumEmail(e.target.value)}
                          placeholder="john@gmail.com"
                        />
                      </div>

                      <div className="payment-selector">
                        <label>Select Payment Method</label>
                        <div className="payment-options-grid">
                          <button
                            type="button"
                            className={`pay-opt-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod('upi')}
                          >
                            UPI (GPay/PhonePe)
                          </button>
                          <button
                            type="button"
                            className={`pay-opt-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            Card Details
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'upi' ? (
                        <div className="form-group animate-slide">
                          <label>UPI ID (VPA)</label>
                          <input
                            type="text"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="username@okaxis"
                          />
                          <span className="input-helper">Fastest & secure via GPay / PhonePe / Paytm</span>
                        </div>
                      ) : (
                        <div className="card-fields-wrapper animate-slide">
                          <div className="form-group">
                            <label>Card Number</label>
                            <input
                              type="text"
                              required
                              value={cardNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                                setCardNumber(val);
                              }}
                              placeholder="4111 2222 3333 4444"
                            />
                          </div>
                          <div className="card-row">
                            <div className="form-group">
                              <label>Expiry (MM/YY)</label>
                              <input
                                type="text"
                                required
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12/28"
                              />
                            </div>
                            <div className="form-group">
                              <label>CVV</label>
                              <input
                                type="password"
                                required
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                                placeholder="123"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <button type="submit" className="secure-checkout-btn">
                        Complete Payment — {course.price}
                      </button>

                      <p className="security-assurance">
                        SSL 256-bit encrypted secure transaction
                      </p>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
