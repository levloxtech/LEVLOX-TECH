import React from 'react';

const successStories = [
  {
    id: 1,
    name: 'AMAN VERMA',
    role: 'Data Analyst',
    batch: "Batch '23",
    company: 'Google',
    logoColor: '#4285F4',
    lpa: '₹12 LPA',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    name: 'PRIYA SHARMA',
    role: 'Full Stack Developer',
    batch: "Batch '22",
    company: 'Microsoft',
    logoColor: '#F25022',
    lpa: '₹18 LPA',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    name: 'VIKRAM SINGH',
    role: 'Backend Developer',
    batch: "Batch '23",
    company: 'amazon',
    logoColor: '#FF9900',
    lpa: '₹16 LPA',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 4,
    name: 'NEHA JOSHI',
    role: 'Data Scientist',
    batch: "Batch '22",
    company: 'Adobe',
    logoColor: '#FF0000',
    lpa: '₹17 LPA',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  }
];

export default function Reviews() {
  return (
    <section id="proof" style={{ padding: '100px 0', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      <style>
        {`
          .proof-header {
            text-align: center;
            margin-bottom: 50px;
            padding: 0 20px;
          }
          .proof-carousel-wrapper {
            width: 100%;
            overflow-x: auto;
            padding: 20px 5%;
            scroll-behavior: smooth;
            scroll-snap-type: x mandatory;
            scrollbar-width: none; /* Firefox */
          }
          .proof-carousel-wrapper::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
          .proof-track {
            display: flex;
            gap: 24px;
            width: max-content;
          }
          
          /* The Main Split Card */
          .split-card {
            display: flex;
            width: 420px;
            height: 240px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1);
            scroll-snap-align: center;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
          }
          .split-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px -10px rgba(107, 33, 232, 0.2);
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
            opacity: 0.6;
          }
          .card-video-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.2) 60%, rgba(15,23,42,0.4) 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 16px;
          }
          .play-btn-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 44px;
            height: 44px;
            background: #6b21e8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(107, 33, 232, 0.5);
            transition: transform 0.2s;
          }
          .split-card:hover .play-btn-circle {
            transform: translate(-50%, -50%) scale(1.1);
          }
          .student-info {
            color: #fff;
          }
          .student-info h4 {
            margin: 0 0 2px 0;
            font-size: 0.85rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .student-info p {
            margin: 0;
            font-size: 0.7rem;
            color: #cbd5e1;
          }

          /* Right Side: Offer Letter */
          .card-letter-side {
            width: 55%;
            padding: 8px;
            background: #fdfdfd;
          }
          .letter-inner-border {
            width: 100%;
            height: 100%;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
            background-image: repeating-linear-gradient(45deg, #f8fafc 25%, transparent 25%, transparent 75%, #f8fafc 75%, #f8fafc), repeating-linear-gradient(45deg, #f8fafc 25%, #ffffff 25%, #ffffff 75%, #f8fafc 75%, #f8fafc);
            background-position: 0 0, 10px 10px;
            background-size: 20px 20px;
          }
          .company-logo-text {
            font-size: 1.2rem;
            font-weight: 900;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .job-offer-label {
            font-size: 0.65rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .letter-role {
            font-size: 0.8rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 16px;
          }
          .letter-lpa {
            font-size: 1.4rem;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            line-height: 1;
          }
          .letter-lpa-sub {
            font-size: 0.65rem;
            color: #64748b;
            margin-top: 4px;
          }
          
          /* Gold Seal */
          .gold-seal {
            position: absolute;
            bottom: 12px;
            right: 12px;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #fbbf24, #d97706);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 10px;
            font-weight: 900;
            box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);
            border: 2px dashed rgba(255,255,255,0.4);
          }

          /* Mobile Adjustments */
          @media (max-width: 768px) {
            .split-card {
              width: 340px; /* Slightly narrower on mobile */
              height: 200px;
            }
            .company-logo-text { font-size: 1rem; }
            .letter-lpa { font-size: 1.2rem; }
            .student-info h4 { font-size: 0.75rem; }
            .student-info p { font-size: 0.65rem; }
            .play-btn-circle { width: 36px; height: 36px; font-size: 14px; }
          }
        `}
      </style>

      <div className="proof-header">
        <div style={{ color: '#6b21e8', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '12px' }}>
          Proof Over Promises
        </div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
          Real Results. Real Offers.
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          See how our structured roadmaps translate into elite tier job offers.
        </p>
      </div>

      <div className="proof-carousel-wrapper">
        <div className="proof-track">
          
          {successStories.map((story) => (
            <div key={story.id} className="split-card">
              
              {/* LEFT SIDE: Video Thumbnail */}
              <div className="card-video-side">
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
                <div className="letter-inner-border">
                  <div className="company-logo-text" style={{ color: story.logoColor }}>
                    {story.company}
                  </div>
                  <div className="job-offer-label">JOB OFFER LETTER</div>
                  <div className="letter-role">{story.role}</div>
                  
                  <div>
                    <h3 className="letter-lpa">{story.lpa}</h3>
                    <div className="letter-lpa-sub">CTC Package</div>
                  </div>

                  {/* Little decorative gold seal in the corner */}
                  <div className="gold-seal">LT</div>
                </div>
              </div>

            </div>
          ))}

        </div>
      </div>

    </section>
  );
}