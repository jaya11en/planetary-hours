import React from 'react';

// ☿ — Mercury: horned crescent above a circle and cross
const MercuryIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label="Mercury"
  >
    <path d="M9 5a3 3 0 0 1 6 0" />
    <circle cx="12" cy="11" r="3.5" />
    <line x1="12" y1="14.5" x2="12" y2="21" />
    <line x1="8.5" y1="18" x2="15.5" y2="18" />
  </svg>
);

export default MercuryIcon;
