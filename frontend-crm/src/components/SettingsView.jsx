import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Shield, User, Mail, Phone, 
  Briefcase, Building, MapPin, AlignLeft, 
  Upload, Trash2, Key, Info, CheckCircle 
} from 'lucide-react';

const SettingsView = ({ apiUrl, token, onProfileUpdate }) => {
  const [urlInput, setUrlInput] = useState(apiUrl);
  
  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: 'admin@levlox.com',
    phone: '',
    role: '',
    company: '',
    location: '',
    bio: '',
    profileImage: '',
    accountStatus: 'Active',
    lastLogin: ''
  });

  const [initialProfile, setInitialProfile] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI state
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'system'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [apiUrl]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProfile(data.profile);
        setInitialProfile(data.profile);
        if (onProfileUpdate) {
          onProfileUpdate(data.profile);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Connection to profile server failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('crm_api_url', urlInput);
    window.location.reload();
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }

    // Validate extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      showToast('Only jpg, jpeg, png, and webp images are allowed', 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadPhoto = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    setSubmitting(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiUrl}/api/admin/upload-profile`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setSubmitting(false);
      setUploadProgress(null);
      
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.status === 'success') {
          setProfile(data.profile);
          setInitialProfile(data.profile);
          if (onProfileUpdate) onProfileUpdate(data.profile);
          showToast('Profile photo updated successfully!');
          setSelectedFile(null);
          setPreviewUrl(null);
        } else {
          showToast(data.message || 'Upload failed', 'error');
        }
      } catch (e) {
        showToast('Invalid response from server', 'error');
      }
    };

    xhr.onerror = () => {
      setSubmitting(false);
      setUploadProgress(null);
      showToast('Error uploading file to server', 'error');
    };

    xhr.send(formData);
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(null);
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile-image`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProfile(data.profile);
        setInitialProfile(data.profile);
        if (onProfileUpdate) onProfileUpdate(data.profile);
        showToast('Profile image removed.');
      }
    } catch (err) {
      showToast('Error deleting photo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      showToast('Full Name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProfile(data.profile);
        setInitialProfile(data.profile);
        if (onProfileUpdate) onProfileUpdate(data.profile);
        showToast('Admin Profile updated successfully!');
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Error updating profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: profile.email,
          password: passwordForm.newPassword
        })
      });
      if (res.ok) {
        showToast('Security credentials / password updated.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast('Failed to update credentials', 'error');
      }
    } catch (e) {
      showToast('Error updating password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setProfile(initialProfile);
    showToast('Changes discarded.');
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const fields = ['name', 'phone', 'role', 'company', 'location', 'bio', 'profileImage'];
    const filledFields = fields.filter(f => profile[f] && String(profile[f]).trim() !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const completionPercent = calculateCompletion();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl z-50 flex items-center gap-2 border transition-all duration-300 animate-slide ${
          toast.type === 'error' 
            ? 'bg-red-50 text-red-600 border-red-100' 
            : 'bg-black text-white border-zinc-850'
        }`}>
          {toast.type !== 'error' && <CheckCircle size={14} className="text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Account Settings</h3>
          <p className="text-xs text-gray-500">Configure profile settings, administrative details, credentials, and endpoints.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            Admin Profile
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'system' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            System & Endpoints
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-xs font-bold tracking-widest uppercase">
          Loading credentials...
        </div>
      ) : activeTab === 'profile' ? (
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          
          {/* PROFILE LEFT SIDEBAR (Completion + Avatar) */}
          <div className="space-y-6">
            
            {/* Avatar & Basic Info */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full bg-zinc-950 border border-gray-100 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profile.profileImage ? (
                    <img 
                      src={`${apiUrl}${profile.profileImage}`} 
                      alt="Admin Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile.name ? profile.name.charAt(0) : 'A'}</span>
                  )}
                </div>

                {!previewUrl && (
                  <label className="absolute bottom-1 right-1 bg-black text-white hover:bg-zinc-800 p-2 rounded-full cursor-pointer shadow-md transition-all border border-zinc-800">
                    <Upload size={14} />
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Uploading Progress Block */}
              {uploadProgress !== null && (
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-black h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Confirm / Action Buttons for Preview State */}
              {previewUrl && uploadProgress === null && (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleCancelPreview}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUploadPhoto}
                    className="flex-1 bg-black text-white hover:bg-zinc-800 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Upload Image
                  </button>
                </div>
              )}

              <div>
                <h4 className="font-extrabold text-gray-900 text-base">{profile.name || 'Admin Sri Aakash'}</h4>
                <p className="text-[10px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mt-1.5 inline-block">
                  {profile.role || 'Super Admin'}
                </p>
              </div>

              {!previewUrl && profile.profileImage && (
                <button 
                  onClick={handleDeletePhoto}
                  className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full"
                >
                  <Trash2 size={12} /> Remove Photo
                </button>
              )}
            </div>

            {/* Profile Completion percentage */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500 uppercase tracking-wider">Profile Setup</span>
                <span className="font-bold text-black">{completionPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-black h-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400">Fill in all biography and professional details to reach 100% completion.</p>
            </div>

            {/* Metadata Info (Login info) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Administrative Info</h5>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Status</span>
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {profile.accountStatus || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Login</span>
                  <span className="font-semibold text-gray-700">{profile.lastLogin || 'Just now'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* PROFILE RIGHT FORM (Profile Forms + Security Credentials) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Edit details form */}
            <form onSubmit={handleProfileSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3 text-gray-900 font-extrabold text-sm">
                <User size={16} />
                <span>Admin Profile Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      name="name"
                      required
                      value={profile.name}
                      onChange={handleProfileChange}
                      placeholder="Sri Aakash"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email"
                      name="email"
                      disabled
                      value={profile.email}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-400 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Designation / Role</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      name="role"
                      value={profile.role}
                      onChange={handleProfileChange}
                      placeholder="Super Admin"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company Name</label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleProfileChange}
                      placeholder="Levlox Tech"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      name="location"
                      value={profile.location}
                      onChange={handleProfileChange}
                      placeholder="Bangalore, India"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Biography / About Me</label>
                <div className="relative">
                  <AlignLeft size={14} className="absolute left-3.5 top-3 text-gray-400" />
                  <textarea 
                    name="bio"
                    value={profile.bio}
                    onChange={handleProfileChange}
                    placeholder="Short description of your job description and permissions..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={handleReset}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="bg-black text-white hover:bg-zinc-800 px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>

            {/* Change Password form */}
            <form onSubmit={handlePasswordSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3 text-gray-900 font-extrabold text-sm">
                <Key size={16} />
                <span>Security Credentials</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                  <input 
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-zinc-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-50">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="bg-black text-white hover:bg-zinc-800 px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm animate-fade-in"
                >
                  Update Credentials
                </button>
              </div>
            </form>

          </div>

        </div>

      ) : (
        
        <form onSubmit={handleSystemSubmit} className="glass-card p-6 bg-white border border-gray-100 rounded-3xl space-y-6 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <Server size={18} />
              <span>Backend Integration</span>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                API Base URL
              </label>
              <input 
                type="url" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="e.g. http://127.0.0.1:5000"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                required
              />
              <p className="text-[10px] text-gray-400">
                The endpoint address of your running Flask backend. If offline, the client uses fallback mock data.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Shield size={14} />
              <span>Connection Active</span>
            </div>
            <button 
              type="submit"
              className="flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 transition-all px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Save size={14} /> Save Configuration
            </button>
          </div>
        </form>

      )}

    </div>
  );
};

export default SettingsView;
