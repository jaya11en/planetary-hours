import React from 'react';

// ♀ — Venus: circle above a cross
const VenusIcon: React.FC = () => (
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
    aria-label="Venus"
  >
    <circle cx="12" cy="8.5" r="4.5" />
    <line x1="12" y1="13" x2="12" y2="21" />
    <line x1="8.5" y1="17.5" x2="15.5" y2="17.5" />
  </svg>
);

export default VenusIcon;
