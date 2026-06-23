import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, RefreshCw } from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import { exportToExcel, exportToCsv, exportToPdfTable } from '../utils/exportHelpers';

const NotificationsView = ({ apiUrl, token, onNotifUpdate, adminProfile, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/dashboard/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setNotifications(data.notifications);
        if (onNotifUpdate) onNotifUpdate();
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Communication error connecting to backend notifications list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [apiUrl, token]);

  const handleMarkAsRead = async (notifId) => {
    try {
      const res = await fetch(`${apiUrl}/api/dashboard/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = async () => {
    if (notifications.length === 0) {
      throw new Error('No notifications to export');
    }
    const exportData = notifications.map(n => ({
      Type: n.type || 'N/A',
      Message: n.message || '',
      Status: n.read ? 'Read' : 'Unread',
      'Created At': n.createdAt ? new Date(n.createdAt).toLocaleString() : 'N/A'
    }));
    exportToExcel(exportData, 'Notifications', 'Levlox_Notifications');
  };

  const handleExportCsv = async () => {
    if (notifications.length === 0) {
      throw new Error('No notifications to export');
    }
    const headers = ['Type', 'Message', 'Status', 'Created At'];
    const rows = notifications.map(n => [
      n.type || 'N/A',
      n.message || '',
      n.read ? 'Read' : 'Unread',
      n.createdAt ? new Date(n.createdAt).toLocaleString() : 'N/A'
    ]);
    exportToCsv(headers, rows, 'Levlox_Notifications');
  };

  const handleExportPdfTable = async () => {
    if (notifications.length === 0) {
      throw new Error('No notifications to export');
    }
    const headers = ['Type', 'Message', 'Status', 'Created At'];
    const rows = notifications.map(n => [
      n.type || 'N/A',
      n.message || '',
      n.read ? 'Read' : 'Unread',
      n.createdAt ? new Date(n.createdAt).toLocaleString() : 'N/A'
    ]);
    exportToPdfTable({
      title: 'Notifications Report',
      subtitle: `Total: ${notifications.length}`,
      headers,
      rows,
      fileName: 'Levlox_Notifications'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Notifications Centre</h3>
          <p className="text-xs text-gray-500">Track and respond to incoming leads, uploads, and tasks deadlines.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={handleExportCsv}
            onExcel={handleExportExcel}
            onPdf={handleExportPdfTable}
            fileNamePrefix="Levlox_Notifications"
          />
          <button 
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 text-gray-700 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold bg-white shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Sync Inbox
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-3 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Notifications Inbox List */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden divide-y divide-gray-100 shadow-sm text-left">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`flex items-start justify-between p-6 transition-all duration-150 ${
                notif.read ? 'bg-white opacity-70' : 'bg-gray-50/20 font-semibold border-l-2 border-black'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.read ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'
                }`}>
                  <Bell size={14} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{notif.type}</span>
                  <p className="text-xs text-gray-800 leading-normal">{notif.message}</p>
                  <span className="text-[9px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="flex items-center gap-1 border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Check size={11} />
                  Dismiss
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-xs text-gray-400 py-16">
            Your notifications tray is empty.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
