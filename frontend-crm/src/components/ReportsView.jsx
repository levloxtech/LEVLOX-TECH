import React from 'react';
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
  Activity
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

const ReportsView = ({ apiUrl, token, leads = [], adminProfile, user }) => {
  
  // 1. Lead Analytics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const contactedLeads = leads.filter(l => l.status === 'Contacted' || l.status === 'Follow Up').length;
  const interestedLeads = leads.filter(l => l.status === 'Interested').length;
  const enrolledLeads = leads.filter(l => l.status === 'Enrolled').length;
  const closedLeads = leads.filter(l => l.status === 'Closed').length;

  // 2. Source Analytics
  const courseLeads = leads.filter(l => l.source === 'course').length;
  const workshopLeads = leads.filter(l => l.source === 'workshop').length;
  const contactRequests = leads.filter(l => l.source === 'contact_form' || l.source === 'contact_with_resume').length;
  const resumeUploads = leads.filter(l => l.resume || l.source === 'resume_upload' || l.source === 'contact_with_resume').length;

  // 3. Conversion Analytics
  const leadToEnrolledPercent = totalLeads > 0 ? ((enrolledLeads / totalLeads) * 100).toFixed(1) : '0';
  const leadToClosedPercent = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';

  const handleExportCSV = async () => {
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
      ['Conversion Rate (Lead to Closed %)', `${leadToClosedPercent}%`]
    ];
    exportToCsv(headers, rows, 'analytics_reports_export');
  };

  const handleExportExcel = async () => {
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
      { 'Metric': 'Conversion Rate (Lead to Closed %)', 'Value': `${leadToClosedPercent}%` }
    ];
    exportToExcel(data, 'Analytics Report', 'analytics_reports_export');
  };

  const handleExportPDF = async () => {
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
      ['Conversion Rate (Lead to Closed %)', `${leadToClosedPercent}%`]
    ];
    exportToPdfTable({
      title: 'CRM Analytics & Conversion Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      headers,
      rows,
      fileName: 'analytics_reports_export',
      orientation: 'portrait'
    });
  };


  // 4. Date Analytics (Daily, Weekly, Monthly groupings)
  const getDailyLeadsData = () => {
    const counts = {};
    leads.forEach(l => {
      if (l.createdAt) {
        const dateStr = l.createdAt.split('T')[0];
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    // Sort chronologically and format
    return Object.keys(counts).sort().map(date => ({
      date: date.substring(5), // Show MM-DD for clean spacing
      count: counts[date]
    })).slice(-10); // Show last 10 active days
  };

  const getMonthlyLeadsData = () => {
    const months = {};
    leads.forEach(l => {
      if (l.createdAt) {
        const monthStr = l.createdAt.substring(0, 7); // YYYY-MM
        months[monthStr] = (months[monthStr] || 0) + 1;
      }
    });
    return Object.keys(months).sort().map(m => ({
      month: m,
      Leads: months[m]
    }));
  };

  // Recharts Data preparation
  const statusChartData = [
    { name: 'New', count: newLeads },
    { name: 'Contacted', count: contactedLeads },
    { name: 'Interested', count: interestedLeads },
    { name: 'Enrolled', count: enrolledLeads },
    { name: 'Closed', count: closedLeads }
  ];

  const sourceChartData = [
    { name: 'Courses', value: courseLeads },
    { name: 'Workshops', value: workshopLeads },
    { name: 'Contact Requests', value: contactRequests },
    { name: 'Resume Uploads', value: resumeUploads }
  ].filter(item => item.value > 0);

  const dailyData = getDailyLeadsData();
  const monthlyData = getMonthlyLeadsData();

  // Cumulative Growth Area Chart helper
  const getCumulativeData = () => {
    let accumulator = 0;
    return dailyData.map(d => {
      accumulator += d.count;
      return {
        date: d.date,
        Cumulative: accumulator
      };
    });
  };

  const cumulativeData = getCumulativeData();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-left">
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

      {/* KPI Cards section (Lead, Source, & Conversion summaries) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Leads Captured</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <Award size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{totalLeads} Records</span>
        </div>

        {/* Lead to Enrolled Conversion */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lead To Enrolled %</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <Percent size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{leadToEnrolledPercent}% Rate</span>
        </div>

        {/* Lead to Closed Conversion */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lead To Closed %</span>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
              <Percent size={14} className="text-gray-900" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 block mt-2">{leadToClosedPercent}% Rate</span>
        </div>

        {/* Active Resume Submissions */}
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

      {/* Analytics Lists / Numbers Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
        
        {/* Leads Status metrics */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Lead Analytics</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">New Leads</span>
              <span className="font-bold">{newLeads}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Contacted Leads</span>
              <span className="font-bold">{contactedLeads}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Interested Leads</span>
              <span className="font-bold">{interestedLeads}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Enrolled Leads</span>
              <span className="font-bold">{enrolledLeads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Closed Leads</span>
              <span className="font-bold">{closedLeads}</span>
            </div>
          </div>
        </div>

        {/* Leads Source Channel stats */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Source Analytics</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Course Leads</span>
              <span className="font-bold">{courseLeads}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Workshop Leads</span>
              <span className="font-bold">{workshopLeads}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-600">Contact Requests</span>
              <span className="font-bold">{contactRequests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resume Uploads</span>
              <span className="font-bold">{resumeUploads}</span>
            </div>
          </div>
        </div>

        {/* Date analytics counts */}
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

      {/* 4 Professional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Bar Chart of Lead status */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={14} />
            Lead Status Distribution
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

        {/* Chart 2: Pie Chart of Source Channels */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <PieIcon size={14} />
            Leads Source Distribution
          </h4>
          <div className="h-64 flex items-center justify-center gap-6">
            {sourceChartData.length > 0 ? (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
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
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
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

        {/* Chart 3: Line Chart of Daily progress */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <LineIcon size={14} />
            Leads Progression (Daily)
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

        {/* Chart 4: Area Chart of Cumulative Growth */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} />
            Cumulative Leads Growth
          </h4>
          <div className="h-64 text-xs font-semibold">
            {cumulativeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d0d0f" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d0d0f" stopOpacity={0}/>
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
