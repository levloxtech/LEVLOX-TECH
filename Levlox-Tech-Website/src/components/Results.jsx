import React, { useRef, useState, useEffect } from 'react';
import api from '../api/axios';

export default function Reviews() {
  const [successStories, setSuccessStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoStory, setActiveVideoStory] = useState(null);

  const getFullVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/api')) {
      return `http://127.0.0.1:5000${url}`;
    }
    return url;
  };

  const getEmbedOrVideoUrl = (url) => {
    if (!url) return '';
    const fullUrl = getFullVideoUrl(url);
    if (fullUrl.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(fullUrl).search);
      const videoId = urlParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (fullUrl.includes('youtu.be/')) {
      const parts = fullUrl.split('/');
      const videoId = parts[parts.length - 1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return fullUrl;
  };

  const isEmbeddable = (url) => {
    if (!url) return false;
    const fullUrl = getFullVideoUrl(url);
    return fullUrl.includes('youtube.com') || fullUrl.includes('youtu.be') || fullUrl.includes('vimeo.com');
  };

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await api.get('/results');
        if (res.data && res.data.status === 'success') {
          setSuccessStories(res.data.results || []);
        }
      } catch (err) {
        console.error('Error fetching success stories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      // Scrolls by roughly one card width + gap
      const scrollAmount = direction === 'left' ? -468 : 468; 
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="proof" style={{ padding: '80px 0', backgroundColor: '#f8fafc', overflow: 'hidden', fontFamily: "'Satoshi', 'Plus Jakarta Sans', sans-serif" }}>
      
      <style>
        {`
          .proof-header {
            text-align: center;
            margin-bottom: 56px;
            padding: 0 20px;
          }
          .proof-subtitle {
            color: #6b21e8;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-size: 0.8rem;
            margin-bottom: 16px;
          }
          .proof-title {
            font-family: 'Satoshi', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
            font-size: 2.8rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 16px 0;
            letter-spacing: -0.5px;
          }
          .proof-description {
            color: #64748b;
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto;
          }

          /* ─── CAROUSEL CONTAINER & ARROWS ─── */
          .carousel-master-container {
            position: relative;
            max-width: 1500px; /* Limits width so arrows don't fly off screen on huge monitors */
            margin: 0 auto;
            padding: 0 40px; /* Room for arrows */
          }

          .nav-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 44px;
            background: #64748b; /* The exact grey from your image */
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: none;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: background 0.2s, transform 0.2s;
          }
          .nav-arrow:hover {
            background: #475569;
            transform: translateY(-50%) scale(1.05);
          }
          .nav-arrow.left { left: 10px; }
          .nav-arrow.right { right: 10px; }
          
          /* The SVG arrow inside the button */
          .nav-arrow svg {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .proof-carousel-wrapper {
            width: 100%;
            overflow-x: auto;
            padding: 20px 10px 40px 10px; /* Padding for the glow */
            scroll-behavior: smooth;
            scroll-snap-type: x mandatory;
            scrollbar-width: none; 
          }
          .proof-carousel-wrapper::-webkit-scrollbar {
            display: none; 
          }
          .proof-track {
            display: flex;
            gap: 28px; 
            width: max-content;
          }
          
          /* ─── THE SPLIT CARD ─── */
          .split-card {
            display: flex;
            width: 440px; 
            height: 250px;
            background: #fff;
            border-radius: 12px;
            /* Matches the beautiful soft purple bottom-glow from your screenshot */
            box-shadow: 0 15px 35px -10px rgba(107, 33, 232, 0.18), 0 4px 10px -2px rgba(0,0,0,0.05); 
            scroll-snap-align: center;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
          }
          .split-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 25px 50px -12px rgba(107, 33, 232, 0.25); /* Glow intensifies on hover */
          }

          /* Left Side: Video */
          .card-video-side {
            width: 45%;
            position: relative;
            background: #0f172a;
          }
          .card-video-side img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.65;
          }
          .card-video-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.1) 50%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px 16px;
          }
          .play-btn-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 48px;
            height: 48px;
            background: #7c3aed;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.5);
            transition: transform 0.2s;
          }
          .split-card:hover .play-btn-circle {
            transform: translate(-50%, -50%) scale(1.1);
          }
          .student-info { color: #fff; }
          .student-info h4 {
            margin: 0 0 4px 0;
            font-size: 0.85rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .student-info p {
            margin: 0 0 2px 0;
            font-size: 0.7rem;
            color: #cbd5e1;
            font-weight: 500;
          }

          /* Right Side: Offer Letter */
          .card-letter-side {
            width: 55%;
            padding: 24px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
          }
          .company-logo-text {
            font-family: 'Satoshi', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
            letter-spacing: -0.02em;
            font-size: 1.35rem;
            font-weight: 800;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
          }
          .job-offer-label {
            font-size: 0.6rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.5px; 
            font-weight: 700;
            margin-bottom: 16px;
          }
          .letter-role {
            font-size: 0.85rem;
            font-weight: 700;
            color: #334155;
            margin-bottom: 20px;
          }
          .letter-lpa {
            font-size: 1.6rem;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            line-height: 1;
          }
          .letter-lpa-sub {
            font-size: 0.65rem;
            color: #64748b;
            margin-top: 6px;
          }
          
          /* Gold Seal */
          .gold-seal {
            position: absolute;
            bottom: -6px;
            right: -6px;
            width: 36px;
            height: 36px;
            background: #f59e0b;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
            clip-path: polygon(50% 0%, 61% 16%, 80% 10%, 84% 29%, 100% 38%, 90% 55%, 96% 74%, 78% 81%, 74% 100%, 55% 93%, 38% 100%, 25% 84%, 6% 87%, 12% 69%, 0% 50%, 15% 35%, 8% 16%, 27% 16%, 35% 0%);
          }
          
          .gold-seal-text {
            position: absolute;
            bottom: 3px;
            right: 4px;
            font-size: 11px;
            font-weight: 900;
            color: white;
            z-index: 2;
          }

          /* Mobile Adjustments */
          @media (max-width: 768px) {
            .carousel-master-container { padding: 0 10px; }
            .nav-arrow { display: none; } /* Usually hide arrows on mobile so users can swipe */
            .proof-title { font-size: 2.2rem; }
            .split-card {
              width: 340px; 
              height: 210px;
            }
            .company-logo-text { font-size: 1.1rem; }
            .letter-lpa { font-size: 1.3rem; }
            .student-info h4 { font-size: 0.75rem; }
            .play-btn-circle { width: 40px; height: 40px; font-size: 14px; }
          }

          /* ─── VIDEO MODAL POPUP ─── */
          .video-modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }
          .video-modal-container {
            background-color: #0f172a;
            width: 100%;
            max-width: 800px;
            aspect-ratio: 16/9;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            position: relative;
            border: 1px solid #1e293b;
          }
          .video-modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(15, 23, 42, 0.6);
            color: #ffffff;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            z-index: 2010;
            transition: all 0.2s;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .video-modal-close:hover {
            background: #ef4444;
            transform: scale(1.05);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>

      <div className="proof-header">
        <div className="proof-subtitle">Proof Over Promises</div>
        <h2 className="proof-title">Real Results. Real Offers.</h2>
        <p className="proof-description">
          Explore placement stories, career transitions, interview wins, and real outcomes achieved by our
students.
        </p>
      </div>

      <div className="carousel-master-container">
        {/* Left Arrow */}
        <button className="nav-arrow left" onClick={() => scroll('left')} aria-label="Scroll Left">
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        {/* Right Arrow */}
        <button className="nav-arrow right" onClick={() => scroll('right')} aria-label="Scroll Right">
          <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <div className="proof-carousel-wrapper" ref={carouselRef}>
          <div className="proof-track">
            
            {successStories.map((story) => (
              <div key={story._id || story.id} className="split-card">
                
                 {/* LEFT SIDE: Video Thumbnail */}
                <div 
                  className="card-video-side"
                  onClick={() => setActiveVideoStory(story)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={story.image} alt={story.name} />
                  <div className="card-video-overlay">
                    <div className="play-btn-circle">▶</div>
                    <div className="student-info">
                      <h4>{story.name}</h4>
                      <p>{story.role}</p>
                      <p>{story.batch}</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Offer Letter Detail */}
                <div className="card-letter-side">
                  <div className="company-logo-text" style={{ color: story.logoColor }}>
                    {story.company}
                  </div>
                  <div className="job-offer-label">JOB OFFER LETTER</div>
                  <div className="letter-role">{story.role}</div>
                  
                  <div>
                    <h3 className="letter-lpa">{story.lpa}</h3>
                    <div className="letter-lpa-sub">CTC Package</div>
                  </div>

                  {/* Starburst gold seal & Text */}
                  <div className="gold-seal"></div>
                  <span className="gold-seal-text">LT</span>
                </div>

              </div>
            ))}

          </div>
        </div>
      </div>

      {activeVideoStory && (
        <div className="video-modal-overlay" onClick={() => setActiveVideoStory(null)}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setActiveVideoStory(null)}>✕</button>
            {isEmbeddable(activeVideoStory.videoUrl) ? (
              <iframe
                src={getEmbedOrVideoUrl(activeVideoStory.videoUrl)}
                title={activeVideoStory.name}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
                autoPlay
              ></iframe>
            ) : (
              <video
                src={getFullVideoUrl(activeVideoStory.videoUrl)}
                controls
                autoPlay
                style={{ width: '100%', height: '100%' }}
              ></video>
            )}
          </div>
        </div>
      )}

    </section>
  );
}