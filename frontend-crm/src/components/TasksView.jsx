import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  X,
  Edit2
} from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import { exportToExcel, exportToCsv, exportToPdfTable } from '../utils/exportHelpers';

const TasksView = ({ apiUrl, token, adminProfile, user }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    deadline: '',
    status: 'Pending'
  });

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/tasks/`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTasks(data.tasks);
      } else {
        setError(data.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError('Error communicating with backend tasks server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [apiUrl, token]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({
      id: '',
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      deadline: '',
      status: 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setFormMode('edit');
    setFormData({
      id: task._id,
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate || '',
      deadline: task.deadline || '',
      status: task.status || 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = formMode === 'add' 
        ? `${apiUrl}/api/tasks/` 
        : `${apiUrl}/api/tasks/${formData.id}`;
      const method = formMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchTasks();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save task');
      }
    } catch (err) {
      alert('Error updating task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      alert('Communication error deleting task');
    }
  };

  const handleToggleCompleted = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await fetch(`${apiUrl}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Compute Task Widget Stats
  const handleExportCSV = async () => {
    const headers = ['Title', 'Description', 'Assigned To', 'Due Date', 'Deadline', 'Status'];
    const rows = tasks.map(t => [
      t.title || '',
      t.description || '',
      t.assignedTo || '',
      t.dueDate || '',
      t.deadline || '',
      t.status || ''
    ]);
    exportToCsv(headers, rows, 'tasks_export');
  };

  const handleExportExcel = async () => {
    const data = tasks.map(t => ({
      'Title': t.title || '',
      'Description': t.description || '',
      'Assigned To': t.assignedTo || '',
      'Due Date': t.dueDate || '',
      'Deadline': t.deadline || '',
      'Status': t.status || ''
    }));
    exportToExcel(data, 'Tasks', 'tasks_export');
  };

  const handleExportPDF = async () => {
    const headers = ['Title', 'Assigned To', 'Due Date', 'Deadline', 'Status'];
    const rows = tasks.map(t => [
      t.title || '',
      t.assignedTo || '',
      t.dueDate || '',
      t.deadline || '',
      t.status || ''
    ]);
    exportToPdfTable({
      title: 'CRM Task Report',
      subtitle: `Total Tasks: ${tasks.length}`,
      headers,
      rows,
      fileName: 'tasks_export'
    });
  };

  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const activeTasks = tasks.filter(t => t.status === 'In Progress');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < todayStr);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">CRM Task List</h3>
          <p className="text-xs text-gray-500">Track milestones, deadlines, and assign tasks to administrators.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={handleExportCSV}
            onExcel={handleExportExcel}
            onPdf={handleExportPDF}
            fileNamePrefix="tasks_export"
          />
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 active:scale-95 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
          >
            <Plus size={14} /> Add New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-3 px-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Task Dashboard Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div className="text-left">
            <span className="block text-xl font-black text-gray-900 leading-none">{pendingTasks.length}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">Pending Tasks</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock size={18} className="animate-pulse" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-black text-gray-900 leading-none">{activeTasks.length}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">Active Tasks</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
          <div className="text-left">
            <span className="block text-xl font-black text-gray-900 leading-none">{completedTasks.length}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">Completed Tasks</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
          <div className="text-left">
            <span className="block text-xl font-black text-gray-900 leading-none">{overdueTasks.length}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block text-rose-500 font-extrabold">Overdue Tasks</span>
          </div>
        </div>
      </div>

      {/* Task List Container */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden divide-y divide-gray-100 shadow-sm">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className="flex items-center justify-between p-6 hover:bg-gray-50/30 transition-all duration-150">
              <div className="flex items-start gap-4 text-left">
                <button 
                  onClick={() => handleToggleCompleted(task)}
                  className="text-gray-300 hover:text-black transition-all mt-1 cursor-pointer"
                >
                  {task.status === 'Completed' ? (
                    <CheckSquare className="text-black" size={19} />
                  ) : (
                    <Square size={19} />
                  )}
                </button>
                <div className="space-y-1">
                  <p className={`text-sm font-bold leading-tight ${task.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      Assigned to: {task.assignedTo || 'Unassigned'}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Due: {task.dueDate}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-red-400">
                        <Calendar size={11} />
                        Deadline: {task.deadline}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full uppercase tracking-wider text-[8px] border ${
                      task.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                      task.status === 'In Progress' ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-gray-50 border-gray-100 text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenEdit(task)}
                  className="text-gray-400 hover:text-gray-800 transition-all p-2 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer"
                  title="Edit Task"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  onClick={() => handleDelete(task._id)}
                  className="text-gray-400 hover:text-red-500 transition-all p-2 rounded-xl border border-red-50 hover:bg-red-50 cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-gray-400 text-xs">
            No operational tasks registered. Create a new task checklist.
          </div>
        )}
      </div>

      {/* Task Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-extrabold text-gray-900 text-lg">
                {formMode === 'add' ? 'Create Task Checklist' : 'Edit CRM Task'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="Follow up with Jane Contact..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 h-20 resize-none"
                  placeholder="Task specifications..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned To (Admin Email / Name)</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10"
                  placeholder="admin@levlox.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Deadline Date</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Task Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-black/10 cursor-pointer font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
