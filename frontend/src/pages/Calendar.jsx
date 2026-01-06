import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import UserMenu from '../components/UserMenu';
import ViewSwitcher from '../components/ViewSwitcher';

const Calendar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // State quản lý calendar
    const [currentDate, setCurrentDate] = useState(new Date()); // Tháng/năm hiện tại đang xem
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all'); // Filter theo trạng thái: 'all', 'todo', 'in_progress', 'done'

    // State cho modal hiển thị chi tiết
    const [selectedTask, setSelectedTask] = useState(null); // Task được click để xem chi tiết
    const [selectedDateForList, setSelectedDateForList] = useState(null); // Ngày được click để xem danh sách tasks

    // Cấu hình màu sắc cho từng trạng thái
    const statusColors = {
        todo: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
        in_progress: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        done: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    };

    // Load lại tasks khi chuyển tháng
    useEffect(() => {
        loadTasks();
    }, [currentDate]);

    /**
     * Load danh sách tasks từ API
     * Load tất cả tasks (limit 1000) để hiển thị trên calendar
     */
    const loadTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getTasks('', 1, 1000);
            const tasksList = response.data?.tasks || response.tasks || [];
            setTasks(tasksList);
        } catch (error) {
            console.error("Error loading tasks for calendar:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions cho calendar
    /**
     * Lấy số ngày trong tháng
     */
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    /**
     * Lấy ngày trong tuần của ngày đầu tháng (0 = Chủ nhật, 1 = Thứ 2, ...)
     */
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    /**
     * Chuyển sang tháng trước
     */
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    
    /**
     * Chuyển sang tháng sau
     */
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    /**
     * Lọc tasks theo ngày và trạng thái
     * - Chỉ lấy tasks có tDateExpire
     * - So khớp ngày, tháng, năm với ngày được chọn
     * - Filter theo status nếu có
     */
    const getTasksForDate = (day) => {
        return tasks.filter(task => {
            // Filter theo date: Chỉ lấy tasks có tDateExpire
            if (!task.tDateExpire) return false;
            const taskDate = new Date(task.tDateExpire);
            const dateMatch = (
                taskDate.getDate() === day &&
                taskDate.getMonth() === currentDate.getMonth() &&
                taskDate.getFullYear() === currentDate.getFullYear()
            );
            if (!dateMatch) return false;
            
            // Filter theo status (nếu có filter)
            if (statusFilter !== 'all' && task.tStatus !== statusFilter) return false;
            
            return true;
        });
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Handlers
    const handleTaskClick = (e, task) => {
        e.stopPropagation();
        setSelectedTask(task);
    };

    const handleDayClick = (day) => {
        const tasksForDay = getTasksForDate(day);
        if (tasksForDay.length > 0) {
            setSelectedDateForList({
                day,
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
                tasks: tasksForDay
            });
        }
    };

    const closeModal = () => {
        setSelectedTask(null);
        setSelectedDateForList(null);
    };

    /**
     * Render lưới calendar với các ô ngày
     * - Tạo các ô trống cho những ngày trước ngày đầu tháng
     * - Tạo các ô ngày với tasks tương ứng
     * - Highlight ngày hôm nay
     */
    const renderCalendarGrid = () => {
        // Tạo các ô trống cho những ngày trước ngày đầu tháng
        const blanks = [];
        for (let i = 0; i < firstDay; i++) {
            blanks.push(<div key={`blank-${i}`} className="h-32 bg-gray-50/30 border border-white/10 rounded-xl"></div>);
        }

        // Tạo các ô ngày trong tháng
        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dayTasks = getTasksForDate(d); // Lấy tasks cho ngày này
            // Kiểm tra xem có phải ngày hôm nay không
            const isToday =
                d === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

            days.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    className={`min-h-[6rem] sm:min-h-[8rem] p-1.5 sm:p-2 glass rounded-lg sm:rounded-xl border border-white/40 transition-all hover:shadow-lg flex flex-col gap-1 cursor-pointer group ${isToday ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : 'bg-white/40 hover:bg-white/60'}`}
                >
                    {/* Header: Số ngày và số lượng tasks */}
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                            {d}
                        </span>
                        {/* Hiển thị số lượng tasks nếu có */}
                        {dayTasks.length > 0 && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{dayTasks.length}</span>}
                    </div>

                    {/* Danh sách tasks preview (tối đa 3 tasks) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                            <div
                                key={task.tId}
                                onClick={(e) => handleTaskClick(e, task)}
                                className={`p-1.5 rounded-lg text-xs border cursor-pointer truncate font-medium transition-transform hover:-translate-y-0.5 hover:shadow-sm ${statusColors[task.tStatus] || statusColors.todo}`}
                                title={`${task.tName}`}
                            >
                                {task.tName}
                            </div>
                        ))}
                        {/* Hiển thị số tasks còn lại nếu có nhiều hơn 3 */}
                        {dayTasks.length > 3 && (
                            <div className="text-[10px] text-center text-gray-500 font-medium hover:text-indigo-600">
                                +{dayTasks.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return [...blanks, ...days];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Header */}
            <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ViewSwitcher />
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Lịch Công Việc
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 pl-3 border-l border-gray-200">
                            <UserMenu user={user} onLogout={logout} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Calendar Controls */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 capitalize">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1 overflow-x-auto">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    statusFilter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setStatusFilter('todo')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    statusFilter === 'todo'
                                        ? 'bg-gray-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Todo
                            </button>
                            <button
                                onClick={() => setStatusFilter('in_progress')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    statusFilter === 'in_progress'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Đang làm
                            </button>
                            <button
                                onClick={() => setStatusFilter('done')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    statusFilter === 'done'
                                        ? 'bg-green-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Hoàn thành
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors">
                                Hôm nay
                            </button>
                            <button onClick={nextMonth} className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4 text-center">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => (
                        <div key={day} className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${index === 0 || index === 6 ? 'text-indigo-500' : 'text-gray-500'}`}>
                            <span className="hidden sm:inline">{['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][index]}</span>
                            <span className="sm:hidden">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-4 animate-fade-in">
                    {loading ? (
                        <div className="col-span-7 h-96 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        renderCalendarGrid()
                    )}
                </div>

                {/* Task Details Modal */}
                {selectedTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{selectedTask.tName}</h3>
                                    <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block mb-2 ${statusColors[selectedTask.tStatus]}`}>
                                            {selectedTask.tStatus.toUpperCase()}
                                        </span>
                                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedTask.tContent || 'No description provided.'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>Deadline: {new Date(selectedTask.tDateExpire).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={closeModal} className="px-4 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-50">Đóng</button>
                                    <button
                                        onClick={() => navigate(`/tasks/${selectedTask.tId}`)}
                                        className="px-4 py-2 gradient-primary text-white rounded-xl shadow-glow font-medium hover:shadow-glow-lg"
                                    >
                                        Chi tiết & Sửa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Day List Modal */}
                {selectedDateForList && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-800">
                                    Công việc ngày {selectedDateForList.date.toLocaleDateString()}
                                </h3>
                                <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
                                {selectedDateForList.tasks.map(task => (
                                    <div
                                        key={task.tId}
                                        onClick={() => navigate(`/tasks/${task.tId}`)}
                                        className="p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-white group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 group-hover:text-indigo-600">{task.tName}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[task.tStatus]}`}>
                                                {task.tStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {new Date(task.tDateExpire).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;
