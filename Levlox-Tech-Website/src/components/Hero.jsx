import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BRAND_VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'; // Replace with actual video

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const fetchHeroVideo = async () => {
      try {
        const res = await api.get('/hero-video/active/metadata');
        if (res.data && res.data.status === 'success' && res.data.video) {
          const fetchedUrl = res.data.video.url;
          if (fetchedUrl) {
            if (fetchedUrl.startsWith('http')) {
              setVideoUrl(fetchedUrl);
            } else {
              const baseURL = api.defaults.baseURL || 'http://127.0.0.1:5000/api';
              const cleanBase = baseURL.endsWith('/api') ? baseURL.substring(0, baseURL.length - 4) : baseURL;
              setVideoUrl(`${cleanBase}${fetchedUrl}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load active hero video:", err);
      }
    };
    fetchHeroVideo();
  }, []);

  const scrollToPathways = () => {
    const element = document.getElementById('pathways');
    if (element) {
      window.scrollTo({ top: element.offsetTop - 70, behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="hero-override">
      
      <style>{`
        /* FULL BLEED & SPACE CRUSHER OVERRIDE */
        .hero-override {
           background-color: #ffffff !important; 
           padding-top: 100px !important; 
           padding-bottom: 20px !important; 
           margin-top: 0 !important;
           margin-bottom: 0 !important;
           min-height: auto !important; 
           background-image: none !important; 
           
           /* Force full screen width to kill the purple edges */
           width: 100vw !important;
           position: relative;
           left: 50%;
           right: 50%;
           margin-left: -50vw !important;
           margin-right: -50vw !important;
           box-sizing: border-box;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        /* Mobile Layout - Brought back the 3rem big font! */
        .hero-heading { order: 1; font-size: 3.25rem; font-weight: 900; color: #0f172a; line-height: 1.15; margin: 0; letter-spacing: -1px; }
        .hero-video-wrapper { order: 2; width: 100%; margin: 10px 0; }
        .hero-subheading { order: 3; font-size: 1.22rem; color: #475569; line-height: 1.6; margin: 0; }
        .hero-cta-wrapper { order: 4; margin-top: 5px; margin-bottom: 10px; }
        
        .hero-video-card {
           position: relative;
           width: 100%;
           aspect-ratio: 16/9;
           border-radius: 16px;
           overflow: hidden;
           box-shadow: 0 20px 40px -12px rgba(107, 33, 232, 0.2);
           cursor: pointer;
           background: #000;
           border: 1px solid rgba(107, 33, 232, 0.15);
         }
         
         .hero-video-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.85;
            transition: opacity 0.3s ease, transform 0.5s ease;
         }
         
         .hero-video-card:hover img { 
             opacity: 0.6; 
             transform: scale(1.03);
         }

         .play-button-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70px;
            height: 70px;
            background: #6b21e8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            box-shadow: 0 10px 25px rgba(107, 33, 232, 0.5);
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
         }
         
         .hero-video-card:hover .play-button-overlay {
            transform: translate(-50%, -50%) scale(1.15);
         }

         /* Desktop Layout Override */
         @media (min-width: 992px) {
           .hero-container {
             display: grid;
             grid-template-columns: 1fr 1fr; 
             grid-template-rows: auto auto auto;
             align-items: center;
             gap: 16px 50px;
           }
           /* BROUGHT BACK THE MASSIVE 4.5rem DESKTOP FONT! */
           .hero-heading { grid-column: 1; grid-row: 1; align-self: end; font-size: 4.9rem; line-height: 1.1; }
           .hero-subheading { grid-column: 1; grid-row: 2; font-size: 1.32rem; max-width: 90%; }
           .hero-cta-wrapper { grid-column: 1; grid-row: 3; align-self: start; margin-top: 10px; margin-bottom: 20px; }
           .hero-video-wrapper { grid-column: 2; grid-row: 1 / span 3; align-self: center; }
         }
       `}</style>

       <div className="hero-container">
         
         {/* 1. Heading */}
         <h1 className="hero-heading">
           Land Your First Tech Job In <span style={{ color: '#6b21e8', whiteSpace: 'nowrap' }}>90 Days</span>
         </h1>

         {/* 2. Video Thumbnail */}
         <div className="hero-video-wrapper">
           <div className="hero-video-card" onClick={() => setIsPlaying(true)}>
             <img 
                 src="/brand_story_thumb.png" 
                 alt="Levlox Brand Story" 
                 onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' }} 
             />
             
             {/* <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#6b21e8', color: '#fff', padding: '6px 14px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
               ▶ BRAND STORY
             </div> */}
             
             {/* <div className="play-button-overlay">
               <span style={{ marginLeft: '4px' }}>▶</span>
             </div> */}
           </div>
         </div>

         {/* 3. Subheading */}
         <p className="hero-subheading">
           Learn in-demand skills, build practical experience, master interviews, and follow a structured roadmap designed to make you interview ready in 90 days.
         </p>

         {/* 4. CTA Button */}
         <div className="hero-cta-wrapper">
           <button 
             onClick={scrollToPathways} 
             style={{
               background: '#6b21e8',
               color: '#fff',
               border: 'none',
               padding: '18px 36px',
               borderRadius: '8px',
               fontSize: '1.12rem',
               fontWeight: '800',
               cursor: 'pointer',
               boxShadow: '0 10px 20px -5px rgba(107, 33, 232, 0.4)',
               transition: 'background 0.2s',
               width: '100%',
               maxWidth: '380px'
             }}
             onMouseEnter={(e) => e.currentTarget.style.background = '#581c87'}
             onMouseLeave={(e) => e.currentTarget.style.background = '#6b21e8'}
           >
             Get Your Custom Company Pathway
           </button>
         </div>

      </div>

      {/* Pop-up Video Modal */}
      {isPlaying && (
        <div 
            className="modal-overlay" 
            onClick={() => setIsPlaying(false)} 
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ position: 'relative', width: '100%', maxWidth: '1000px', background: '#000', borderRadius: '20px', overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          >
            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
              {videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('embed') ? (
                <video
                    src={videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', border: 'none' }}
                />
              ) : (
                <iframe 
                    width="100%" 
                    height="100%" 
                    src={videoUrl || BRAND_VIDEO_URL} 
                    title="Levlox Tech Brand Story" 
                    frameBorder="0" 
                    allow="autoplay; encrypted-media; picture-in-picture" 
                    allowFullScreen
                ></iframe>
              )}
            </div>
            
            <button 
                onClick={() => setIsPlaying(false)} 
                style={{ position: 'absolute', top: '20px', right: '20px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid rgba(255, 255, 255, 0.3)', color: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}