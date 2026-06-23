import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const ExportDropdown = ({ 
  adminProfile, 
  user, 
  onCsv, 
  onExcel, 
  onPdf, 
  fileNamePrefix = 'export' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);

  // Permission Check
  // Super Admin and Admin have access
  const role = adminProfile?.role || user?.role || '';
  const isAllowed = role === 'Super Admin' || role === 'Admin' || role === 'admin';

  // Return nothing if user is not authorized to export
  if (!isAllowed) return null;

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async (exportFn) => {
    setIsOpen(false);
    setLoading(true);
    try {
      await exportFn();
      triggerToast('Export completed successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      triggerToast('Export failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Toast notification rendered inline in container portal-like way */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-semibold animate-slide-in ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={15}/> : <CheckCircle size={15}/>}
          {toast.message}
        </div>
      )}

      <button
        onClick={() => !loading && setIsOpen(prev => !prev)}
        disabled={loading}
        className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-2xl text-[11px] font-bold hover:bg-gray-900 transition-all cursor-pointer shadow-sm disabled:opacity-50 select-none"
      >
        {loading ? (
          <RefreshCw size={13} className="animate-spin" />
        ) : (
          <Download size={13} />
        )}
        {loading ? 'Exporting...' : 'Export'}
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-[100] animate-fade-in text-left">
          <button
            onClick={() => handleExport(onCsv)}
            className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <FileText size={18} className="text-gray-400" /> Export as CSV
          </button>
          <button
            onClick={() => handleExport(onExcel)}
            className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer border-t border-gray-50 transition-colors"
          >
            <FileSpreadsheet size={18} className="text-emerald-500" /> Export as Excel
          </button>
          <button
            onClick={() => handleExport(onPdf)}
            className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer border-t border-gray-50 transition-colors"
          >
            <FileText size={18} className="text-red-500" /> Export as PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
