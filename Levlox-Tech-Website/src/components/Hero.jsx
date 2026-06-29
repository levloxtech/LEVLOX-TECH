import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [sourceType, setSourceType] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHeroVideo = async () => {
      try {
        const res = await api.get('/hero-video/active/metadata');
        if (res.data && res.data.status === 'success' && res.data.video) {
          setSourceType(res.data.video.source_type || 'upload');
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
          const fetchedThumb = res.data.video.thumbnailUrl;
          if (fetchedThumb) {
            if (fetchedThumb.startsWith('http')) {
              setThumbnailUrl(fetchedThumb);
            } else {
              const baseURL = api.defaults.baseURL || 'http://127.0.0.1:5000/api';
              const cleanBase = baseURL.endsWith('/api') ? baseURL.substring(0, baseURL.length - 4) : baseURL;
              setThumbnailUrl(`${cleanBase}${fetchedThumb}`);
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

  const handlePlayClick = () => {
    if (videoUrl) {
      setIsLoading(true);
      setIsPlaying(true);
    }
  };

  return (
    <section id="hero" className="hero-override">
      
      <style>{`
        /* IMPORT PREMIUM GOOGLE FONTS FOR THE HERO SECTION */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .hero-override {
           background-color: #ffffff !important; 
           padding-top: 140px !important; 
           padding-bottom: 80px !important; 
           margin-top: 0 !important;
           margin-bottom: 0 !important;
           min-height: auto !important; 
           background-image: none !important; 
           font-family: 'Satoshi', 'Plus Jakarta Sans', 'Poppins', sans-serif !important;
           
           /* Full bleed background */
           width: 100vw !important;
           position: relative;
           left: 50%;
           right: 50%;
           margin-left: -50vw !important;
           margin-right: -50vw !important;
           box-sizing: border-box;
           overflow-x: hidden;
        }

        .hero-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero-heading { 
          order: 1; 
          font-size: 2.75rem; 
          font-weight: 900; 
          color: #0f172a; 
          line-height: 1.15; 
          margin: 0; 
          letter-spacing: -0.03em; 
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
        }
        
        .hero-heading span {
          background: linear-gradient(135deg, #6b21e8 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subheading { 
          order: 3; 
          font-size: 1.125rem; 
          color: #475569; 
          line-height: 1.6; 
          margin: 0; 
          font-weight: 500;
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.01em;
        }
        
        .hero-cta-wrapper { 
          order: 4; 
          margin-top: 8px; 
          margin-bottom: 8px; 
        }

        .hero-cta-btn {
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(135deg, #6b21e8 0%, #7c3aed 100%);
          color: #fff;
          border: none;
          padding: 18px 38px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(107, 33, 232, 0.4), 0 8px 10px -6px rgba(107, 33, 232, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          max-width: 380px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
        }

        .hero-cta-btn:hover {
          background: linear-gradient(135deg, #581c87 0%, #6d28d9 100%);
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(107, 33, 232, 0.5), 0 10px 15px -6px rgba(107, 33, 232, 0.4);
        }

        .hero-cta-btn:active {
          transform: translateY(1px);
        }

        /* ─── VIDEO COLUMN CONTAINER & META INFO ─── */
        .hero-video-wrapper { 
          order: 2; 
          width: 100%; 
          margin: 12px 0; 
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .video-meta-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 4px;
        }

        .video-meta-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.01em;
        }

        .video-meta-desc {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
          font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
          line-height: 1.4;
        }
        
        /* ─── PREMIUM IN-CARD VIDEO PLAYER ─── */
        .hero-video-card {
           position: relative;
           width: 100%;
           aspect-ratio: 16/9;
           border-radius: 20px;
           overflow: hidden;
           box-shadow: 0 25px 50px -12px rgba(107, 33, 232, 0.18), 0 12px 24px -10px rgba(0, 0, 0, 0.1);
           background: #090514;
           border: 1px solid rgba(107, 33, 232, 0.15);
           transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
         }
         
         .hero-video-card:not(.is-playing):hover {
            transform: scale(1.025) translateY(-4px);
            box-shadow: 0 35px 60px -15px rgba(107, 33, 232, 0.28), 0 15px 30px -10px rgba(0, 0, 0, 0.15);
            border-color: rgba(107, 33, 232, 0.3);
         }

         .hero-video-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.88;
            transition: opacity 0.4s ease, transform 0.6s ease;
         }
         
         .hero-video-card:not(.is-playing):hover img { 
            opacity: 0.75; 
            transform: scale(1.02);
         }

         /* LOADING STATE OVERLAY */
         .video-loader {
            position: absolute;
            inset: 0;
            background: #090514;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
            color: #ffffff;
            font-family: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            gap: 10px;
         }

         .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(107, 33, 232, 0.2);
            border-top-color: #6b21e8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
         }

         @keyframes spin {
            to { transform: rotate(360deg); }
         }

         /* GLASSMORPHISM PULSING PLAY BUTTON */
         .play-button-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3;
            pointer-events: none;
         }

         .play-button-pulse-ring {
            position: absolute;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: rgba(107, 33, 232, 0.25);
            animation: pulseRing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
         }

         @keyframes pulseRing {
            0% { transform: scale(0.65); opacity: 0.8; }
            50% { opacity: 0.4; }
            100% { transform: scale(1.2); opacity: 0; }
         }
         
         .play-button-inner {
            position: relative;
            width: 72px;
            height: 72px;
            background: rgba(107, 33, 232, 0.85);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 20px;
            box-shadow: 0 15px 30px rgba(107, 33, 232, 0.4), inset 0 1px 1px rgba(255,255,255,0.2);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
         }
         
         .hero-video-card:hover .play-button-inner {
            transform: scale(1.1);
            background: rgba(107, 33, 232, 0.95);
            box-shadow: 0 20px 40px rgba(107, 33, 232, 0.5), inset 0 1px 1px rgba(255,255,255,0.3);
         }

         /* FADE IN TRANSITION FOR INLINE PLAYER */
         .video-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
         }

         @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
         }

         /* ─── RESPONSIVE & LAYOUT BALANCING ─── */
         
         /* Tablet / Mid-size screen optimization */
         @media (min-width: 768px) {
           .hero-heading {
             font-size: 3.5rem;
           }
           .hero-subheading {
             font-size: 1.25rem;
           }
         }

         /* Desktop Layout - Premium Asymmetric Balanced Columns */
         @media (min-width: 992px) {
           .hero-container {
             display: grid;
             /* Make the right video column 10-15% wider than the text column */
             grid-template-columns: 1fr 1.25fr; 
             grid-template-rows: auto auto auto;
             align-items: center;
             /* Reduced column gap to pull content closer together and avoid empty spaces */
             gap: 12px 40px;
             padding: 0 40px;
           }

           .hero-heading { 
             grid-column: 1; 
             grid-row: 1; 
             align-self: end; 
             font-size: 4rem; 
             line-height: 1.1; 
             max-width: 100%;
           }
           
           .hero-subheading { 
             grid-column: 1; 
             grid-row: 2; 
             font-size: 1.18rem; 
             max-width: 95%; 
             align-self: start;
             margin-top: 8px;
           }
           
           .hero-cta-wrapper { 
             grid-column: 1; 
             grid-row: 3; 
             align-self: start; 
             margin-top: 12px; 
             margin-bottom: 0; 
           }

           .hero-video-wrapper { 
             grid-column: 2; 
             grid-row: 1 / span 3; 
             align-self: center; 
             margin: 0;
           }
         }

         @media (min-width: 1200px) {
           .hero-heading {
             font-size: 4.5rem;
           }
           .hero-container {
             gap: 12px 50px;
             padding: 0 60px;
           }
         }
      `}</style>

      <div className="hero-container">

        {/* 1. Heading */}
        <h1 className="hero-heading">
          Land Your First Tech Job In <span>90 Days</span>
        </h1>

        {/* 2. Video Thumbnail or In-Card Video Player */}
        <div className="hero-video-wrapper">
          <div 
            className={`hero-video-card ${isPlaying ? 'is-playing' : ''}`}
            onClick={handlePlayClick}
            style={{ cursor: videoUrl && !isPlaying ? 'pointer' : 'default' }}
          >
            {isPlaying && videoUrl ? (
              <div className="video-fade-in" style={{ width: '100%', height: '100%' }}>
                {isLoading && (
                  <div className="video-loader">
                    <div className="spinner"></div>
                    <span>Loading Video...</span>
                  </div>
                )}
                {sourceType === 'youtube' || sourceType === 'vimeo' ? (
                  <iframe
                      width="100%"
                      height="100%"
                      src={(() => {
                        let embedUrl = videoUrl;
                        if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                          let videoId = '';
                          if (embedUrl.includes('youtube.com/watch')) {
                            const urlParams = new URLSearchParams(new URL(embedUrl).search);
                            videoId = urlParams.get('v');
                          } else if (embedUrl.includes('youtu.be/')) {
                            videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
                          } else if (embedUrl.includes('youtube.com/embed/')) {
                            videoId = embedUrl.split('youtube.com/embed/')[1]?.split('?')[0];
                          }
                          embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : embedUrl;
                        } else if (embedUrl.includes('vimeo.com')) {
                          if (!embedUrl.includes('player.vimeo.com/video/')) {
                            const matches = embedUrl.match(/vimeo\.com\/(\d+)/);
                            if (matches && matches[1]) {
                              embedUrl = `https://player.vimeo.com/video/${matches[1]}`;
                            }
                          }
                        }
                        const sep = embedUrl.includes('?') ? '&' : '?';
                        return `${embedUrl}${sep}autoplay=1&mute=0&controls=1`;
                      })()}
                      title="Levlox Tech Brand Story"
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; encrypted-media; gyroscope"
                      allowFullScreen
                      onLoad={() => setIsLoading(false)}
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  ></iframe>
                ) : (
                  <video
                      src={videoUrl}
                      controls
                      autoPlay
                      playsInline
                      onLoadedData={() => setIsLoading(false)}
                      onCanPlay={() => setIsLoading(false)}
                      onPlay={() => setIsLoading(false)}
                      onPlaying={() => setIsLoading(false)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', border: 'none', display: 'block' }}
                  />
                )}
              </div>
            ) : (
              <>
                <img 
                    src={thumbnailUrl || "/brand_story_thumb.png"} 
                    alt="Levlox Brand Story Preview" 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' }} 
                />
                {videoUrl && (
                  <div className="play-button-overlay">
                    <div className="play-button-pulse-ring"></div>
                    <div className="play-button-inner">
                      <span style={{ marginLeft: '4px' }}>▶</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Typography for Video Title & Description */}
          <div className="video-meta-info">
            <h3 className="video-meta-title">Levlox Brand Story</h3>
            <p className="video-meta-desc">Watch how our structured cohort path lands students in top tech roles in 90 days.</p>
          </div>
        </div>

        {/* 3. Subheading */}
        <p className="hero-subheading">
          Learn in-demand skills, build practical experience, master interviews, and follow a structured roadmap designed to make you interview ready in 90 days.
        </p>

        {/* 4. CTA Button */}
        <div className="hero-cta-wrapper">
          <button 
            className="hero-cta-btn"
            onClick={scrollToPathways} 
          >
            Get Your Custom Company Pathway &rarr;
          </button>
        </div>

     </div>

    </section>
  );
}