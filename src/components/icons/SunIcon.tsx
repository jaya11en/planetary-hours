import React from 'react';

// ☉ — Sun: circle with a central point
const SunIcon: React.FC = () => (
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
    aria-label="Sun"
  >
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export default SunIcon;
