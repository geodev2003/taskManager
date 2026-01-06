import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskService } from '../services/taskService';
import VersionConflictDialog from '../components/VersionConflictDialog';

const TaskForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    tName: '',
    tContent: '',
    tStatus: 'todo',
    tRimderAt: '',
    tDateExpire: '',
  });
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictDialog, setConflictDialog] = useState({
    isOpen: false,
    currentData: null,
    newData: null,
  });

  useEffect(() => {
    if (isEdit) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks('', 1, 1000);
      
      const tasksData = response.data || response;
      const tasksList = tasksData.tasks || [];
      const task = tasksList.find(t => t.tId === parseInt(id));
      
      if (!task) {
        setError('Task không tồn tại');
        return;
      }
      
      const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setFormData({
        tName: task.tName || '',
        tContent: task.tContent || '',
        tStatus: task.tStatus || 'todo',
        tRimderAt: formatDateTime(task.tRimderAt),
        tDateExpire: formatDateTime(task.tDateExpire),
      });
      
      const taskVersion = parseInt(task.tVersion) || 1;
      if (taskVersion <= 0) {
        setError('Version không hợp lệ');
        return;
      }
      setVersion(taskVersion);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('Không thể tải task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        if (!version || version <= 0) {
          setError('Version không hợp lệ. Vui lòng reload trang và thử lại.');
          setLoading(false);
          return;
        }
        
        if (!formData.tName || !formData.tName.trim()) {
          setError('Tên task không được để trống');
          setLoading(false);
          return;
        }
        
        await taskService.updateTask(id, formData, version);
      } else {
        if (!formData.tName || !formData.tName.trim()) {
          setError('Tên task không được để trống');
          setLoading(false);
          return;
        }
        await taskService.createTask(formData);
      }
      navigate('/tasks');
    } catch (err) {
      console.error('Submit error:', err);
      if (err.response?.status === 409) {
        const currentData = { ...formData, tVersion: version };
        const response = await taskService.getTasks('', 1, 1000);
        const tasksData = response.data || response;
        const tasksList = tasksData.tasks || [];
        const newTask = tasksList.find(t => t.tId === parseInt(id));
        
        setConflictDialog({
          isOpen: true,
          currentData,
          newData: newTask,
        });
      } else if (err.response?.data?.code === 'NO_CHANGES') {
        setError('Không có thay đổi nào để lưu.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi lưu task';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    setConflictDialog({ isOpen: false, currentData: null, newData: null });
    await loadTask();
  };

  const handleCloseConflict = () => {
    setConflictDialog({ isOpen: false, currentData: null, newData: null });
    navigate('/tasks');
  };

  if (loading && isEdit) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto animate-scale-in">
        <div className="glass rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/tasks')}
              className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent break-words">
                {isEdit ? 'Sửa Task' : 'Tạo Task Mới'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {isEdit ? `Version: ${version}` : 'Điền thông tin để tạo task mới'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 animate-slide-up">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="tName" className="block text-sm font-bold text-gray-700 mb-2">
                Tên task <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tName"
                name="tName"
                value={formData.tName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm font-medium"
                placeholder="Nhập tên task..."
              />
            </div>

            <div>
              <label htmlFor="tContent" className="block text-sm font-bold text-gray-700 mb-2">
                Nội dung
              </label>
              <textarea
                id="tContent"
                name="tContent"
                value={formData.tContent}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm font-medium resize-none"
                placeholder="Mô tả chi tiết về task..."
              />
            </div>

            {isEdit && (
              <div>
                <label htmlFor="tStatus" className="block text-sm font-bold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  id="tStatus"
                  name="tStatus"
                  value={formData.tStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
                >
                  <option value="todo">📋 To Do</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="done">✅ Done</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tRimderAt" className="block text-sm font-bold text-gray-700 mb-2">
                  Nhắc nhở
                </label>
                <input
                  type="datetime-local"
                  id="tRimderAt"
                  name="tRimderAt"
                  value={formData.tRimderAt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
                />
              </div>
              <div>
                <label htmlFor="tDateExpire" className="block text-sm font-bold text-gray-700 mb-2">
                  Hạn chót
                </label>
                <input
                  type="datetime-local"
                  id="tDateExpire"
                  name="tDateExpire"
                  value={formData.tDateExpire}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="flex-1 px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 font-semibold text-gray-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 gradient-primary text-white rounded-xl hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Lưu Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <VersionConflictDialog
        isOpen={conflictDialog.isOpen}
        onClose={handleCloseConflict}
        onReload={handleReload}
        currentData={conflictDialog.currentData}
        newData={conflictDialog.newData}
      />
    </div>
  );
};

export default TaskForm;
