import React, { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Trash2, Video, Trophy, Building, User, Briefcase, DollarSign, Calendar, Pencil } from 'lucide-react';
import CRMFilterBar from './CRMFilterBar';
import { LoadingState, EmptyState, getFilterFriendlyLabel } from './CRMStateTemplates';

const ResultsManagementView = ({ apiUrl, token, adminProfile, user }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ filter: 'month', fromUTC: '', to_date: '' });

  // Form states
  const [form, setForm] = useState({
    name: '',
    company: '',
    role: '',
    lpa: '',
    batch: "Batch '26",
    logoColor: '#6b21e8',
    image: '',
    videoUrl: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [videoSourceType, setVideoSourceType] = useState('upload'); // 'upload' | 'url'
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchResults = useCallback(async (range = dateFilter) => {
    setLoading(true);
    try {
      let url = `${apiUrl}/api/results`;
      if (range.filter) {
        url += `?filter=${range.filter}&from_date=${encodeURIComponent(range.fromUTC)}&to_date=${encodeURIComponent(range.to_date)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
      }
    } catch (e) {
      console.error('Error fetching results:', e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const handleFilterChange = useCallback((range) => {
    const newRange = { filter: range.filter, fromUTC: range.from_date, to_date: range.to_date };
    setDateFilter(newRange);
    fetchResults(newRange);
  }, [fetchResults]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setForm({
      name: '',
      company: '',
      role: '',
      lpa: '',
      batch: "Batch '26",
      logoColor: '#6b21e8',
      image: '',
      videoUrl: ''
    });
    setSelectedFile(null);
    setSelectedVideoFile(null);
    setVideoSourceType('upload');
    setShowModal(true);
  };

  const handleEditClick = (story) => {
    setIsEditMode(true);
    setEditingId(story._id);
    setForm({
      name: story.name,
      company: story.company,
      role: story.role,
      lpa: story.lpa,
      batch: story.batch || "Batch '26",
      logoColor: story.logoColor || '#6b21e8',
      image: story.image || '',
      videoUrl: story.videoUrl || ''
    });
    setSelectedFile(null);
    setSelectedVideoFile(null);

    // Determine video source type based on existing URL
    if (story.videoUrl && (story.videoUrl.startsWith('/api') || story.videoUrl.includes('/uploads/courses/'))) {
      setVideoSourceType('upload');
    } else if (story.videoUrl) {
      setVideoSourceType('url');
    } else {
      setVideoSourceType('upload');
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = form.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
      let finalVideoUrl = form.videoUrl;

      // Upload thumbnail file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.status === 'success') {
          imageUrl = `${apiUrl}${uploadData.file_url}`;
        } else {
          alert('Thumbnail upload failed. Using fallback.');
        }
      }

      // Upload video file if selected and in upload mode
      if (videoSourceType === 'upload' && selectedVideoFile) {
        const formData = new FormData();
        formData.append('file', selectedVideoFile);
        const uploadRes = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.status === 'success') {
          finalVideoUrl = `${apiUrl}${uploadData.file_url}`;
        } else {
          alert('Video upload failed.');
          setSubmitting(false);
          return;
        }
      }

      const requestUrl = isEditMode 
        ? `${apiUrl}/api/results/${editingId}` 
        : `${apiUrl}/api/results`;
      const requestMethod = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, image: imageUrl, videoUrl: finalVideoUrl })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(isEditMode ? 'Success story updated successfully!' : 'Success story added successfully!');
        fetchResults();
        setShowModal(false);
        setForm({
          name: '',
          company: '',
          role: '',
          lpa: '',
          batch: "Batch '26",
          logoColor: '#6b21e8',
          image: '',
          videoUrl: ''
        });
        setSelectedFile(null);
        setSelectedVideoFile(null);
        setVideoSourceType('upload');
        setIsEditMode(false);
        setEditingId(null);
      } else {
        alert(data.message || (isEditMode ? 'Failed to update success story.' : 'Failed to add success story.'));
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this success story?')) return;

    try {
      const res = await fetch(`${apiUrl}/api/results/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Success story deleted.');
        fetchResults();
      } else {
        alert('Failed to delete.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* View Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-6 text-left">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Student Success Stories</h3>
          <p className="text-xs text-gray-500">Manage student placement results, CTC packages, target companies, and testimonials shown in the User Panel.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-black text-white hover:bg-zinc-800 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
        >
          <Plus size={14} /> Add Success Story
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <CRMFilterBar onChange={handleFilterChange} />
      </div>

      {loading ? (
        <LoadingState message="Syncing success database..." />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {results.map((story) => (
            <div key={story._id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                    {story.batch}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(story)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Edit success story"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(story._id)}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete success story"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 items-center mt-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-150 shrink-0">
                    <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm uppercase">{story.name}</h4>
                    <p className="text-xs text-gray-500 font-semibold">{story.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black" style={{ color: story.logoColor }}>
                        {story.company}
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black">
                        {story.lpa}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {story.videoUrl && (
                <div className="pt-3 border-t border-gray-50 flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                  <Video size={14} />
                  <a href={story.videoUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    Watch Story Video
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No student success stories found" 
          subtitle={`No student success stories found for ${getFilterFriendlyLabel(dateFilter.filter)}.`}
        />
      )}

      {/* ADD / EDIT STORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left border border-gray-100">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">
              {isEditMode ? 'Edit Success Story' : 'Add New Success Story'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Student Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    placeholder="e.g. Sri Aakash"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Company</label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none"
                      placeholder="e.g. Google"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Package</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={form.lpa}
                      onChange={(e) => setForm({ ...form, lpa: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none"
                      placeholder="e.g. ₹18 LPA"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Role</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Batch</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.batch}
                      onChange={(e) => setForm({ ...form, batch: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none"
                      placeholder="e.g. Batch '26"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Logo Color Code</label>
                  <input
                    type="color"
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="w-full h-9 p-0.5 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {isEditMode ? 'Change Photo Thumbnail' : 'Photo Thumbnail'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-[10px] text-gray-500 w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Video Story</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoSourceType('upload');
                        setForm(f => ({ ...f, videoUrl: '' }));
                      }}
                      className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${videoSourceType === 'upload' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoSourceType('url');
                        setSelectedVideoFile(null);
                      }}
                      className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${videoSourceType === 'url' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Paste Link
                    </button>
                  </div>
                </div>

                {videoSourceType === 'upload' ? (
                  <div className="relative border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Video size={14} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-500 truncate max-w-[200px]">
                        {selectedVideoFile ? selectedVideoFile.name : (isEditMode && form.videoUrl ? 'Keep current video' : 'No video file chosen')}
                      </span>
                    </div>
                    <label className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm shrink-0">
                      Choose Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setSelectedVideoFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <Video size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                      placeholder="e.g. https://youtube.com/..."
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {submitting 
                  ? (isEditMode ? 'Updating Success Story...' : 'Adding Success Story...') 
                  : (isEditMode ? 'Update Success Story' : 'Add Success Story')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsManagementView;
