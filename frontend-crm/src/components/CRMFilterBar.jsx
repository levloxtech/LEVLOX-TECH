import React, { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';

// Format a Date as LOCAL YYYY-MM-DD (avoids UTC conversion bug in toISOString)
const fmtLocal = (d) => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Parse a YYYY-MM-DD string as LOCAL midnight (not UTC midnight)
const parseLocalDate = (str, endOfDay = false) => {
  const [y, m, d] = str.split('-').map(Number);
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0,  0,  0,  0);
};

// Convert a local YYYY-MM-DD range into UTC ISO timestamps for the backend
const toUTCRange = (localFrom, localTo) => ({
  fromUTC: parseLocalDate(localFrom, false).toISOString(),
  toUTC:   parseLocalDate(localTo,   true ).toISOString(),
});

const getRangeForPreset = (preset) => {
  const today = new Date();

  if (preset === 'today') {
    const s = fmtLocal(today);
    return { from: s, to: s };
  }
  if (preset === 'week') {
    const mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return { from: fmtLocal(mon), to: fmtLocal(today) };
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmtLocal(start), to: fmtLocal(today) };
  }
  if (preset === 'year') {
    const start = new Date(today.getFullYear(), 0, 1);
    return { from: fmtLocal(start), to: fmtLocal(today) };
  }
  return { from: fmtLocal(today), to: fmtLocal(today) };
};

const FILTER_LABELS = {
  today: 'Today',
  week:  'This Week',
  month: 'This Month',
  year:  'This Year',
  custom:'Custom Range',
};

export default function CRMFilterBar({ onChange, initialPreset = 'today' }) {
  const [activeFilter, setActiveFilter] = useState(initialPreset);
  const [customFrom, setCustomFrom]     = useState(fmtLocal(new Date()));
  const [customTo, setCustomTo]         = useState(fmtLocal(new Date()));

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let range;
    if (activeFilter === 'custom') {
      range = { from: customFrom, to: customTo };
    } else {
      range = getRangeForPreset(activeFilter);
    }
    
    const { fromUTC, toUTC } = toUTCRange(range.from, range.to);
    
    if (onChangeRef.current) {
      onChangeRef.current({
        filter: activeFilter,
        from_date: fromUTC,
        to_date: toUTC,
        localFrom: range.from,
        localTo: range.to
      });
    }
  }, [activeFilter, customFrom, customTo]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-left">
      {/* Preset pills */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-xs">
        <Filter size={12} className="text-gray-400 ml-2 shrink-0" />
        {Object.entries(FILTER_LABELS).map(([key, label]) => (
          <button
            key={key}
            id={`crm-filter-${key}`}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeFilter === key
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date pickers */}
      {activeFilter === 'custom' && (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From</span>
          <input
            id="crm-custom-from"
            type="date"
            value={customFrom}
            max={customTo}
            onChange={e => setCustomFrom(e.target.value)}
            className="text-[11px] font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
          />
          <span className="text-gray-300">–</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To</span>
          <input
            id="crm-custom-to"
            type="date"
            value={customTo}
            min={customFrom}
            onChange={e => setCustomTo(e.target.value)}
            className="text-[11px] font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
