import React from 'react';
import logo from '../assets/levlox-logo-light.png';
import { 
  Home, 
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
  FileText,
  CheckSquare,
  BarChart3,
  Bell,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
  Award,
  Trophy
} from 'lucide-react';

const Sidebar = ({ activeView, onViewChange, isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'course-leads', label: 'Course Leads', icon: BookOpen },
    { id: 'course-management', label: 'Manage Courses', icon: GraduationCap },
    { id: 'results-management', label: 'Manage Results', icon: Trophy },
    { id: 'workshop-leads', label: 'Workshop Leads', icon: Calendar },
    { id: 'contact-requests', label: 'Contact Requests', icon: MessageSquare },
    { id: 'resume-uploads', label: 'Resume Uploads', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0d0d0f] text-white flex flex-col justify-between border-r border-[#1a1a1f]/30 select-none transition-all duration-300 ${
      isOpen 
        ? 'translate-x-0 w-[280px]' 
        : '-translate-x-full lg:translate-x-0 ' + (isCollapsed ? 'lg:w-20' : 'lg:w-[280px]')
    } shrink-0 h-screen`}>
      
      {/* Brand / Logo */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-[#1a1a1f]/10 shrink-0">
        <div className={`flex items-center transition-all duration-300 ${isCollapsed && !isOpen ? 'lg:justify-center w-full' : 'gap-3'}`}>
          {isCollapsed && !isOpen ? (
            <div className="w-8 h-8 overflow-hidden flex items-center justify-start shrink-0">
              <img 
                src={logo} 
                alt="Levlox Logo" 
                className="h-8 max-w-none" 
                style={{ width: 'auto', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <img 
              src={logo} 
              alt="Levlox Logo" 
              className="h-8 object-contain" 
            />
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Collapse / Expand Toggle Button (Desktop Only) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute right-[-14px] top-24 w-7 h-7 bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full items-center justify-center cursor-pointer shadow-md z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-grow flex flex-col gap-0.5 py-4 overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (onClose) onClose();
              }}
              title={isCollapsed && !isOpen ? item.label : undefined}
              className={`w-full flex items-center px-6 py-3.5 text-left relative transition-all duration-200 cursor-pointer ${
                isActive ? 'text-white font-semibold bg-white/5' : 'text-[#7e7f86] hover:text-white hover:bg-white/3'
              } ${isCollapsed && !isOpen ? 'lg:justify-center lg:px-0' : ''}`}
            >
              <div className="flex items-center gap-4">
                <Icon size={18} className={isActive ? 'text-white' : 'text-[#7e7f86]'} />
                <span className={`text-[14px] transition-opacity duration-300 ${
                  isCollapsed && !isOpen ? 'lg:hidden' : 'opacity-100'
                }`}>
                  {item.label}
                </span>
              </div>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[4px] h-6 bg-white rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout */}
      <div className="py-4 border-t border-[#1a1a1f]/20 shrink-0">
        <button
          onClick={() => {
            onViewChange('logout');
            if (onClose) onClose();
          }}
          title={isCollapsed && !isOpen ? 'Logout' : undefined}
          className={`w-full flex items-center px-6 py-3.5 text-left text-[#7e7f86] hover:text-[#f87171] transition-all duration-200 cursor-pointer ${
            isCollapsed && !isOpen ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            <LogOut size={18} />
            <span className={`text-[14px] transition-opacity duration-300 ${
              isCollapsed && !isOpen ? 'lg:hidden' : 'opacity-100'
            }`}>
              Logout
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
