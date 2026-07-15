import React from 'react';

// ♂ — Mars: circle with an arrow pointing to the upper right
const MarsIcon: React.FC = () => (
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
    aria-label="Mars"
  >
    <circle cx="10" cy="14" r="5" />
    <line x1="13.5" y1="10.5" x2="20" y2="4" />
    <polyline points="14.5 4 20 4 20 9.5" />
  </svg>
);

export default MarsIcon;
