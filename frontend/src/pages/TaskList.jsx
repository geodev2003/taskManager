import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ViewSwitcher from "../components/ViewSwitcher";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import UserMenu from "../components/UserMenu";

const TaskList = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  
  // State quản lý danh sách tasks
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State cho tìm kiếm và phân trang
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Số lượng task mỗi trang
  const [total, setTotal] = useState(0);
  
  // State cho filter theo trạng thái
  const [statusFilter, setStatusFilter] = useState("all");

  // Tự động load lại tasks khi page, search hoặc statusFilter thay đổi
  useEffect(() => {
    loadTasks();
  }, [page, search, statusFilter]);

  /**
   * Hàm load danh sách tasks từ API
   * - Gọi API với search, page, limit
   * - Filter theo status nếu có
   * - Xử lý lỗi và cập nhật state
   */
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await taskService.getTasks(search, page, limit);

      // Xử lý response từ API
      const tasksData = response.data || response;
      const tasksList = Array.isArray(tasksData.tasks) ? tasksData.tasks : [];
      const totalCount = tasksData.total || 0;

      // Filter theo status nếu không phải "all"
      let filteredTasks = tasksList;
      if (statusFilter !== "all") {
        filteredTasks = tasksList.filter((t) => t.tStatus === statusFilter);
      }

      setTasks(filteredTasks);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error loading tasks:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Lỗi khi tải danh sách task";
      setError(errorMessage);
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hàm xóa task với Optimistic Update
   * - Hiển thị confirm dialog
   * - Cập nhật UI ngay lập tức (optimistic)
   * - Gọi API xóa task
   * - Nếu lỗi thì revert lại UI
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa task này?")) return;

    // Lưu state hiện tại để revert nếu lỗi
    const previousTasks = [...tasks];
    const previousTotal = total;

    // Optimistic Update: Cập nhật UI ngay lập tức
    setTasks(prev => prev.filter(t => t.tId !== id));
    setTotal(prev => prev - 1);

    try {
      await taskService.deleteTask(id);
      // Thành công: UI đã được cập nhật, không cần làm gì thêm
    } catch (err) {
      // Lỗi: Revert lại state cũ
      setTasks(previousTasks);
      setTotal(previousTotal);
      alert(err.response?.data?.message || "Lỗi khi xóa task");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  /**
   * Cấu hình màu sắc và icon cho từng trạng thái task
   * - todo: Màu xám
   * - in_progress: Màu xanh dương
   * - done: Màu xanh lá
   */
  const statusConfig = {
    todo: {
      bg: "bg-gradient-to-r from-gray-100 to-gray-200",
      text: "text-gray-800",
      border: "border-gray-300",
      icon: "📋",
    },
    in_progress: {
      bg: "bg-gradient-to-r from-blue-100 to-blue-200",
      text: "text-blue-800",
      border: "border-blue-300",
      icon: "⚡",
    },
    done: {
      bg: "bg-gradient-to-r from-green-100 to-green-200",
      text: "text-green-800",
      border: "border-green-300",
      icon: "✅",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Modern Header with Glassmorphism */}
      <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo và Tiêu đề */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Task Manager
                </h1>
              </div>
            </div>

            {/* Phần thông tin người dùng luôn hiển thị */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Nút Admin nhanh (nếu là admin) */}
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="hidden md:flex px-4 py-2 gradient-secondary text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>Admin</span>
                </button>
              )}

              {/* UserMenu Component - Bây giờ sẽ đóng vai trò là điểm nhấn chính */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-gray-800 leading-none">
                    {user?.uName}
                  </p>
                  <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mt-1">
                    {user?.uRole}
                  </p>
                </div>
                <UserMenu user={user} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Search and Filters */}
        <div className="mb-8 animate-fade-in">
          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Input tìm kiếm task theo tên */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // Reset về trang 1 khi search
                  }}
                  placeholder="Tìm kiếm task..."
                  className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {/* Dropdown filter theo trạng thái */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all cursor-pointer font-medium text-gray-600 hover:bg-white text-sm sm:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <ViewSwitcher />

                <button
                  onClick={() => navigate("/tasks/deleted")}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base"
                  title="Xem task đã xóa"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">Đã xóa</span>
                  <span className="sm:hidden">Xóa</span>
                </button>

                <button
                  onClick={() => navigate("/tasks/new")}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 gradient-primary text-white rounded-xl hover:shadow-glow-lg transition-all duration-300 font-semibold whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Tạo Task</span>
                  <span className="sm:hidden">Tạo mới</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 animate-slide-up">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Đang tải tasks...</p>
          </div>
        ) : (
          <>
            {/* Hiển thị danh sách tasks */}
            {tasks.length === 0 ? (
              // Empty state: Chưa có task nào
              <div className="text-center py-20 glass rounded-2xl shadow-xl animate-scale-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Chưa có task nào
                </h3>
                <p className="text-gray-500 mb-6">
                  Bắt đầu tạo task đầu tiên của bạn
                </p>
                <button
                  onClick={() => navigate("/tasks/new")}
                  className="px-6 py-3 gradient-primary text-white rounded-xl hover:shadow-glow-lg transition-all duration-300 font-semibold inline-flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Tạo task đầu tiên
                </button>
              </div>
            ) : (
              // Grid hiển thị danh sách tasks dạng card
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                {tasks.map((task, index) => {
                  // Lấy config màu sắc theo trạng thái
                  const status =
                    statusConfig[task.tStatus] || statusConfig.todo;
                  return (
                    <div
                      key={task.tId}
                      className="glass rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => navigate(`/tasks/${task.tId}`)}
                    >
                      {/* Header: Tên task và trạng thái */}
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {task.tName}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${status.bg} ${status.text} border ${status.border} whitespace-nowrap`}
                        >
                          <span>{status.icon}</span>
                          <span>
                            {task.tStatus === "in_progress"
                              ? "In Progress"
                              : task.tStatus}
                          </span>
                        </span>
                      </div>

                      {/* Preview nội dung task (nếu có) */}
                      {task.tContent && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {task.tContent}
                        </p>
                      )}

                      {/* Footer: Thông tin ngày tạo, hạn chót, version và actions */}
                      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">

                        {/* Thông tin ngày tạo và hạn chót */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5" title="Ngày tạo">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>{new Date(task.tCreateAt).toLocaleDateString()}</span>
                          </div>
                          {task.tDateExpire && (
                            <div className="flex items-center gap-1.5 text-red-600 font-medium" title="Hạn chót">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span>{new Date(task.tDateExpire).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>

                        {/* Version và action buttons */}
                        <div className="flex justify-between items-center">
                          {/* Hiển thị version (Optimistic Concurrency Control) */}
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-indigo-600">
                                v{task.tVersion}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">Version</span>
                          </div>
                          {/* Buttons: Sửa và Xóa */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Ngăn click event bubble lên card
                                navigate(`/tasks/${task.tId}/edit`);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Sửa task"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Ngăn click event bubble lên card
                                handleDelete(task.tId);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Xóa task"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
            }

            {/* Phân trang: Chỉ hiển thị khi có nhiều hơn 1 trang */}
            {total > limit && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 animate-fade-in">
                {/* Nút "Trước" */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Trước
                  </span>
                </button>
                {/* Hiển thị số trang hiện tại / tổng số trang */}
                <div className="px-4 sm:px-6 py-2 bg-white/80 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm sm:text-base text-gray-700 font-semibold">
                    Trang <span className="text-indigo-600">{page}</span> /{" "}
                    {Math.ceil(total / limit)}
                    <span className="hidden sm:inline"> ({total} tasks)</span>
                  </span>
                </div>
                {/* Nút "Sau" */}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  <span className="flex items-center justify-center gap-2">
                    Sau
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskList;
