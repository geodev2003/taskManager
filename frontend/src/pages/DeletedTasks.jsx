import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const DeletedTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [restoring, setRestoring] = useState(null);

  // Load tasks đã xóa
  const loadDeletedTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await taskService.getMyDeletedTasks(search, page, limit);
      const data = response.data || response;
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error loading deleted tasks:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách task đã xóa');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedTasks();
  }, [page, search]);

  // Xử lý khôi phục task
  const handleRestore = async (taskId) => {
    if (!window.confirm('Bạn có chắc muốn khôi phục task này?')) {
      return;
    }

    try {
      setRestoring(taskId);
      await taskService.restoreTask(taskId);
      // Reload danh sách sau khi khôi phục
      await loadDeletedTasks();
      alert('Khôi phục task thành công!');
    } catch (err) {
      console.error('Error restoring task:', err);
      alert(err.response?.data?.message || 'Không thể khôi phục task');
    } finally {
      setRestoring(null);
    }
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format trạng thái
  const getStatusLabel = (status) => {
    const labels = {
      todo: 'Chưa làm',
      in_progress: 'Đang làm',
      done: 'Hoàn thành',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Task đã xóa
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Khôi phục các task đã bị xóa</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Quay lại danh sách
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset về trang 1 khi search
              }}
              placeholder="Tìm kiếm task đã xóa..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

        {/* Loading */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Task List */}
            {tasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Không có task nào đã xóa
                </h3>
                <p className="text-gray-500">
                  {search ? 'Không tìm thấy task nào với từ khóa này' : 'Bạn chưa xóa task nào'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.tId}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 break-words">{task.tName}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                              task.tStatus
                            )}`}
                          >
                            {getStatusLabel(task.tStatus)}
                          </span>
                        </div>

                        {task.tContent && (
                          <p className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-2 break-words">{task.tContent}</p>
                        )}

                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          {task.tDateExpire && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="break-words">Hết hạn: {formatDate(task.tDateExpire)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="break-words">Đã xóa: {formatDate(task.tDeleteAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:ml-4">
                        <button
                          onClick={() => handleRestore(task.tId)}
                          disabled={restoring === task.tId}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          {restoring === task.tId ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Đang khôi phục...</span>
                              <span className="sm:hidden">Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              <span>Khôi phục</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  Trước
                </button>
                <span className="px-2 sm:px-4 py-2 text-gray-700 text-sm sm:text-base text-center">
                  Trang {page} / {totalPages} <span className="hidden sm:inline">({total} task)</span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeletedTasks;

