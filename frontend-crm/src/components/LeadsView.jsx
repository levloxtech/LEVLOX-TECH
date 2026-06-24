import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  MapPin,
  RefreshCw, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  FileText, 
  Upload, 
  Download, 
  MessageSquare, 
  Clock,
  Printer,
  Briefcase
} from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import CRMFilterBar from './CRMFilterBar';
import { LoadingState, EmptyState, getFilterFriendlyLabel } from './CRMStateTemplates';
import { exportToExcel, exportToCsv, exportToPdfTable, fmtDate } from '../utils/exportHelpers';

const STATUS_OPTIONS = ['New', 'Contacted', 'Follow Up', 'Interested', 'Enrolled', 'Closed'];
const SOURCE_OPTIONS = ['course', 'workshop', 'contact_form', 'resume_upload', 'video_lead', 'manual'];

const LeadsView = ({ leads: initialLeads = [], onRefresh, loading: globalLoading, apiUrl, token, categoryTitle, adminProfile, user }) => {
  const [leads, setLeads] = useState(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multiple filters
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ filter: 'month', from: '', to: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Detail Slide-over State
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);

  // Form Modal State (for Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    source: 'manual',
    status: 'New',
    location: 'Unknown',
    company: 'Unknown'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Client-side search and multi-filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter ? lead.status === statusFilter : true;
    const matchesSource = sourceFilter ? lead.source === sourceFilter : true;
    const matchesLocation = locationFilter 
      ? (lead.location?.toLowerCase().includes(locationFilter.toLowerCase()) || 
         lead.company?.toLowerCase().includes(locationFilter.toLowerCase())) 
      : true;

    // Date range match
    let matchesDate = true;
    if (dateFilter.from || dateFilter.to) {
      const leadDate = lead.createdAt ? lead.createdAt.split('T')[0] : '';
      if (dateFilter.from && leadDate < dateFilter.from) matchesDate = false;
      if (dateFilter.to && leadDate > dateFilter.to) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesSource && matchesLocation && matchesDate;
  });

  // Pagination
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sourceFilter, locationFilter, dateFilter]);

  const fetchLeadDetails = async (leadId) => {
    try {
      const res = await fetch(`${apiUrl}/api/leads/${leadId}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSelectedLead(data.lead);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Contacted': return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
      case 'Follow Up': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Interested': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Enrolled': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Closed': return 'bg-rose-50 text-rose-700 border border-rose-100';
      default: return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'contact_form': return 'bg-sky-50 text-sky-700 border border-sky-100';
      case 'workshop': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'course': return 'bg-teal-50 text-teal-700 border border-teal-100';
      case 'resume_upload': return 'bg-orange-50 text-orange-700 border border-orange-100';
      case 'video_lead': return 'bg-rose-50 text-rose-700 border border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  // Actions
  const handleOpenAddForm = () => {
    setFormMode('add');
    setFormData({
      id: '',
      name: '',
      email: '',
      phone: '',
      source: 'manual',
      status: 'New',
      location: 'Unknown',
      company: 'Unknown'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (lead, e) => {
    e.stopPropagation();
    setFormMode('edit');
    setFormData({
      id: lead._id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source || 'manual',
      status: lead.status || 'New',
      location: lead.location || 'Unknown',
      company: lead.company || 'Unknown'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const url = formMode === 'add' 
        ? `${apiUrl}/api/leads/` 
        : `${apiUrl}/api/leads/${formData.id}`;
      
      const method = formMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setIsFormOpen(false);
        onRefresh();
        if (selectedLead && selectedLead._id === formData.id) {
          fetchLeadDetails(formData.id);
        }
      } else {
        setFormError(data.message || 'Error occurred');
      }
    } catch (err) {
      setFormError('Network communication error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (leadId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        if (selectedLead && selectedLead._id === leadId) setSelectedLead(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedLead) return;

    try {
      const res = await fetch(`${apiUrl}/api/leads/${selectedLead._id}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ note: noteContent })
      });
      if (res.ok) {
        setNoteContent('');
        fetchLeadDetails(selectedLead._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedLead) return;
    try {
      await fetch(`${apiUrl}/api/leads/${selectedLead._id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchLeadDetails(selectedLead._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedLead) return;

    const fileFormData = new FormData();
    fileFormData.append('resume', file);

    setResumeUploading(true);
    try {
      const res = await fetch(`${apiUrl}/api/leads/${selectedLead._id}/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fileFormData
      });
      if (res.ok) {
        fetchLeadDetails(selectedLead._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!selectedLead || !selectedLead.resume) return;
    try {
      const res = await fetch(`${apiUrl}/api/leads/${selectedLead._id}/download-resume`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedLead.resume.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadResumeForLead = async (lead, e) => {
    if (e) e.stopPropagation();
    if (!lead || !lead.resume) return;
    try {
      const res = await fetch(`${apiUrl}/api/leads/${lead._id}/download-resume`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = lead.resume.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Exporters
  const handleExportCSV = async () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Source', 'Status', 'Created Date'];
    const rows = filteredLeads.map(lead => [
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.company || 'Unknown',
      lead.location || 'Unknown',
      lead.source || '',
      lead.status || '',
      fmtDate(lead.createdAt)
    ]);
    exportToCsv(headers, rows, 'leads_export');
  };

  const handleExportExcel = async () => {
    const data = filteredLeads.map(lead => ({
      'Name': lead.name || '',
      'Email': lead.email || '',
      'Phone': lead.phone || '',
      'Company': lead.company || 'Unknown',
      'Location': lead.location || 'Unknown',
      'Source': lead.source || '',
      'Status': lead.status || '',
      'Created Date': fmtDate(lead.createdAt)
    }));
    exportToExcel(data, 'Leads', 'leads_export');
  };

  const handleExportPDF = async () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Source', 'Status', 'Created Date'];
    const rows = filteredLeads.map(l => [
      l.name || '',
      l.email || '',
      l.phone || '',
      l.company || 'Unknown',
      l.location || 'Unknown',
      l.source || '',
      l.status || '',
      fmtDate(l.createdAt)
    ]);
    exportToPdfTable({
      title: `${categoryTitle || 'Leads'} Export Report`,
      subtitle: `Total Records: ${filteredLeads.length}`,
      headers,
      rows,
      fileName: 'leads_export'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">{categoryTitle || "Leads Directory"}</h3>
          <p className="text-xs text-gray-500">View, track status workflows, upload resumes, and audit history logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh} 
            disabled={globalLoading}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 text-gray-700 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold bg-white shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} className={globalLoading ? 'animate-spin' : ''} />
            Sync
          </button>
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white active:scale-95 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
          >
            <Plus size={14} />
            Create Lead
          </button>
        </div>
      </div>

      {/* Exporters and Multi Filters */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 text-left">
        <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-4 gap-4">
          <CRMFilterBar onChange={(range) => setDateFilter({ filter: range.filter, from: range.localFrom, to: range.localTo })} />
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={handleExportCSV}
            onExcel={handleExportExcel}
            onPdf={handleExportPDF}
            fileNamePrefix="leads_export"
          />
        </div>

        {/* Filters Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white cursor-pointer font-medium"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white cursor-pointer font-medium"
          >
            <option value="">All Sources</option>
            {SOURCE_OPTIONS.map(o => (
              <option key={o} value={o}>{o.replace('_', ' ')}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6">Company / Location</th>
                <th className="py-4 px-6">Source</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6">Resume Uploaded</th>
                <th className="py-4 px-6">Resume File</th>
                <th className="py-4 px-6">Download Resume</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {globalLoading ? (
                <tr>
                  <td colSpan="10" className="py-12">
                    <LoadingState message={`Fetching ${(categoryTitle || 'Leads').toLowerCase()}...`} compact />
                  </td>
                </tr>
              ) : currentLeads.length > 0 ? (
                currentLeads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    onClick={() => { setSelectedLead(lead); fetchLeadDetails(lead._id); }}
                    className="hover:bg-gray-50/30 transition-all duration-150 cursor-pointer"
                  >
                    <td className="py-4 px-6 font-bold text-gray-900">{lead.name}</td>
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Mail size={12} className="text-gray-400" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone size={12} className="text-gray-400" />
                        {lead.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                        <Briefcase size={12} className="text-gray-400" />
                        {lead.company || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MapPin size={12} className="text-gray-400" />
                        {lead.location || 'Unknown'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getSourceBadge(lead.source)}`}>
                        {lead.source?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 flex items-center gap-1.5 mt-2">
                      <CalendarIcon size={12} className="text-gray-400" />
                      {new Date(lead.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      {lead.resume ? 'Yes' : 'No'}
                    </td>
                    <td className="py-4 px-6 text-gray-500 truncate max-w-[120px]" title={lead.resume?.filename || ''}>
                      {lead.resume?.filename || '—'}
                    </td>
                    <td className="py-4 px-6">
                      {lead.resume ? (
                        <button
                          onClick={(e) => handleDownloadResumeForLead(lead, e)}
                          className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all"
                        >
                          <Download size={11} />
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); fetchLeadDetails(lead._id); }}
                          className="p-1.5 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-gray-600 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={(e) => handleOpenEditForm(lead, e)}
                          className="p-1.5 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-gray-600 transition-all cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteLead(lead._id, e)}
                          className="p-1.5 border border-red-50 hover:bg-red-50 hover:border-red-200 text-red-500 rounded-lg transition-all cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-12">
                    <EmptyState 
                      title={`No ${(categoryTitle || 'Leads').toLowerCase()} found`}
                      subtitle={`No ${(categoryTitle || 'Leads').toLowerCase()} found for ${getFilterFriendlyLabel(dateFilter.filter)}.`}
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} leads
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Slide-Over (Right Side Drawer) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={() => setSelectedLead(null)} />
          
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in">
            {/* Drawer Header */}
            <div className="border-b border-gray-100 p-6 flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-gray-900 text-lg">{selectedLead.name}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getSourceBadge(selectedLead.source)}`}>
                    {selectedLead.source?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Info</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail size={13} className="text-gray-400" />
                      <a href={`mailto:${selectedLead.email}`} className="hover:underline">{selectedLead.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone size={13} className="text-gray-400" />
                      <a href={`tel:${selectedLead.phone}`} className="hover:underline">{selectedLead.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase size={13} className="text-gray-400" />
                      Company: {selectedLead.company || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={13} className="text-gray-400" />
                      Location: {selectedLead.location || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timeline details</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CalendarIcon size={13} className="text-gray-400" />
                      Created: {new Date(selectedLead.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={13} className="text-gray-400" />
                      Updated: {selectedLead.updatedAt ? new Date(selectedLead.updatedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Lead Metadata */}
              {selectedLead.videoName && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Video Engagement Metrics</span>
                  <p className="text-xs font-bold text-slate-900">Watched: "{selectedLead.videoName}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-black h-full" style={{ width: `${selectedLead.watchPercentage}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 shrink-0">{selectedLead.watchPercentage}% View Ratio</span>
                  </div>
                </div>
              )}

              {/* Resume Component */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} />
                  Resume / CV Document
                </span>

                {selectedLead.resume ? (
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-rose-500" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-900 truncate max-w-xs">{selectedLead.resume.filename}</p>
                        <p className="text-[9px] text-gray-400">Status: {selectedLead.resume.status || 'Pending'}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadResume}
                      className="flex items-center gap-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      <Download size={11} />
                      Download
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center space-y-3">
                    <p className="text-xs text-gray-400">No Resume document attached to this lead yet.</p>
                    <label className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs">
                      <Upload size={11} />
                      {resumeUploading ? 'Uploading...' : 'Attach Resume File'}
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={handleResumeUpload}
                        className="hidden" 
                        disabled={resumeUploading}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  Interaction Notes ({selectedLead.notes?.length || 0})
                </span>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type note and hit enter to log..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white"
                  />
                  <button type="submit" className="bg-black hover:bg-gray-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer">
                    Add
                  </button>
                </form>

                <div className="space-y-2.5">
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    selectedLead.notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 p-3 rounded-xl border border-gray-50/50 flex justify-between items-start gap-4">
                        <div className="space-y-1 text-left">
                          <p className="text-xs text-gray-800 leading-relaxed">{note.content}</p>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">No comments or notes have been logged.</p>
                  )}
                </div>
              </div>

              {/* Activity History */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} />
                  System Activity Log
                </span>

                <div className="relative pl-6 space-y-4 border-l border-gray-100 ml-3 py-2 text-left">
                  {selectedLead.activity_history && selectedLead.activity_history.length > 0 ? (
                    selectedLead.activity_history.map((hist, idx) => (
                      <div key={idx} className="relative space-y-1">
                        <div className="absolute -left-[30px] top-1 w-2 h-2 rounded-full bg-gray-300 border border-white" />
                        <p className="text-xs font-medium text-gray-800">{hist.activity}</p>
                        <p className="text-[9px] text-gray-400">{new Date(hist.timestamp).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-1">No activities logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation and Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />

          <div className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-extrabold text-gray-900 text-lg">
                {formMode === 'add' ? 'Add New Lead' : 'Edit Lead Details'}
              </h4>
              <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-2.5 px-4 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white"
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white"
                  placeholder="e.g. 1234567890"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Company</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white"
                  placeholder="e.g. Zoho / Amazon"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location (City, Country)</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white"
                  placeholder="e.g. Chennai, India"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white cursor-pointer font-medium"
                  >
                    {SOURCE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white cursor-pointer font-medium"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-4"
              >
                {submitting ? 'Saving changes...' : 'Save Lead'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsView;
