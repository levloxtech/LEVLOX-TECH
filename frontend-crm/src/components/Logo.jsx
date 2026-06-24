import React from 'react';

export default function Logo({ className = "h-8 w-8", ...props }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} 
      {...props}
    >
      {/* Light purple curve */}
      <path 
        d="M 29.5 64.5 C 50 64.5, 69 45, 69 25 H 60 C 60 40, 45 55.5, 29.5 55.5 V 64.5 Z" 
        fill="#d1c9ff" 
      />
      {/* White bottom bar */}
      <rect 
        x="29.5" 
        y="64.5" 
        width="41" 
        height="10" 
        fill="#ffffff" 
      />
    </svg>
  );
}
