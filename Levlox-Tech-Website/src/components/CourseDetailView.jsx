import React from 'react';

export default function CourseDetailView({ course, onBack }) {
  // Logic: First volume is "Live", others are "Coming Soon"
  const isAvailable = course.id === 1; 

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', cursor: 'pointer' }}>← Back to Pathways</button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        {/* Video Player Section */}
        <div>
          <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {isAvailable ? 'VIDEO PLAYER HERE' : 'COMING SOON'}
          </div>
          <h1 style={{ marginTop: '20px' }}>{course.title}</h1>
          <p>{course.subtitle}</p>
        </div>

        {/* Syllabus Sidebar */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3>Course Syllabus</h3>
          {course.modules.map((mod, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', color: isAvailable ? '#000' : '#94a3b8' }}>
              {mod} {!isAvailable && '(Coming Soon)'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}