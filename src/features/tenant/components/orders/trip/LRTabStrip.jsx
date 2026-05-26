import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Horizontal LR selector: first `maxVisible` as buttons, rest in overflow popover.
 * @param {{ order_id: string, lr_number?: string }[]} linkedOrders
 */
export default function LRTabStrip({
  linkedOrders = [],
  activeOrderId,
  onChange,
  maxVisible = 2,
  size = 'md',
  className = '',
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOverflowOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!linkedOrders?.length) return null;

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]';
  const visible = linkedOrders.slice(0, maxVisible);
  const overflow = linkedOrders.slice(maxVisible);
  const overflowActive = overflow.some((o) => String(o.order_id || o.id) === String(activeOrderId));

  return (
    <div ref={wrapRef} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {visible.map((o) => {
        const id = o.order_id || o.id;
        const active = String(activeOrderId) === String(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange?.(id)}
            className={`rounded-lg font-bold border transition-colors ${pad} ${
              active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200'
            }`}
          >
            {o.lr_number || 'LR'}
          </button>
        );
      })}
      {overflow.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg font-bold border ${pad} ${
              overflowActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            +{overflow.length} <ChevronDown size={12} />
          </button>
          {overflowOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              {overflow.map((o) => {
                const id = o.order_id || o.id;
                const active = String(activeOrderId) === String(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-xs font-bold hover:bg-blue-50 ${active ? 'text-blue-700 bg-blue-50/50' : 'text-gray-700'}`}
                    onClick={() => {
                      onChange?.(id);
                      setOverflowOpen(false);
                    }}
                  >
                    {o.lr_number || id}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
