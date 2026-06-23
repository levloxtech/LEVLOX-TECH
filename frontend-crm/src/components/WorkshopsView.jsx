import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Plus, X, RefreshCw } from 'lucide-react';

const WorkshopsView = ({ apiUrl, token, onRefresh }) => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    location: 'Online Zoom'
  });

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchWorkshops = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/workshops/`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setWorkshops(data.workshops);
      } else {
        setError(data.message || 'Failed to fetch workshops');
      }
    } catch (err) {
      setError('Communication error connecting to backend workshops server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, [apiUrl]);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      date: '',
      description: '',
      location: 'Online Zoom'
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/workshops/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchWorkshops();
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to create workshop');
      }
    } catch (err) {
      alert('Error communicating with backend');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Workshops Directory</h3>
          <p className="text-xs text-gray-500">Coordinate scheduled tech events, track registrations and sync details.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchWorkshops} 
            disabled={loading}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 text-gray-700 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold bg-white shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Sync
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
          >
            <Plus size={14} /> Schedule Workshop
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-3 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Workshop Cards Grid */}
      {workshops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workshops.map((workshop) => (
            <div key={workshop._id} className="glass-card p-6 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-black text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Upcoming
                  </span>
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {workshop.date}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{workshop.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{workshop.description}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {workshop.location || 'Online Zoom'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-gray-900">
                  <Users size={12} />
                  {workshop.registrations || 0} registered
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400 text-xs bg-white border border-gray-100 rounded-3xl">
          No scheduled tech events or workshops found. Click "Schedule Workshop" to create one.
        </div>
      )}

      {/* Workshop Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-extrabold text-gray-900 text-lg">
                Schedule Workshop Event
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Workshop Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="e.g. React Basics for Beginners"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 h-20 resize-none"
                  placeholder="Kickstart your web development path..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="e.g. Online Zoom or Office Room 2"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {submitting ? 'Scheduling...' : 'Schedule Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopsView;
