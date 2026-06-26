import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import CRMFilterBar from './CRMFilterBar';
import { LoadingState, EmptyState, ErrorState, getFilterFriendlyLabel } from './CRMStateTemplates';
import { exportToExcel, exportToCsv, exportToPdfTable, fmtDate } from '../utils/exportHelpers';

const ContactsView = ({ apiUrl, token, adminProfile, user }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState({ filter: 'today', fromUTC: '', to_date: '' });

  const fetchContacts = async (range = dateFilter) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      let url = `${apiUrl}/api/contacts`;
      if (range.filter) {
        url += `?filter=${range.filter}&from_date=${encodeURIComponent(range.fromUTC)}&to_date=${encodeURIComponent(range.to_date)}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setContacts(data.contacts);
      } else {
        setError(data.message || 'Failed to fetch contact inquiries.');
      }
    } catch (err) {
      setError('Communication error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (range) => {
    const newRange = { filter: range.filter, fromUTC: range.from_date, to_date: range.to_date };
    setDateFilter(newRange);
    fetchContacts(newRange);
  };

  const handleExportCSV = async () => {
    const headers = ['Name', 'Email', 'Phone', 'Message', 'Date'];
    const rows = contacts.map(c => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.message || '',
      fmtDate(c.createdAt)
    ]);
    exportToCsv(headers, rows, 'contact_requests_export');
  };

  const handleExportExcel = async () => {
    const data = contacts.map(c => ({
      'Name': c.name || '',
      'Email': c.email || '',
      'Phone': c.phone || '',
      'Message': c.message || '',
      'Date': fmtDate(c.createdAt)
    }));
    exportToExcel(data, 'Contact Requests', 'contact_requests_export');
  };

  const handleExportPDF = async () => {
    const headers = ['Name', 'Email', 'Phone', 'Message', 'Date'];
    const rows = contacts.map(c => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.message || '',
      fmtDate(c.createdAt)
    ]);
    exportToPdfTable({
      title: 'Contact Requests Report',
      subtitle: `Total Inquiries: ${contacts.length}`,
      headers,
      rows,
      fileName: 'contact_requests_export'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Contact Inquiries</h3>
          <p className="text-xs text-gray-500">View message requests received from the public website forms</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={handleExportCSV}
            onExcel={handleExportExcel}
            onPdf={handleExportPDF}
            fileNamePrefix="contact_requests_export"
          />
          <button 
            onClick={() => fetchContacts()}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 text-gray-700 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold bg-white shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Sync Inbox
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <CRMFilterBar onChange={handleFilterChange} />
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <LoadingState message="Fetching contact requests..." />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <div key={contact._id} className="glass-card p-6 bg-white border border-gray-100 rounded-2xl space-y-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{contact.name}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {contact.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-2.5">
                  <MessageSquare size={14} className="text-gray-400 mt-1 shrink-0" />
                  <p className="text-xs text-gray-700 leading-relaxed">{contact.message}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState 
              title="No contact requests found"
              subtitle={`No contact requests found for ${getFilterFriendlyLabel(dateFilter.filter)}.`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ContactsView;
