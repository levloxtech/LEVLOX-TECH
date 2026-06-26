import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  PieChart as PieIcon, 
  FileText,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Percent,
  LineChart as LineIcon,
  Activity,
  Filter,
  X,
  ChevronDown
} from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import { exportToExcel, exportToCsv, exportToPdfTable } from '../utils/exportHelpers';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#0d0d0f', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

// Date range presets
const DATE_PRESETS = [
  { label: 'All Time',    value: 'all' },
  { label: 'Today',       value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days',value: '30d' },
  { label: 'This Month',  value: 'month' },
  { label: 'This Year',   value: 'year' },
];

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Follow Up', 'Interested', 'Enrolled', 'Closed'];
const SOURCE_OPTIONS = ['All', 'course', 'workshop', 'contact_form', 'contact_with_resume', 'resume_upload'];

const SOURCE_LABELS = {
  course: 'Course Leads',
  workshop: 'Workshop Leads',
  contact_form: 'Contact Requests',
  contact_with_resume: 'Contact + Resume',
  resume_upload: 'Resume Uploads',
};

function getDateBounds(preset) {
  const now = new Date();
  if (preset === 'all') return null;
  const start = new Date();
  if (preset === 'today') { start.setHours(0,0,0,0); }
  else if (preset === '7d') { start.setDate(now.getDate() - 7); }
  else if (preset === '30d') { start.setDate(now.getDate() - 30); }
  else if (preset === 'month') { start.setDate(1); start.setHours(0,0,0,0); }
  else if (preset === 'year') { start.setMonth(0); start.setDate(1); start.setHours(0,0,0,0); }
  return start;
}

const ReportsView = ({ apiUrl, token, leads = [], adminProfile, user }) => {

  // ── Filter State ──────────────────────────────────────────────────────────
  const [datePreset, setDatePreset]     = useState('all');
  const [customFrom,  setCustomFrom]    = useState('');
  const [customTo,    setCustomTo]      = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  // ── Active filter count badge ─────────────────────────────────────────────
  const activeFilterCount = [
    datePreset !== 'all' || customFrom || customTo,
    statusFilter !== 'All',
    sourceFilter !== 'All',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setStatusFilter('All');
    setSourceFilter('All');
  };

  // ── Filtered leads ────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Date filter
    if (customFrom || customTo) {
      const from = customFrom ? new Date(customFrom) : null;
      const to   = customTo   ? new Date(customTo + 'T23:59:59') : null;
      result = result.filter(l => {
        const d = l.createdAt ? new Date(l.createdAt) : null;
        if (!d) return false;
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
      });
    } else if (datePreset !== 'all') {
      const start = getDateBounds(datePreset);
      if (start) result = result.filter(l => l.createdAt && new Date(l.createdAt) >= start);
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(l => l.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'All') {
      result = result.filter(l => l.source === sourceFilter);
    }

    return result;
  }, [leads, datePreset, customFrom, customTo, statusFilter, sourceFilter]);

  // ── Analytics computed from filtered leads ────────────────────────────────
  const totalLeads      = filteredLeads.length;
  const newLeads        = filteredLeads.filter(l => l.status === 'New').length;
  const contactedLeads  = filteredLeads.filter(l => l.status === 'Contacted' || l.status === 'Follow Up').length;
  const interestedLeads = filteredLeads.filter(l => l.status === 'Interested').length;
  const enrolledLeads   = filteredLeads.filter(l => l.status === 'Enrolled').length;
  const closedLeads     = filteredLeads.filter(l => l.status === 'Closed').length;

  const courseLeads    = filteredLeads.filter(l => l.source === 'course').length;
  const workshopLeads  = filteredLeads.filter(l => l.source === 'workshop').length;
  const contactRequests = filteredLeads.filter(l => l.source === 'contact_form' || l.source === 'contact_with_resume').length;
  const resumeUploads  = filteredLeads.filter(l => l.resume || l.source === 'resume_upload' || l.source === 'contact_with_resume').length;

  const leadToEnrolledPercent = totalLeads > 0 ? ((enrolledLeads / totalLeads) * 100).toFixed(1) : '0';
  const leadToClosedPercent   = totalLeads > 0 ? ((closedLeads   / totalLeads) * 100).toFixed(1) : '0';

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Leads', totalLeads],
      ['New Leads', newLeads],
      ['Contacted Leads', contactedLeads],
      ['Interested Leads', interestedLeads],
      ['Enrolled Leads', enrolledLeads],
      ['Closed Leads', closedLeads],
      ['Course Leads', courseLeads],
      ['Workshop Leads', workshopLeads],
      ['Contact Requests', contactRequests],
      ['Resume Uploads', resumeUploads],
      ['Conversion Rate (Lead to Enrolled %)', `${leadToEnrolledPercent}%`],
      ['Conversion Rate (Lead to Closed %)', `${leadToClosedPercent}%`],
    ];
    exportToCsv(headers, rows, 'analytics_reports_export');
  };

  const handleExportExcel = () => {
    const data = [
      { 'Metric': 'Total Leads', 'Value': totalLeads },
      { 'Metric': 'New Leads', 'Value': newLeads },
      { 'Metric': 'Contacted Leads', 'Value': contactedLeads },
      { 'Metric': 'Interested Leads', 'Value': interestedLeads },
      { 'Metric': 'Enrolled Leads', 'Value': enrolledLeads },
      { 'Metric': 'Closed Leads', 'Value': closedLeads },
      { 'Metric': 'Course Leads', 'Value': courseLeads },
      { 'Metric': 'Workshop Leads', 'Value': workshopLeads },
      { 'Metric': 'Contact Requests', 'Value': contactRequests },
      { 'Metric': 'Resume Uploads', 'Value': resumeUploads },
      { 'Metric': 'Conversion Rate (Lead to Enrolled %)', 'Value': `${leadToEnrolledPercent}%` },
      { 'Metric': 'Conversion Rate (Lead to Closed %)', 'Value': `${leadToClosedPercent}%` },
    ];
    exportToExcel(data, 'Analytics Report', 'analytics_reports_export');
  };

  const handleExportPDF = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Leads', String(totalLeads)],
      ['New Leads', String(newLeads)],
      ['Contacted Leads', String(contactedLeads)],
      ['Interested Leads', String(interestedLeads)],
      ['Enrolled Leads', String(enrolledLeads)],
      ['Closed Leads', String(closedLeads)],
      ['Course Leads', String(courseLeads)],
      ['Workshop Leads', String(workshopLeads)],
      ['Contact Requests', String(contactRequests)],
      ['Resume Uploads', String(resumeUploads)],
      ['Conversion Rate (Lead to Enrolled %)', `${leadToEnrolledPercent}%`],
      ['Conversion Rate (Lead to Closed %)', `${leadToClosedPercent}%`],
    ];
    exportToPdfTable({
      title: 'CRM Analytics & Conversion Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      headers, rows,
      fileName: 'analytics_reports_export',
      orientation: 'portrait'
    });
  };

  // ── Chart data from filtered leads ────────────────────────────────────────
  const getDailyLeadsData = () => {
    const counts = {};
    filteredLeads.forEach(l => {
      if (l.createdAt) {
        const dateStr = l.createdAt.split('T')[0];
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return Object.keys(counts).sort().map(date => ({
      date: date.substring(5),
      count: counts[date]
    })).slice(-10);
  };

  const getMonthlyLeadsData = () => {
    const months = {};
    filteredLeads.forEach(l => {
      if (l.createdAt) {
        const monthStr = l.createdAt.substring(0, 7);
        months[monthStr] = (months[monthStr] || 0) + 1;
      }
    });
    return Object.keys(months).sort().map(m => ({ month: m, Leads: months[m] }));
  };

  const statusChartData = [
    { name: 'New',        count: newLeads },
    { name: 'Contacted',  count: contactedLeads },
    { name: 'Interested', count: interestedLeads },
    { name: 'Enrolled',   count: enrolledLeads },
    { name: 'Closed',     count: closedLeads },
  ];

  const sourceChartData = [
    { name: 'Courses',          value: courseLeads },
    { name: 'Workshops',        value: workshopLeads },
    { name: 'Contact Requests', value: contactRequests },
    { name: 'Resume Uploads',   value: resumeUploads },
  ].filter(item => item.value > 0);

  const dailyData = getDailyLeadsData();
  const monthlyData = getMonthlyLeadsData();

  const getCumulativeData = () => {
    let acc = 0;
    return dailyData.map(d => { acc += d.count; return { date: d.date, Cumulative: acc }; });
  };
  const cumulativeData = getCumulativeData();

  // ── Active filter label helper ─────────────────────────────────────────────
  const activeDateLabel = customFrom || customTo
    ? `${customFrom || '…'} → ${customTo || '…'}`
    : DATE_PRESETS.find(p => p.value === datePreset)?.label;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-left">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Reports & Analytics</h3>
          <p className="text-xs text-gray-500">Real-time analytical graphs, conversion rates, and database logs fetched directly from MongoDB.</p>
        </div>
        <ExportDropdown
          adminProfile={adminProfile}
          user={user}
          onCsv={handleExportCSV}
          onExcel={handleExportExcel}
          onPdf={handleExportPDF}
          fileNamePrefix="analytics_reports_export"
        />
      </div>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs">
        {/* Filter Toggle Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none"
          onClick={() => setFiltersOpen(v => !v)}
        >
          <div className="flex items-center gap-2.5">
            <Filter size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {activeFilterCount} active
              </span>
            )}
            {/* Active filter chips summary */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                {(datePreset !== 'all' || customFrom || customTo) && (
                  <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    📅 {activeDateLabel}
                  </span>
                )}
                {statusFilter !== 'All' && (
                  <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Status: {statusFilter}
                  </span>
                )}
                {sourceFilter !== 'All' && (
                  <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Source: {SOURCE_LABELS[sourceFilter] || sourceFilter}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); clearAllFilters(); }}
                className="text-[9px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X size={10} /> Clear All
              </button>
            )}
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Filter Panel (collapsible) */}
        {filtersOpen && (
          <div className="border-t border-gray-100 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. Date Preset */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Date Range</label>
              <div className="flex flex-wrap gap-1">
                {DATE_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setDatePreset(p.value); setCustomFrom(''); setCustomTo(''); }}
                    className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                      datePreset === p.value && !customFrom && !customTo
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-50 text-gray-600 border-gray-150 hover:border-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Custom Date Range */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Custom Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setDatePreset('all'); }}
                  className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-2 py-1.5 text-[10px] outline-none focus:border-zinc-400 font-medium"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => { setCustomTo(e.target.value); setDatePreset('all'); }}
                  className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-2 py-1.5 text-[10px] outline-none focus:border-zinc-400 font-medium"
                  placeholder="To"
                />
              </div>
            </div>

            {/* 3. Lead Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Lead Status</label>
              <div className="flex flex-wrap gap-1">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                      statusFilter === s
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-50 text-gray-600 border-gray-150 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Lead Source Filter */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Lead Source</label>
              <div className="flex flex-wrap gap-1">
                {SOURCE_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                      sourceFilter === s
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-50 text-gray-600 border-gray-150 hover:border-gray-300'
                    }`}
                  >
                    {s === 'All' ? 'All' : (SOURCE_LABELS[s] || s)}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── FILTERED RESULT COUNT NOTICE ──────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <Filter size={11} className="text-gray-400" />
          Showing <span className="font-bold text-gray-900 mx-1">{totalLeads}</span> of{' '}
          <span className="font-bold text-gray-900 mx-1">{leads.length}</span> total leads based on active filters.
        </div>
      )}

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Leads Captured</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <Award size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{totalLeads} Records</span>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lead To Enrolled %</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <Percent size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{leadToEnrolledPercent}% Rate</span>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lead To Closed %</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <Percent size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{leadToClosedPercent}% Rate</span>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resume Upload Count</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <FileText size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{resumeUploads} Files</span>
        </div>
      </div>

      {/* ── ANALYTICS BREAKDOWN ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">

        <div className="space-y-3">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Lead Analytics</h4>
          <div className="space-y-2 text-xs">
            {[
              { label: 'New Leads',        value: newLeads },
              { label: 'Contacted Leads',  value: contactedLeads },
              { label: 'Interested Leads', value: interestedLeads },
              { label: 'Enrolled Leads',   value: enrolledLeads },
              { label: 'Closed Leads',     value: closedLeads },
            ].map((item, i, arr) => (
              <div key={item.label} className={`flex justify-between ${i < arr.length - 1 ? 'border-b border-gray-50 pb-1.5' : ''}`}>
                <span className="text-gray-600">{item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Source Analytics</h4>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Course Leads',     value: courseLeads },
              { label: 'Workshop Leads',   value: workshopLeads },
              { label: 'Contact Requests', value: contactRequests },
              { label: 'Resume Uploads',   value: resumeUploads },
            ].map((item, i, arr) => (
              <div key={item.label} className={`flex justify-between ${i < arr.length - 1 ? 'border-b border-gray-50 pb-1.5' : ''}`}>
                <span className="text-gray-600">{item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Date Analytics</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Daily Leads Capture</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Weekly leads frequency</span>
              <span className="font-bold">Grouped</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly leads trend</span>
              <span className="font-bold">Parsed</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── CHARTS GRID ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Chart 1: Bar — Lead Status Distribution */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={14} /> Lead Status Distribution
          </h4>
          <div className="h-64 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#0d0d0f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pie — Source Distribution */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <PieIcon size={14} /> Leads Source Distribution
          </h4>
          <div className="h-64 flex items-center justify-center gap-6">
            {sourceChartData.length > 0 ? (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {sourceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col gap-2">
                  {sourceChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-gray-500 font-medium">{item.name}:</span>
                      <span className="text-gray-900 font-bold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-xs italic">No active channel logs found</p>
            )}
          </div>
        </div>

        {/* Chart 3: Line — Daily Progression */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <LineIcon size={14} /> Leads Progression (Daily)
          </h4>
          <div className="h-64 text-xs font-semibold">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="count" stroke="#0d0d0f" strokeWidth={2.5} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-xs italic flex items-center justify-center h-full">No daily records logged yet</p>
            )}
          </div>
        </div>

        {/* Chart 4: Area — Cumulative Growth */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} /> Cumulative Leads Growth
          </h4>
          <div className="h-64 text-xs font-semibold">
            {cumulativeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0d0d0f" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0d0d0f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="Cumulative" stroke="#0d0d0f" fillOpacity={1} fill="url(#colorCumulative)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-xs italic flex items-center justify-center h-full">No cumulative data computed</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReportsView;
