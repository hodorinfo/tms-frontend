import React from 'react';

/**
 * Visual scope indicator for multi-LR trip UI.
 * @param {'lr'|'trip'} variant
 */
export default function ScopeBadge({ variant = 'lr', className = '' }) {
  const isTrip = variant === 'trip';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
        isTrip
          ? 'bg-violet-50 text-violet-700 border-violet-100'
          : 'bg-amber-50 text-amber-800 border-amber-100'
      } ${className}`}
      title={isTrip ? 'Applies once for the whole trip (all LRs).' : 'Switches with the LR tab above.'}
    >
      {isTrip ? 'Trip shared' : 'LR scoped'}
    </span>
  );
}
