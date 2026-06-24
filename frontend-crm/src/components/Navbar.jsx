import React, { useState } from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';
import logo from '../assets/levlox-logo-dark.png';

const Navbar = ({ viewTitle, unreadCount = 0, onNotifClick, onMenuToggle, onChangeView, adminProfile, apiUrl }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Title & Hamburger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-700 cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{viewTitle?.replace('-', ' ')}</h2>
          <p className="text-xs text-gray-500">Levlox Tech CRM admin panel</p>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative w-64 max-md:hidden">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search leads, tasks..." 
            className="w-full bg-gray-50 border border-gray-100 rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onNotifClick}
            className="p-2.5 rounded-full hover:bg-gray-50 transition-all relative text-gray-600 cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 max-md:hidden"></div>

        {/* Profile Card / Dropdown */}
        <div className="relative">
          <div 
            onClick={() => onChangeView('settings')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="text-right max-md:hidden">
              <span className="block text-xs font-semibold text-gray-900 leading-none group-hover:underline">
                {adminProfile?.name || 'Sri Aakash'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {adminProfile?.role || 'Super Admin'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-zinc-950 border border-zinc-200 flex items-center justify-center text-white font-semibold text-xs overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-black transition-all">
              {adminProfile?.profileImage ? (
                <img 
                  src={`${apiUrl}${adminProfile.profileImage}`} 
                  alt="Admin Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{adminProfile?.name ? adminProfile.name.charAt(0) : 'A'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
