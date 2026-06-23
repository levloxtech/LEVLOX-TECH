import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export const LoadingState = ({ message = "Syncing database...", compact = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-20'} space-y-3`}>
      <Loader2 size={compact ? 20 : 28} className="animate-spin text-gray-400" />
      <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">{message}</span>
    </div>
  );
};

export const EmptyState = ({ 
  title = "No records found", 
  subtitle = "There is no data matching the current filter selection.", 
  icon: Icon = Inbox, 
  compact = false 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-20 px-6'} space-y-3 bg-white border border-gray-100 rounded-3xl shadow-xs`}>
      <div className={`rounded-full bg-gray-50 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <Icon size={compact ? 18 : 24} className="text-gray-400" />
      </div>
      <div className="space-y-1">
        <h4 className={`font-extrabold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>{title}</h4>
        {subtitle && <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
};

export const ErrorState = ({ message = "Unable to load data right now.", compact = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-16 px-6'} space-y-3 bg-red-50/50 border border-red-100 rounded-3xl`}>
      <div className="rounded-full bg-red-100 w-10 h-10 flex items-center justify-center">
        <AlertCircle size={18} className="text-red-600" />
      </div>
      <div className="space-y-1">
        <h4 className="font-extrabold text-red-900 text-xs">System Error</h4>
        <p className="text-[11px] text-red-600 max-w-xs mx-auto">{message}</p>
      </div>
    </div>
  );
};

export const getFilterFriendlyLabel = (preset) => {
  const map = {
    today: 'today',
    week: 'this week',
    month: 'this month',
    year: 'this year',
    custom: 'the selected date range'
  };
  return map[preset] || 'this period';
};
