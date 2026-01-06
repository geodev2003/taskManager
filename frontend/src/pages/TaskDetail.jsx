import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from '../components/UserMenu';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [task, setTask] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      loadTask();
      loadAudits();
    } else {
      setError('Task ID không hợp lệ');
      setLoading(false);
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks('', 1, 1000);

      const tasksData = response.data || response;
      const tasksList = tasksData.tasks || [];
      const foundTask = tasksList.find(t => t.tId === parseInt(id));

      if (!foundTask) {
        setError('Task không tồn tại');
        return;
      }

      setTask(foundTask);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('Không thể tải task');
    } finally {
      setLoading(false);
    }
  };

  const loadAudits = async () => {
    try {
      const taskId = parseInt(id);
      if (isNaN(taskId) || taskId <= 0) {
        setAudits([]);
        return;
      }

      const response = await taskService.getTaskAudits(taskId);
      const auditsData = response.data || response;
      setAudits(Array.isArray(auditsData) ? auditsData : []);
    } catch (err) {
      console.error('Error loading audits:', err);
      setAudits([]);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa task này?')) return;

    // Optimistic Navigation
    navigate('/tasks');

    try {
      await taskService.deleteTask(id);
    } catch (err) {
      // If failed, user is already on list page.
      // Ideally we would revert navigation, but showing an alert is sufficient here.
      // Alternatively, we could wait for this one since navigating back to a deleted page is weird.
      // BUT for "async interface", immediate navigation is best.
      console.error('Delete failed:', err);
      alert('Lỗi khi xóa task: ' + (err.response?.data?.message || err.message));
      // Optionally navigate back or reload, but list view will handle missing task gracefully
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statusConfig = {
    todo: {
      bg: 'bg-gradient-to-r from-gray-100 to-gray-200',
      text: 'text-gray-800',
      border: 'border-gray-300',
      icon: '📋'
    },
    in_progress: {
      bg: 'bg-gradient-to-r from-blue-100 to-blue-200',
      text: 'text-blue-800',
      border: 'border-blue-300',
      icon: '⚡'
    },
    done: {
      bg: 'bg-gradient-to-r from-green-100 to-green-200',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: '✅'
    },
  };

  const formatDisplayDateTime = (dateStr) => {
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
          <p className="mt-4 text-gray-600 font-medium">Đang tải task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="glass rounded-2xl shadow-2xl p-8 text-center max-w-md animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy task</h3>
          <p className="text-gray-600 mb-6">{error || 'Task không tồn tại'}</p>
          <button
            onClick={() => navigate('/tasks')}
            className="px-6 py-3 gradient-primary text-white rounded-xl hover:shadow-glow-lg transition-all duration-300 font-semibold"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[task.tStatus] || statusConfig.todo;

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
                  Chi tiết Task
                </h1>
              </div>
            </div>
            <div className="lg:hidden">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {/* Task Header Card */}
          <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 break-words">
                  {task.tName}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${status.bg} ${status.text} border ${status.border}`}>
                    <span>{status.icon}</span>
                    <span>{task.tStatus === 'in_progress' ? 'In Progress' : task.tStatus}</span>
                  </span>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-lg">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-semibold text-indigo-700">v{task.tVersion}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => navigate(`/tasks/${id}/edit`)}
                  className="flex-1 sm:flex-none px-5 py-2.5 gradient-primary text-white rounded-xl hover:shadow-glow-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Sửa</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Xóa</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200/50 pt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${activeTab === 'details'
                    ? 'gradient-primary text-white shadow-glow'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Chi tiết</span>
                  <span className="sm:hidden">Chi tiết</span>
                </button>
                <button
                  onClick={() => setActiveTab('audits')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${activeTab === 'audits'
                    ? 'gradient-primary text-white shadow-glow'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M12 16h.01" />
                  </svg>
                  Lịch sử thay đổi
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 animate-slide-up">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Content Section */}
                <div className="bg-white/60 rounded-2xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Nội dung
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {task.tContent || <span className="text-gray-400 italic">Chưa có nội dung</span>}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-2xl p-6 border border-gray-200/50">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Trạng thái</h3>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${status.bg} ${status.text} border ${status.border}`}>
                      <span>{status.icon}</span>
                      <span className="font-bold">{task.tStatus === 'in_progress' ? 'In Progress' : task.tStatus}</span>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-2xl p-6 border border-gray-200/50">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Version</h3>
                    <div className="flex flex-col">
                      <p className="text-2xl font-extrabold text-indigo-600">v{task.tVersion}</p>
                      {audits.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          Cập nhật: {new Date(audits[0].taCreateAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DateTime Grid */}
                {(task.tRimderAt || task.tDateExpire) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {task.tRimderAt && (
                      <div className="bg-white/60 rounded-2xl p-6 border border-gray-200/50">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Nhắc nhở
                        </h3>
                        <p className="text-gray-900 font-semibold">{formatDisplayDateTime(task.tRimderAt)}</p>
                      </div>
                    )}
                    {task.tDateExpire && (
                      <div className="bg-white/60 rounded-2xl p-6 border border-gray-200/50">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Hạn chót
                        </h3>
                        <p className="text-gray-900 font-semibold">{formatDisplayDateTime(task.tDateExpire)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audits' && (
              <div className="space-y-8 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-500 to-pink-500"></div>

                {audits.length === 0 ? (
                  <div className="text-center py-16 bg-white/60 rounded-2xl border border-gray-200/50">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có lịch sử thay đổi</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Mọi thay đổi của task sẽ được ghi lại ở đây
                    </p>
                  </div>
                ) : (
                  audits.map((audit, index) => {
                    const beforeData = audit.taBeforeData ? JSON.parse(audit.taBeforeData) : null;
                    const afterData = audit.taAfterData ? JSON.parse(audit.taAfterData) : null;
                    const action = audit.taAction;
                    const date = new Date(audit.taCreateAt);

                    const actionConfig = {
                      CREATE: {
                        bgGradient: 'from-green-50 to-emerald-50',
                        borderColor: 'border-green-400',
                        dotColor: 'bg-green-500',
                        dotRing: 'ring-green-200',
                        badgeColor: 'bg-green-500',
                        textColor: 'text-green-700',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ),
                        label: 'Tạo mới'
                      },
                      UPDATE: {
                        bgGradient: 'from-blue-50 to-cyan-50',
                        borderColor: 'border-blue-400',
                        dotColor: 'bg-blue-500',
                        dotRing: 'ring-blue-200',
                        badgeColor: 'bg-blue-500',
                        textColor: 'text-blue-700',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        ),
                        label: 'Cập nhật'
                      },
                      DELETE: {
                        bgGradient: 'from-red-50 to-rose-50',
                        borderColor: 'border-red-400',
                        dotColor: 'bg-red-500',
                        dotRing: 'ring-red-200',
                        badgeColor: 'bg-red-500',
                        textColor: 'text-red-700',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        ),
                        label: 'Xóa'
                      },
                      RESTORE: {
                        bgGradient: 'from-yellow-50 to-amber-50',
                        borderColor: 'border-yellow-400',
                        dotColor: 'bg-yellow-500',
                        dotRing: 'ring-yellow-200',
                        badgeColor: 'bg-yellow-500',
                        textColor: 'text-yellow-700',
                        icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ),
                        label: 'Khôi phục'
                      },
                    };

                    const config = actionConfig[action] || actionConfig.UPDATE;

                    const formatFieldName = (key) => {
                      const map = {
                        tName: 'Tên task',
                        tStatus: 'Trạng thái',
                        tContent: 'Nội dung',
                        tRimderAt: 'Nhắc nhở',
                        tDateExpire: 'Hạn chót',
                        tVersion: 'Version',
                      };
                      return map[key] || key;
                    };

                    const formatValue = (value, key) => {
                      if (value === null || value === undefined || value === '') return '(trống)';
                      if (key === 'tStatus') {
                        const statusMap = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
                        return statusMap[value] || value;
                      }
                      if (key === 'tRimderAt' || key === 'tDateExpire') {
                        return formatDisplayDateTime(value);
                      }
                      if (key === 'tVersion') {
                        return `v${value}`;
                      }
                      return String(value);
                    };

                    return (
                      <div key={index} className="relative pl-12">
                        <div className={`absolute left-2 top-2 w-4 h-4 ${config.dotColor} rounded-full ring-4 ${config.dotRing} ring-offset-2 z-10`}></div>

                        <div className={`bg-gradient-to-br ${config.bgGradient} border-l-4 ${config.borderColor} rounded-2xl shadow-lg p-6 backdrop-blur-sm`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 ${config.badgeColor} rounded-xl text-white shadow-md`}>
                                {config.icon}
                              </div>
                              <div>
                                <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg ${config.badgeColor} text-white shadow-sm`}>
                                  {config.label}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {date.toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          {action === 'CREATE' && afterData && (
                            <div className="bg-white/60 rounded-xl p-4 border border-green-200/50">
                              <p className="text-sm font-bold text-gray-700 mb-3">Task được tạo:</p>
                              <div className="space-y-2">
                                {Object.keys(afterData).filter(k => k !== 'tVersion' && k !== 'tId').map((key) => (
                                  <div key={key} className="flex justify-between py-1 border-b border-green-100 last:border-b-0">
                                    <span className="text-sm font-medium text-green-700">{formatFieldName(key)}:</span>
                                    <span className="text-sm text-green-900">{formatValue(afterData[key], key)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {action === 'UPDATE' && beforeData && afterData && (
                            <div className="space-y-3">
                              {Object.keys(afterData).map((key) => {
                                const beforeVal = formatValue(beforeData[key], key);
                                const afterVal = formatValue(afterData[key], key);

                                if (beforeVal === afterVal || key === 'tId') return null;

                                return (
                                  <div key={key} className="bg-white/60 rounded-xl p-4 border border-gray-200/50">
                                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                                      {formatFieldName(key)}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                                      <div className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-medium text-red-700">
                                        {beforeVal}
                                      </div>
                                      <div className="flex items-center justify-center">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                      </div>
                                      <div className="text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-semibold text-green-700">
                                        {afterVal}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
