import React from 'react';

const coursesData = [
  {
    id: 1,
    title: 'THE HIRING FORMULA',
    badge: 'New Release',
    badgeColor: '#ef4444', // Red
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80',
    btnText: 'Take This Course',
    isAvailable: true
  },
  {
    id: 2,
    title: 'THE PROMOTION SYSTEM',
    badge: 'It\'s Free',
    badgeColor: '#ef4444',
    img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80',
    btnText: 'Take This Course',
    isAvailable: true
  },
  {
    id: 3,
    title: 'ESCAPE SERVICE COMPANIES',
    badge: 'It\'s Free',
    badgeColor: '#ef4444',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80',
    btnText: 'Coming Soon',
    isAvailable: false
  },
  {
    id: 4,
    title: 'ELITE ENGINEER MINDSET',
    badge: 'Live In-Person',
    badgeColor: '#ef4444',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80',
    btnText: 'Attend a Workshop',
    isAvailable: true
  }
];

export default function Courses() {
  return (
    <section id="courses" style={{ padding: '100px 0', backgroundColor: '#fff' }}>
      <div className="container">
        
        {/* Modern Circular Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', justifyContent: 'center' }}>
          {coursesData.map((course, index) => (
            <div 
              key={course.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                opacity: course.isAvailable ? 1 : 0.6,
                position: 'relative'
              }}
            >
              
              {/* Featured / Unavailable Tag */}
              <div style={{ 
                backgroundColor: course.isAvailable ? course.badgeColor : '#64748b', 
                color: '#fff', 
                padding: '4px 16px', 
                borderRadius: '4px', 
                fontWeight: '800', 
                fontSize: '0.85rem', 
                textTransform: 'uppercase',
                marginBottom: '16px',
                letterSpacing: '0.5px'
              }}>
                {course.isAvailable ? course.badge : 'Coming Soon'}
              </div>

              {/* Title */}
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '900', 
                color: '#0f172a', 
                textAlign: 'center', 
                textTransform: 'uppercase', 
                letterSpacing: '-0.5px',
                marginBottom: '32px',
                minHeight: '60px'
              }}>
                {course.title}
              </h3>

              {/* Large Circular Image */}
              <div style={{ 
                width: '240px', 
                height: '240px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                marginBottom: '32px',
                boxShadow: index === 0 && course.isAvailable ? '0 0 0 8px rgba(107, 33, 232, 0.1)' : 'none', // Highlight first video
                border: index === 0 && course.isAvailable ? '4px solid #6b21e8' : 'none'
              }}>
                <img 
                  src={course.img} 
                  alt={course.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Purple CTA Button */}
              <button style={{ 
                width: '100%', 
                padding: '16px', 
                backgroundColor: course.isAvailable ? '#6b21e8' : '#94a3b8', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '50px', 
                fontSize: '1.1rem', 
                fontWeight: '700',
                cursor: course.isAvailable ? 'pointer' : 'not-allowed',
                boxShadow: course.isAvailable ? '0 10px 20px -5px rgba(107, 33, 232, 0.4)' : 'none'
              }}>
                {course.btnText}
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}