import React, { useState, useEffect } from 'react';
import { Clock, Activity, RefreshCw } from 'lucide-react';

const ActivitiesView = ({ apiUrl, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchActivities = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/dashboard/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setActivities(data.activities);
      } else {
        setError(data.message || 'Failed to fetch activity logs');
      }
    } catch (err) {
      setError('Communication error connecting to backend activities logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [apiUrl, token]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">System Activity Logs</h3>
          <p className="text-xs text-gray-500">Audit trail logs tracking conversions, user operations, and updates.</p>
        </div>
        <button 
          onClick={fetchActivities}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 text-gray-700 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold bg-white shadow-sm cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Sync Logs
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-3 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div className="relative pl-6 space-y-6 border-l border-gray-100 ml-3 py-2 text-left">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act._id} className="relative space-y-1">
                {/* Timeline circle indicator */}
                <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-gray-100" />
                <div className="flex justify-between items-start gap-4">
                  <p className="text-xs font-bold text-gray-800 leading-relaxed">
                    {act.activity}
                  </p>
                  <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 shrink-0 mt-0.5">
                    <Clock size={10} />
                    {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-gray-400 py-10 pl-0 -ml-6">
              No recent audit trail entries logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesView;
