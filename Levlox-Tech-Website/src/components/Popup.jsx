import React, { useState, useEffect } from 'react';

export default function Popup({ children }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 5 seconds delay
    const showTimer = setTimeout(() => {
      setShouldRender(true);
      // Wait for next tick so browser registers entry transition state
      const animTimer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(animTimer);
    }, 5000);

    return () => clearTimeout(showTimer);
  }, []);

  const handleClose = (e) => {
    // Prevent event bubbling when clicking close button
    if (e) e.stopPropagation();
    setIsVisible(false);
  };

  const handleTransitionEnd = () => {
    // Once transition to hidden is complete, remove from DOM
    if (!isVisible) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div id="popup-overlay" className={isVisible ? 'active' : ''}>
      <div
        id="popup-box"
        className={`${isVisible ? 'active' : ''} popup-mini`}
        onTransitionEnd={handleTransitionEnd}
      >
        

        <div className="popup-content">
          {children}
        </div>
      </div>
    </div>
  );
}