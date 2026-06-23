import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, Edit2, X, Shield, Mail } from 'lucide-react';

const UsersView = ({ apiUrl, token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user',
    password: ''
  });

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/users`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Communication error connecting to backend users service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [apiUrl, token]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({ id: '', name: '', email: '', role: 'user', password: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setFormMode('edit');
    setFormData({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      password: '' // Keep empty to not update unless filled
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = formMode === 'add' 
        ? `${apiUrl}/api/auth/users` 
        : `${apiUrl}/api/auth/users/${formData.id}`;
      const method = formMode === 'add' ? 'POST' : 'PUT';

      const body = { ...formData };
      if (formMode === 'edit' && !body.password) {
        delete body.password; // Don't send empty password to backend
      }

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Error occurred while saving user details.');
      }
    } catch (err) {
      alert('Network communication error.');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this CRM user account?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">User Management</h3>
          <p className="text-xs text-gray-500">Configure CRM access privileges and administration accounts.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 active:scale-95 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
        >
          <Plus size={14} /> Create User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-3 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Security Role</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/20 transition-all duration-150">
                    <td className="py-4 px-6 font-bold text-gray-900">{user.name}</td>
                    <td className="py-4 px-6 text-gray-500 flex items-center gap-1.5 mt-1">
                      <Mail size={12} className="text-gray-400" />
                      {user.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-max ${
                        user.role === 'admin' 
                          ? 'bg-black text-white border border-black/10' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        <Shield size={10} />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-gray-600 transition-all cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-1.5 border border-red-50 hover:bg-red-50 hover:border-red-200 text-red-500 rounded-lg transition-all cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-400">
                    No administrators or users registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-extrabold text-gray-900 text-lg">
                {formMode === 'add' ? 'Create User Account' : 'Edit CRM User'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">User Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="e.g. John Manager"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="john@levlox.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Access Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 cursor-pointer font-medium"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (System Overlord)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Password {formMode === 'edit' && '(Leave blank to retain current)'}
                </label>
                <input
                  type="password"
                  required={formMode === 'add'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                Save User Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;
