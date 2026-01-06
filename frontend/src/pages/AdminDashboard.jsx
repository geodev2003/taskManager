import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    tasksByStatus: {
      todo: 0,
      in_progress: 0,
      done: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [deletedSearch, setDeletedSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/tasks');
      return;
    }
    loadStats();
    loadDeletedTasks();
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      const timeoutId = setTimeout(() => {
        loadDeletedTasks();
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [deletedSearch]);

  useEffect(() => {
    if (isAdmin) {
      loadDeletedTasks();
    }
  }, [deletedPage]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const loadDeletedTasks = async () => {
    try {
      setDeletedLoading(true);
      const response = await taskService.getSoftDeletedTasks(deletedSearch, deletedPage, 10);
      const tasksData = response.data || response;
      setDeletedTasks(tasksData.tasks || []);
      setDeletedTotal(tasksData.total || 0);
    } catch (err) {
      console.error('Error loading deleted tasks:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Bạn có chắc muốn khôi phục task này?')) return;
    
    try {
      await taskService.restoreTask(id);
      loadDeletedTasks();
      loadStats(); // Refresh stats
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi khôi phục task');
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn task này? Hành động này không thể hoàn tác!')) return;
    
    try {
      await taskService.hardDeleteTask(id);
      loadDeletedTasks();
      loadStats(); // Refresh stats
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa vĩnh viễn task');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await taskService.getTasks('', 1, 1000);
      const tasksData = response.data || response;
      const allTasks = tasksData.tasks || [];
      
      const tasksByStatus = allTasks.reduce((acc, task) => {
        acc[task.tStatus] = (acc[task.tStatus] || 0) + 1;
        return acc;
      }, { todo: 0, in_progress: 0, done: 0 });

      setStats({
        totalTasks: allTasks.length,
        tasksByStatus: {
          todo: tasksByStatus.todo || 0,
          in_progress: tasksByStatus.in_progress || 0,
          done: tasksByStatus.done || 0,
        },
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng số Task',
      value: stats.totalTasks,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'To Do',
      value: stats.tasksByStatus.todo,
      icon: '📋',
      gradient: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
    {
      title: 'In Progress',
      value: stats.tasksByStatus.in_progress,
      icon: '⚡',
      gradient: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Done',
      value: stats.tasksByStatus.done,
      icon: '✅',
      gradient: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/tasks')}
                className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200 flex-shrink-0"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Quản lý và thống kê hệ thống</p>
              </div>
            </div>
            <div className="lg:hidden">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/tasks')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 font-medium text-sm"
              >
                Quay lại Tasks
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 font-medium text-sm"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 animate-slide-up">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="glass rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  {typeof stat.icon === 'string' ? (
                    <span className="text-2xl">{stat.icon}</span>
                  ) : (
                    stat.icon
                  )}
                </div>
                <button
                  onClick={loadStats}
                  className="p-2 hover:bg-white/60 rounded-lg transition-all"
                  title="Làm mới"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{stat.title}</h3>
              <p className={`text-4xl font-extrabold ${stat.textColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Quick Actions */}
          <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Thao tác nhanh
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/tasks')}
                className="w-full px-6 py-4 bg-white/60 hover:bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800">Xem tất cả Tasks</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/tasks/new')}
                className="w-full px-6 py-4 gradient-primary text-white rounded-xl hover:shadow-glow-lg transition-all duration-300 flex items-center justify-between font-semibold"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tạo Task mới</span>
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              Thông tin hệ thống
            </h2>
            <div className="space-y-4">
              <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Tổng số Task</span>
                  <span className="text-lg font-bold text-indigo-600">{stats.totalTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalTasks > 0 ? 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50 text-center">
                  <div className="text-2xl font-extrabold text-gray-700">{stats.tasksByStatus.todo}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">To Do</div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50 text-center">
                  <div className="text-2xl font-extrabold text-blue-600">{stats.tasksByStatus.in_progress}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">In Progress</div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50 text-center">
                  <div className="text-2xl font-extrabold text-green-600">{stats.tasksByStatus.done}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">Done</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Soft Deleted Tasks Section */}
        <div className="mt-8 glass rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              Tasks đã xóa ({deletedTotal})
            </h2>
            <button
              onClick={loadDeletedTasks}
              className="p-2 hover:bg-white/60 rounded-xl transition-all"
              title="Làm mới"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={deletedSearch}
                onChange={(e) => {
                  setDeletedSearch(e.target.value);
                  setDeletedPage(1);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadDeletedTasks();
                  }
                }}
                placeholder="Tìm kiếm task đã xóa..."
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Deleted Tasks List */}
          {deletedLoading ? (
            <div className="text-center py-12">
              <div className="inline-block relative">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : deletedTasks.length === 0 ? (
            <div className="text-center py-12 bg-white/60 rounded-2xl border border-gray-200/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Không có task nào đã bị xóa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedTasks.map((task) => (
                <div
                  key={task.tId}
                  className="bg-white/60 rounded-2xl p-6 border border-red-200/50 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{task.tName}</h3>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                          Đã xóa
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{task.uName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Xóa: {formatDateTime(task.tDeleteAt)}</span>
                        </div>
                      </div>
                      {task.tContent && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.tContent}</p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleRestore(task.tId)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Khôi phục
                      </button>
                      <button
                        onClick={() => handleHardDelete(task.tId)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {deletedTotal > 10 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setDeletedPage(p => Math.max(1, p - 1));
                    }}
                    disabled={deletedPage === 1}
                    className="px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-200 font-medium"
                    onMouseUp={() => loadDeletedTasks()}
                  >
                    Trước
                  </button>
                  <div className="px-6 py-2 bg-white/80 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-gray-700 font-semibold">
                      Trang <span className="text-red-600">{deletedPage}</span> / {Math.ceil(deletedTotal / 10)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setDeletedPage(p => p + 1);
                    }}
                    disabled={deletedPage >= Math.ceil(deletedTotal / 10)}
                    className="px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-200 font-medium"
                    onMouseUp={() => loadDeletedTasks()}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Note */}
        <div className="mt-8 glass rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Quyền Admin</h3>
              <p className="text-gray-600 leading-relaxed">
                Với quyền admin, bạn có thể xem tất cả tasks của tất cả users trong hệ thống. 
                Bạn có thể khôi phục hoặc xóa vĩnh viễn các tasks đã bị soft delete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
