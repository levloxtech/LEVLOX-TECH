import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  FileText, 
  UserCheck, 
  ArrowUpRight, 
  Activity,
  ChevronDown,
  Download,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportDropdown from './ExportDropdown';

// ─── Date helpers ──────────────────────────────────────────────────────────────

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
// This ensures the backend queries the correct UTC window for any timezone
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

const PERIOD_LABEL = {
  today: 'today',
  week:  'this week',
  month: 'this month',
  year:  'this year',
  custom:'in range',
};

// ─── Component ─────────────────────────────────────────────────────────────────
const DashboardOverview = ({ data: externalData = {}, onRefresh, setActiveView, apiUrl, token, leads: externalLeads = [], adminProfile, user }) => {
  const [contacts, setContacts]           = useState([]);
  const [activities, setActivities]       = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [selectedDate, setSelectedDate]   = useState(new Date());
  const [currentMonth, setCurrentMonth]   = useState(new Date());
  const [loading, setLoading]             = useState(false);

  // ── Filter state ──
  const [activeFilter, setActiveFilter]   = useState('today');
  const [customFrom, setCustomFrom]       = useState(fmtLocal(new Date()));
  const [customTo, setCustomTo]           = useState(fmtLocal(new Date()));

  // ── Filtered stats from backend ──
  const [filteredStats, setFilteredStats] = useState(externalData);

  // ── Filtered leads/contacts from the full arrays ──
  const [filteredLeads,    setFilteredLeads]    = useState(externalLeads);
  const [filteredContacts, setFilteredContacts] = useState([]);

  // ── Compute active date range ──
  const getActiveDateRange = () => {
    if (activeFilter === 'custom') return { from: customFrom, to: customTo };
    return getRangeForPreset(activeFilter);
  };

  // ── Fetch filtered stats from backend ──
  // Sends UTC ISO timestamps so the backend queries the correct range
  // regardless of the server's timezone vs the user's local timezone
  const fetchFilteredStats = async (range) => {
    if (!token) return;
    try {
      const { fromUTC, toUTC } = toUTCRange(range.from, range.to);
      if (import.meta.env.DEV) {
        console.log('[Dashboard] Fetching stats | Local range:', range.from, '→', range.to);
        console.log('[Dashboard] UTC range sent to backend:', fromUTC, '→', toUTC);
      }
      const res = await fetch(
        `${apiUrl}/api/dashboard/stats?from_date=${encodeURIComponent(fromUTC)}&to_date=${encodeURIComponent(toUTC)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const d = await res.json();
        if (d.status === 'success') setFilteredStats(d.data);
      }
    } catch (err) {
      console.error('Error fetching filtered stats:', err);
    }
  };

  // ── Apply in-memory date filter to leads/contacts arrays ──
  // Parses date strings as LOCAL time (not UTC) to avoid off-by-one-day bugs
  const applyClientFilter = (range) => {
    const from = parseLocalDate(range.from, false);  // local midnight start
    const to   = parseLocalDate(range.to,   true);   // local 23:59:59 end

    const today = new Date();
    if (import.meta.env.DEV) console.log('[Dashboard] Client filter | Today (local):', fmtLocal(today), '| Range:', fmtLocal(from), '→', fmtLocal(to));

    const inRange = (item) => {
      if (!item.createdAt) return false;
      const created = new Date(item.createdAt);
      if (import.meta.env.DEV) console.log('[Dashboard] Record createdAt:', item.createdAt, '| Local date:', fmtLocal(created), '| In range:', created >= from && created <= to);
      return created >= from && created <= to;
    };

    setFilteredLeads(externalLeads.filter(inRange));
    setFilteredContacts(contacts.filter(inRange));
  };

  // ── Re-filter when filter or source data changes ──
  useEffect(() => {
    const range = getActiveDateRange();
    fetchFilteredStats(range);
    applyClientFilter(range);
  }, [activeFilter, customFrom, customTo, token, apiUrl]);

  useEffect(() => {
    applyClientFilter(getActiveDateRange());
  }, [externalLeads, contacts]);

  // ── Calendar date click → set to custom single-day filter ──
  const handleCalendarDateClick = (day) => {
    const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(clicked);
    const dateStr = fmtLocal(clicked);
    setCustomFrom(dateStr);
    setCustomTo(dateStr);
    setActiveFilter('custom');
  };

  // ── Fetch contacts, activities, tasks ──
  useEffect(() => {
    const fetchDashboardAdditions = async () => {
      if (!token) return;
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const contactsRes = await fetch(`${apiUrl}/api/contacts`, { headers }).catch(() => null);
        if (contactsRes && contactsRes.ok) {
          const d = await contactsRes.json();
          if (d.status === 'success') setContacts(d.contacts || []);
        }
        const activitiesRes = await fetch(`${apiUrl}/api/dashboard/activities`, { headers }).catch(() => null);
        if (activitiesRes && activitiesRes.ok) {
          const d = await activitiesRes.json();
          if (d.status === 'success') setActivities(d.activities || []);
        }
        const tasksRes = await fetch(`${apiUrl}/api/tasks/`, { headers }).catch(() => null);
        if (tasksRes && tasksRes.ok) {
          const d = await tasksRes.json();
          if (d.status === 'success') setTasks(d.tasks || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard additions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardAdditions();
  }, [apiUrl, token]);

  // ── Calendar helpers ──
  const getDaysInMonth   = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const handlePrevMonth  = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth  = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getEventsForDate = (dayNumber) => {
    const events = [];
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2,'0')}-${String(dayNumber).padStart(2,'0')}`;
    tasks.forEach(t => {
      if (t.dueDate === dateString) events.push({ type: 'task', title: `Task: ${t.title}`, status: t.status });
    });
    filteredLeads.forEach(l => {
      if (l.updatedAt && l.updatedAt.split('T')[0] === dateString)
        events.push({ type: 'lead', title: `Callback: ${l.name}`, status: l.status });
    });
    return events;
  };

  // ── Export helpers ──
  const fetchExportData = async () => {
    const range = getActiveDateRange();
    const { fromUTC, toUTC } = toUTCRange(range.from, range.to);
    const res = await fetch(
      `${apiUrl}/api/dashboard/export-data?from_date=${encodeURIComponent(fromUTC)}&to_date=${encodeURIComponent(toUTC)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error('Export fetch failed');
    return res.json();
  };

  const rangeLabel = () => {
    const r = getActiveDateRange();
    return r.from === r.to ? r.from : `${r.from} to ${r.to}`;
  };

  const exportCSV = async () => {
    try {
      const d = await fetchExportData();
      const rows = [
        ['Type', 'Name', 'Email', 'Phone', 'Source/Topic', 'Status', 'Date'],
        ...( d.leads || []).map(l =>    ['Lead',        l.name||'', l.email||'', l.phone||'', l.source||'', l.status||'', l.createdAt?.split('T')[0]||'']),
        ...(d.contacts||[]).map(c =>    ['Contact',     c.name||'', c.email||'', c.phone||'', c.help_type||'', '', c.createdAt?.split('T')[0]||'']),
        ...(d.resumes ||[]).map(r =>    ['Resume',      r.name||'', r.email||'', r.phone||'', '', '', r.createdAt?.split('T')[0]||'']),
        ...(d.enrollments||[]).map(e => ['Enrollment',  e.name||'', e.email||'', '', e.courseName||'', '', e.createdAt?.split('T')[0]||'']),
        ...(d.tasks   ||[]).map(t =>    ['Task',        t.title||'', '', '', '', t.status||'', t.dueDate||'']),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `levlox-crm-export-${rangeLabel()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
      throw err;
    }
  };

  const exportExcel = async () => {
    try {
      const d = await fetchExportData();
      const wb = XLSX.utils.book_new();

      const leadsSheet = XLSX.utils.json_to_sheet((d.leads||[]).map(l => ({
        Name: l.name, Email: l.email, Phone: l.phone, Source: l.source, Status: l.status, Date: l.createdAt?.split('T')[0]
      })));
      XLSX.utils.book_append_sheet(wb, leadsSheet, 'Leads');

      const contactsSheet = XLSX.utils.json_to_sheet((d.contacts||[]).map(c => ({
        Name: c.name, Email: c.email, Phone: c.phone, Topic: c.help_type, Message: c.message, Date: c.createdAt?.split('T')[0]
      })));
      XLSX.utils.book_append_sheet(wb, contactsSheet, 'Contact Requests');

      const resumesSheet = XLSX.utils.json_to_sheet((d.resumes||[]).map(r => ({
        Name: r.name, Email: r.email, Phone: r.phone, File: r.filename, Date: r.createdAt?.split('T')[0]
      })));
      XLSX.utils.book_append_sheet(wb, resumesSheet, 'Resume Uploads');

      const enrollSheet = XLSX.utils.json_to_sheet((d.enrollments||[]).map(e => ({
        Name: e.name, Email: e.email, Course: e.courseName, Date: e.createdAt?.split('T')[0]
      })));
      XLSX.utils.book_append_sheet(wb, enrollSheet, 'Enrollments');

      const tasksSheet = XLSX.utils.json_to_sheet((d.tasks||[]).map(t => ({
        Title: t.title, Status: t.status, Priority: t.priority, DueDate: t.dueDate
      })));
      XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks');

      XLSX.writeFile(wb, `levlox-crm-export-${rangeLabel()}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
      throw err;
    }
  };

  const exportPDF = async () => {
    try {
      const d = await fetchExportData();
      const doc = new jsPDF({ orientation: 'landscape' });

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Levlox Systems CRM', 14, 18);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${rangeLabel()}`, 14, 26);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

      // Summary stats
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 14, 42);
      const summaryData = [
        ['Total Leads', filteredStats.total_leads ?? 0],
        ['Course Leads', filteredStats.course_leads ?? 0],
        ['Workshop Leads', filteredStats.workshop_leads ?? 0],
        ['Contact Requests', filteredStats.contact_requests ?? 0],
        ['Resume Uploads', filteredStats.resume_uploads ?? 0],
        ['Enrolled Users', filteredStats.enrolled_leads ?? 0],
      ];
      autoTable(doc, {
        startY: 46,
        head: [['Metric', 'Count']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14 },
        tableWidth: 80,
      });

      const afterSummary = doc.lastAutoTable.finalY + 10;

      // Leads table
      if ((d.leads||[]).length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Leads', 14, afterSummary);
        autoTable(doc, {
          startY: afterSummary + 4,
          head: [['Name', 'Email', 'Phone', 'Source', 'Status', 'Date']],
          body: (d.leads||[]).map(l => [l.name||'', l.email||'', l.phone||'', l.source||'', l.status||'', l.createdAt?.split('T')[0]||'']),
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0], textColor: 255 },
          styles: { fontSize: 8 },
          margin: { left: 14 },
        });
      }

      // Contacts table
      if ((d.contacts||[]).length > 0) {
        const y = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Contact Requests', 14, y);
        autoTable(doc, {
          startY: y + 4,
          head: [['Name', 'Email', 'Topic', 'Date']],
          body: (d.contacts||[]).map(c => [c.name||'', c.email||'', c.help_type||'', c.createdAt?.split('T')[0]||'']),
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0], textColor: 255 },
          styles: { fontSize: 8 },
          margin: { left: 14 },
        });
      }

      // Page numbers & Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 10);
        doc.text('Levlox Tech Systems CRM • Confidentially Generated', 14, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(`levlox-crm-export-${rangeLabel()}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      throw err;
    }
  };

  // ── Derived display data ──
  const stats = { ...externalData, ...filteredStats };
  const cards = [
    { id: 'leads',           title: 'Total Leads',        value: stats.total_leads      ?? 0, icon: Users,          bgColor: 'bg-black text-white',                              accentColor: 'text-white/80' },
    { id: 'course-leads',    title: 'Course Leads',        value: stats.course_leads     ?? 0, icon: BookOpen,        bgColor: 'bg-white border border-gray-100 text-gray-900',  accentColor: 'text-gray-400' },
    { id: 'workshop-leads',  title: 'Workshop Leads',      value: stats.workshop_leads   ?? 0, icon: CalendarIcon,    bgColor: 'bg-white border border-gray-100 text-gray-900',  accentColor: 'text-gray-400' },
    { id: 'contact-requests',title: 'Contact Requests',    value: stats.contact_requests ?? 0, icon: MessageSquare,   bgColor: 'bg-white border border-gray-100 text-gray-900',  accentColor: 'text-gray-400' },
    { id: 'resume-uploads',  title: 'Resume Uploads',      value: stats.resume_uploads   ?? 0, icon: FileText,        bgColor: 'bg-white border border-gray-100 text-gray-900',  accentColor: 'text-gray-400' },
    { id: 'enrolled-users',  title: 'Enrolled Users',      value: stats.enrolled_leads   ?? 0, icon: UserCheck,       bgColor: 'bg-white border border-gray-100 text-gray-900',  accentColor: 'text-gray-400' },
  ];

  const periodLabel        = PERIOD_LABEL[activeFilter] || 'in range';
  const selectedDayEvents  = getEventsForDate(selectedDate.getDate());
  const recentLeads        = filteredLeads.slice(0, 5);
  const recentContacts     = filteredContacts.slice(0, 5);
  const recentResumes      = filteredLeads.filter(l => l.resume).slice(0, 5);
  const recentActivities   = activities.slice(0, 8);

  const monthsList = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto text-left">

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Preset pills */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-xs">
          <Filter size={12} className="text-gray-400 ml-2 shrink-0" />
          {Object.entries(FILTER_LABELS).map(([key, label]) => (
            <button
              key={key}
              id={`dash-filter-${key}`}
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
              id="dash-custom-from"
              type="date"
              value={customFrom}
              max={customTo}
              onChange={e => setCustomFrom(e.target.value)}
              className="text-[11px] font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
            />
            <span className="text-gray-300">–</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To</span>
            <input
              id="dash-custom-to"
              type="date"
              value={customTo}
              min={customFrom}
              onChange={e => setCustomTo(e.target.value)}
              className="text-[11px] font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
        )}

        {/* Export button */}
        <div className="ml-auto">
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={exportCSV}
            onExcel={exportExcel}
            onPdf={exportPDF}
            fileNamePrefix={`dashboard_${rangeLabel()}`}
          />
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left main area */}
        <div className="lg:col-span-9 space-y-8">

          {/* CRM Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveView(card.id)}
                  className={`${card.bgColor} p-6 rounded-3xl flex flex-col justify-between h-40 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer select-none`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.id === 'leads' ? 'bg-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                      <Icon size={16} className={card.id === 'leads' ? 'text-white' : 'text-gray-900'} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black block tracking-tight">{card.value}</span>
                    <span className={`text-[10px] font-bold block mt-1.5 flex items-center gap-1 ${card.accentColor}`}>
                      <ArrowUpRight size={10} className="text-emerald-500" />
                      {card.value} {periodLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Section: 4 Lists */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* Recent Leads */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-gray-900">Recent Leads</h3>
                <button onClick={() => setActiveView('leads')} className="text-[10px] font-bold text-gray-400 hover:text-black cursor-pointer">VIEW ALL</button>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[400px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2">
                      <th className="py-2">Name</th>
                      <th className="py-2">Source</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentLeads.length > 0 ? (
                      recentLeads.map((l) => (
                        <tr key={l._id} className="hover:bg-gray-50/50 transition-all">
                          <td className="py-3 font-semibold text-gray-800">{l.name}</td>
                          <td className="py-3 text-gray-500 capitalize">{l.source?.replace('_', ' ')}</td>
                          <td className="py-3">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 uppercase tracking-wider border border-gray-100">{l.status}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-6 text-center text-gray-400">No leads for {FILTER_LABELS[activeFilter]}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Contact Requests */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-gray-900">Recent Contact Requests</h3>
                <button onClick={() => setActiveView('contact-requests')} className="text-[10px] font-bold text-gray-400 hover:text-black cursor-pointer">VIEW ALL</button>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[400px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2">
                      <th className="py-2">Name</th>
                      <th className="py-2">Topic</th>
                      <th className="py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentContacts.length > 0 ? (
                      recentContacts.map((c) => (
                        <tr key={c._id} className="hover:bg-gray-50/50 transition-all">
                          <td className="py-3 font-semibold text-gray-800">{c.name}</td>
                          <td className="py-3 text-gray-500 truncate max-w-[120px]" title={c.help_type}>{c.help_type}</td>
                          <td className="py-3 text-gray-400 truncate max-w-[150px]" title={c.message}>{c.message}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-6 text-center text-gray-400">No contact requests for {FILTER_LABELS[activeFilter]}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Resume Uploads */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-gray-900">Recent Resume Uploads</h3>
                <button onClick={() => setActiveView('resume-uploads')} className="text-[10px] font-bold text-gray-400 hover:text-black cursor-pointer">VIEW ALL</button>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[400px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2">
                      <th className="py-2">Name</th>
                      <th className="py-2">Resume File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentResumes.length > 0 ? (
                      recentResumes.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50/50 transition-all">
                          <td className="py-3 font-semibold text-gray-800">{r.name}</td>
                          <td className="py-3 text-gray-500 font-medium truncate max-w-[200px]" title={r.resume?.filename}>{r.resume?.filename}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="2" className="py-6 text-center text-gray-400">No resumes for {FILTER_LABELS[activeFilter]}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-gray-900">Recent System Activities</h3>
                <button onClick={() => setActiveView('reports')} className="text-[10px] font-bold text-gray-400 hover:text-black cursor-pointer">ANALYTICS</button>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div key={act._id} className="flex gap-3 text-xs items-start p-1.5 hover:bg-gray-50 rounded-lg">
                      <Activity size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{act.activity}</p>
                        <span className="text-[9px] text-gray-400 block mt-0.5">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">No activity logs recorded</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel: CRM Calendar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-50 pb-2">CRM Calendar</h3>

            {/* Calendar Controls */}
            <div className="flex justify-between items-center text-xs font-bold text-gray-900 uppercase">
              <span>{monthsList[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="w-6 h-6 border border-gray-100 hover:bg-gray-50 flex items-center justify-center rounded-full text-gray-400 cursor-pointer">&lt;</button>
                <button onClick={handleNextMonth} className="w-6 h-6 border border-gray-100 hover:bg-gray-50 flex items-center justify-center rounded-full text-gray-400 cursor-pointer">&gt;</button>
              </div>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-y-3 text-center text-[10px]">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <span key={i} className="text-gray-400 font-bold">{d}</span>
              ))}
              {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, idx) => (
                <span key={`offset-${idx}`} className="text-transparent">0</span>
              ))}
              {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, idx) => {
                const day = idx + 1;
                const events    = getEventsForDate(day);
                const hasEvents = events.length > 0;
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
                return (
                  <div key={`day-cell-${day}`} className="flex items-center justify-center">
                    <span
                      onClick={() => handleCalendarDateClick(day)}
                      className={`relative w-7 h-7 text-[10px] font-bold rounded-full flex items-center justify-center cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-black text-white'
                          : hasEvents
                          ? 'bg-gray-100 text-black border border-black/20'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                      {hasEvents && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 bg-black rounded-full" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Date Details / Day Events */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Agenda: {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                {selectedDayEvents.length > 0 && (
                  <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-bold">
                    {selectedDayEvents.length} items
                  </span>
                )}
              </div>
              <div className="space-y-2.5 max-h-40 overflow-y-auto">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((evt, idx) => (
                    <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs flex gap-2 items-start text-left">
                      <div className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800">{evt.title}</p>
                        {evt.status && <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400">{evt.status}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-gray-400 py-4 italic">No callbacks, workshop milestones, or task deadlines on this day.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
