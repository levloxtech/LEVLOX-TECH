import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import logo from './assets/levlox-logo-light.png';
import DashboardOverview from './components/DashboardOverview';
import LeadsView from './components/LeadsView';
import UsersView from './components/UsersView';
import TasksView from './components/TasksView';
import ReportsView from './components/ReportsView';
import ActivitiesView from './components/ActivitiesView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import WorkshopsView from './components/WorkshopsView';
import ContactsView from './components/ContactsView';
import CourseManagementView from './components/CourseManagementView';
import CertificateManagementView from './components/CertificateManagementView';
import ResultsManagementView from './components/ResultsManagementView';
import { Eye, EyeOff } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash || 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
    return envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
  });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loginError, setLoginError] = useState('');
  const [loginEmail, setLoginEmail] = useState('admin@levlox.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  // Fetch admin profile details
  const fetchAdminProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAdminProfile(data.profile);
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminProfile();
    }
  }, [apiUrl, token]);

  // Stats & Notifications Count
  const [stats, setStats] = useState({
    total_leads: 0,
    today_leads: 0,
    course_leads: 0,
    today_course_leads: 0,
    workshop_leads: 0,
    today_workshop_leads: 0,
    contact_requests: 0,
    today_contact_requests: 0,
    resume_uploads: 0,
    today_resume_uploads: 0,
    enrolled_leads: 0,
    today_enrolled_leads: 0,
    interested_leads: 0,
    closed_leads: 0,
    pending_tasks: 0,
    active_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0
  });
  const [leads, setLeads] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash) {
        setActiveView(hash);
      } else {
        setActiveView('dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeView = (view) => {
    window.location.hash = `#/${view}`;
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setLoginError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setLoginError('Failed to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setActiveView('dashboard');
  };

  // Fetch function for database syncing
  // fromDate / toDate default to today so initial load matches the dashboard's "Today" filter
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const fetchData = async (fromDate, toDate) => {
    if (!token || activeView === 'course-management') return;
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    const from = fromDate || getTodayStr();
    const to   = toDate   || getTodayStr();

    try {
      // Fetch stats (filtered by date range)
      const statsRes = await fetch(`${apiUrl}/api/dashboard/stats?from_date=${from}&to_date=${to}`, { headers }).catch(() => null);
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.status === 'success') setStats(statsData.data);
      }

      // Fetch leads (full list for client-side filtering)
      const leadsRes = await fetch(`${apiUrl}/api/leads/?limit=500`, { headers }).catch(() => null);
      if (leadsRes && leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (leadsData.status === 'success') setLeads(leadsData.leads);
      }

      // Fetch unread notifications count
      const notifRes = await fetch(`${apiUrl}/api/dashboard/notifications`, { headers }).catch(() => null);
      if (notifRes && notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.status === 'success') {
          const unread = notifData.notifications.filter(n => !n.read).length;
          setUnreadNotifCount(unread);
        }
      }
    } catch (e) {
      console.warn('API connection failed.', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeView !== 'course-management') {
      fetchData(); // defaults to today
      // Auto-poll every 30 seconds
      const interval = setInterval(() => fetchData(), 30000);
      return () => clearInterval(interval);
    }
  }, [apiUrl, token, activeView]);

  // View Router
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview data={stats} onRefresh={fetchData} setActiveView={changeView} apiUrl={apiUrl} token={token} leads={leads} adminProfile={adminProfile} user={user} />;
      case 'leads':
        return <LeadsView leads={leads} onRefresh={fetchData} loading={loading} apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'course-leads':
        return <LeadsView leads={leads.filter(l => l.source === 'course')} onRefresh={fetchData} loading={loading} apiUrl={apiUrl} token={token} categoryTitle="Course Leads" adminProfile={adminProfile} user={user} />;
      case 'course-management':
        return <CourseManagementView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'results-management':
        return <ResultsManagementView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'workshop-leads':
        return <LeadsView leads={leads.filter(l => l.source === 'workshop')} onRefresh={fetchData} loading={loading} apiUrl={apiUrl} token={token} categoryTitle="Workshop Leads" adminProfile={adminProfile} user={user} />;
      case 'contact-requests':
        return <ContactsView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'resume-uploads':
        return <LeadsView leads={leads.filter(l => l.resume || l.source === 'resume_upload' || l.source === 'contact_with_resume')} onRefresh={fetchData} loading={loading} apiUrl={apiUrl} token={token} categoryTitle="Resume Uploads" adminProfile={adminProfile} user={user} />;
      case 'enrolled-users':
        return <LeadsView leads={leads.filter(l => l.status === 'Enrolled')} onRefresh={fetchData} loading={loading} apiUrl={apiUrl} token={token} categoryTitle="Enrolled Users" adminProfile={adminProfile} user={user} />;
      case 'workshops':
        return <WorkshopsView apiUrl={apiUrl} token={token} onRefresh={fetchData} adminProfile={adminProfile} user={user} />;
      case 'contacts':
        return <ContactsView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'users':
        return <UsersView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'tasks':
        return <TasksView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'reports':
        return <ReportsView apiUrl={apiUrl} token={token} leads={leads} adminProfile={adminProfile} user={user} />;
      case 'activities':
        return <ActivitiesView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'notifications':
        return <NotificationsView apiUrl={apiUrl} token={token} onNotifUpdate={fetchData} adminProfile={adminProfile} user={user} />;
      case 'certificates':
        return <CertificateManagementView apiUrl={apiUrl} token={token} adminProfile={adminProfile} user={user} />;
      case 'settings':
        return (
          <SettingsView 
            apiUrl={apiUrl} 
            token={token}
            onProfileUpdate={(updatedProfile, newToken) => {
              setAdminProfile(updatedProfile);
              if (newToken) {
                localStorage.setItem('token', newToken);
                setToken(newToken);
              }
            }}
          />
        );
      case 'logout':
        return (
          <div className="p-8 text-center space-y-4 max-w-sm mx-auto mt-20">
            <h3 className="text-xl font-bold text-gray-900">Signed Out</h3>
            <p className="text-xs text-gray-500">You have logged out from your secure session.</p>
            <button 
              onClick={handleLogout}
              className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full text-xs font-semibold mt-4 cursor-pointer"
            >
              Confirm Sign Out
            </button>
          </div>
        );
      default:
        return <DashboardOverview data={stats} onRefresh={fetchData} setActiveView={changeView} apiUrl={apiUrl} token={token} leads={leads} />;
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e] p-6 relative overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#7c3aed]/15 to-[#4f46e5]/10 filter blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#06b6d4]/10 to-[#3b82f6]/15 filter blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '10s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#12131a]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-[0_20px_50px_-12px_rgba(124,58,237,0.15)] relative text-left z-10">
          <div className="flex flex-col items-center mb-8">
            <img 
              src={logo} 
              alt="Levlox Logo" 
              className="h-12 object-contain mb-2" 
            />
            <p className="text-xs text-gray-400 mt-1">Access secure admin crm terminal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl">
                {loginError}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-[#181922]/80 border border-white/10 focus:border-[#7c3aed]/50 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-[#7c3aed]/10"
                placeholder="admin@levlox.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full bg-[#181922]/80 border border-white/10 focus:border-[#7c3aed]/50 text-white rounded-xl pl-4 pr-11 py-3 text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-[#7c3aed]/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-white to-gray-100 hover:from-white hover:to-white text-black font-bold py-3.5 px-4 rounded-xl text-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-white/10 mt-4 border border-white/10"
            >
              {loading ? 'Authenticating...' : 'Sign In To CRM'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#FAFBFD] min-h-screen text-[#0d0d0f] relative overflow-x-hidden">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-45 bg-black/30 backdrop-blur-xs lg:hidden transition-all duration-300"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={changeView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Panel */}
      <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-[280px]'}`}>
        {/* Navbar */}
        <Navbar 
          viewTitle={activeView} 
          unreadCount={unreadNotifCount} 
          onNotifClick={() => changeView('notifications')} 
          onMenuToggle={() => setIsSidebarOpen(prev => !prev)}
          onChangeView={changeView}
          adminProfile={adminProfile}
          apiUrl={apiUrl}
        />

        {/* View Content */}
        <main className="flex-grow overflow-y-auto pb-12">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
