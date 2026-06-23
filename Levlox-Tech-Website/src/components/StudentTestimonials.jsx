import React from 'react';

const testimonials = [
  {
    id: 1,
    avatar: 'NK',
    name: 'Nikhil Khanna',
    role: 'Software Engineer · Delhi',
    outcome: '+₹5.8L salary hike',
    emoji: '🚀',
    stars: '⭐⭐⭐⭐⭐',
    quote:
      'I was stuck in a government job for 4 years. Levlox Tech gave me the roadmap, the mentors, and the confidence to switch. Got my first ₹8L offer in month 5. Genuinely life-changing.',
    course: 'Full Stack Web Dev',
    gradient: 'linear-gradient(135deg, #4C1D95, #6B21E8)',
  },
  {
    id: 2,
    avatar: 'SR',
    name: 'Sneha Rao',
    role: 'Freelance Dev · Bangalore',
    outcome: '3 clients in 60 days',
    emoji: '💼',
    stars: '⭐⭐⭐⭐⭐',
    quote:
      'The free Full Stack course is better than paid ones I spent ₹40K on. Got 3 freelance clients while still studying. The community support is unreal. This is the real deal.',
    course: 'Performance Marketing',
    gradient: 'linear-gradient(135deg, #1D4ED8, #6B21E8)',
  },
  {
    id: 3,
    avatar: 'DM',
    name: 'Divya Menon',
    role: 'Data Analyst · Remote',
    outcome: 'Remote job in 4 months',
    emoji: '📊',
    stars: '⭐⭐⭐⭐⭐',
    quote:
      'As a mother of two, I needed flexibility. Levlox Tech\'s structured roadmap and flexible sessions helped me land a remote analytics job in 4 months. Worth every minute.',
    course: 'Data Analytics',
    gradient: 'linear-gradient(135deg, #0E7490, #6B21E8)',
  },
  {
    id: 4,
    avatar: 'AK',
    name: 'Akash Khatri',
    role: 'Product Manager · Mumbai',
    outcome: '4 job offers at once',
    emoji: '🏆',
    stars: '⭐⭐⭐⭐⭐',
    quote:
      'The mock interviews were brutal — exactly what I needed. Cracked 4 companies in 2 weeks after the placement sprint. The offer letter strategy keeps you fully accountable.',
    course: 'Product & Business',
    gradient: 'linear-gradient(135deg, #92400E, #6B21E8)',
  },
  {
    id: 5,
    avatar: 'VP',
    name: 'Vikas Pillai',
    role: 'Frontend Dev · Hyderabad',
    outcome: '2× income in 6 months',
    emoji: '⚡',
    stars: '⭐⭐⭐⭐⭐',
    quote:
      'Zero coding background. Within 6 months I built 3 full apps, joined a product startup and doubled my income. The community kept me going when I wanted to quit.',
    course: 'Full Stack Web Dev',
    gradient: 'linear-gradient(135deg, #7F1D1D, #6B21E8)',
  },
];

export default function StudentTestimonials() {
  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <div className="section-label" style={{ justifyContent: 'center' }}>Student Stories</div>
        <h2 className="section-title" style={{ textAlign: 'center' }}>
          Hear It From Our Students
        </h2>
        <p className="section-sub" style={{ margin: '0 auto 48px', textAlign: 'center' }}>
          Real people, real results. See what they have to say about their journey with Levlox Tech.
        </p>

        <div className="reviews-grid">
          {testimonials.map((t) => (
            <div 
              key={t.id} 
              className="review-card" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderColor: 'rgba(107, 33, 232, 0.25)',
                color: 'white'
              }}
            >
              <div className="stars" style={{ marginBottom: '14px' }}>
                {t.stars}
              </div>
              <p className="review-text" style={{ color: 'rgba(255, 255, 255, 0.85)', minHeight: '80px', fontSize: '13.5px' }}>
                "{t.quote}"
              </p>
              <div className="reviewer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
                <div className="reviewer-avatar" style={{ background: t.gradient }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="reviewer-name" style={{ color: 'white' }}>{t.name}</div>
                  <div className="reviewer-role" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>{t.role}</div>
                </div>
                <div className="reviewer-outcome" style={{ color: '#10B981', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {t.emoji} {t.outcome}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
