import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { taskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from '../components/UserMenu';
import ViewSwitcher from '../components/ViewSwitcher';

/**
 * Component hiển thị một task item có thể kéo thả (sortable)
 * Sử dụng @dnd-kit để hỗ trợ drag and drop
 */
const SortableTaskItem = ({ task, onClick }) => {
    // Cấu hình màu viền trái theo trạng thái
    const statusConfig = {
        todo: { border: 'border-l-4 border-gray-400', bg: 'bg-white' },
        in_progress: { border: 'border-l-4 border-blue-500', bg: 'bg-white' },
        done: { border: 'border-l-4 border-green-500', bg: 'bg-white' },
    };

    // Hook từ @dnd-kit để làm cho item có thể kéo thả
    const {
        attributes,      // HTML attributes cho accessibility
        listeners,      // Event listeners cho drag
        setNodeRef,     // Ref để attach vào DOM element
        transform,      // Transform khi đang kéo
        transition,     // Transition animation
        isDragging      // Flag cho biết đang kéo hay không
    } = useSortable({ id: task.tId, data: { task } });

    // Style động khi kéo thả
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1, // Giảm opacity khi đang kéo
    };

    const config = statusConfig[task.tStatus] || statusConfig.todo;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`${config.bg} p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-move mb-3 ${config.border} group`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-800 line-clamp-2 group-hover:text-indigo-600 transition-colors text-sm">{task.tName}</h4>
            </div>

            {task.tContent && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.tContent}</p>
            )}

            <div className="flex justify-between items-center text-xs text-gray-400">
                <span className="bg-gray-100 px-2 py-1 rounded-md font-mono text-[10px] text-gray-600">v{task.tVersion}</span>
                {task.tDateExpire && (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(task.tDateExpire).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * Component hiển thị một cột có thể thả task vào (droppable)
 * Mỗi cột đại diện cho một trạng thái: todo, in_progress, done
 */
const DroppableColumn = ({ id, title, count, bg, border, headerObj, children }) => {
    // Hook từ @dnd-kit để làm cho cột có thể nhận task được thả vào
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 flex flex-col min-w-[180px] sm:min-w-[220px] ${bg} rounded-xl sm:rounded-2xl border ${border} shadow-sm backdrop-blur-sm`}
        >
            {/* Column Header */}
            <div className="p-2 sm:p-4 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${headerObj.bg} ${headerObj.text} text-xs sm:text-sm`}>
                        {headerObj.icon}
                    </span>
                    <h3 className="font-bold text-gray-700 text-sm sm:text-base truncate">{title}</h3>
                </div>
                <span className="bg-white/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs font-bold text-gray-500 shadow-sm flex-shrink-0">
                    {count}
                </span>
            </div>

            {children}
        </div>
    );
};

const KanbanBoard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    // State quản lý tasks và drag state
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDragTask, setActiveDragTask] = useState(null); // Task đang được kéo

    // Cấu hình sensors cho drag and drop
    // - PointerSensor: Kéo bằng chuột/touch (cần di chuyển 5px mới bắt đầu kéo)
    // - KeyboardSensor: Kéo bằng bàn phím (accessibility)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Load tasks khi component mount
    useEffect(() => {
        loadTasks();
    }, []);

    /**
     * Load danh sách tasks từ API
     * Load tất cả tasks (limit 1000) để hiển thị trên Kanban
     */
    const loadTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getTasks('', 1, 1000);
            const tasksData = response.data || response;
            setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Xử lý khi bắt đầu kéo task
     * Lưu task đang được kéo để hiển thị trong DragOverlay
     */
    const handleDragStart = (event) => {
        const { active } = event;
        const task = tasks.find(t => t.tId === active.id);
        setActiveDragTask(task);
    };

    /**
     * Xử lý khi kết thúc kéo thả task
     * - Xác định trạng thái mới dựa vào vị trí thả
     * - Cập nhật trạng thái task (Optimistic Update)
     * - Gọi API update task
     * - Revert nếu lỗi
     */
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragTask(null);

        if (!over) return; // Không thả vào đâu cả

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find((t) => t.tId === activeId);
        if (!activeTask) return;

        // Xác định trạng thái mới
        let newStatus = activeTask.tStatus;

        // Nếu thả vào một cột (todo, in_progress, done)
        if (['todo', 'in_progress', 'done'].includes(overId)) {
            newStatus = overId;
        } else {
            // Nếu thả vào một task khác, lấy trạng thái của task đó
            const overTask = tasks.find((t) => t.tId === overId);
            if (overTask) {
                newStatus = overTask.tStatus;
            }
        }

        // Chỉ update nếu trạng thái thay đổi
        if (activeTask.tStatus !== newStatus) {
            const oldStatus = activeTask.tStatus;
            const oldVersion = activeTask.tVersion;

            // Optimistic Update: Cập nhật UI ngay lập tức
            setTasks((prevTasks) =>
                prevTasks.map((t) =>
                    t.tId === activeId ? { ...t, tStatus: newStatus, tVersion: t.tVersion + 1 } : t
                )
            );

            try {
                // Gọi API update task với đầy đủ thông tin (bao gồm tDateExpire để không bị mất)
                await taskService.updateTask(activeId, {
                    tName: activeTask.tName,
                    tStatus: newStatus,
                    tContent: activeTask.tContent,
                    tRimderAt: activeTask.tRimderAt,
                    tDateExpire: activeTask.tDateExpire,
                    version: oldVersion,
                }, oldVersion);
            } catch (error) {
                console.error("Failed to update task status:", error);
                // Revert lại state cũ nếu lỗi
                setTasks((prevTasks) =>
                    prevTasks.map((t) =>
                        t.tId === activeId ? { ...t, tStatus: oldStatus, tVersion: oldVersion } : t
                    )
                );
                alert("Cập nhật trạng thái thất bại. Vui lòng thử lại.");
            }
        }
    };

    /**
     * Lọc tasks theo trạng thái
     */
    const getTasksByStatus = (status) => {
        return tasks.filter(t => t.tStatus === status);
    };

    const columns = [
        { id: 'todo', title: 'To Do', bg: 'bg-gray-50/50', border: 'border-gray-200', headerObj: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📋' } },
        { id: 'in_progress', title: 'In Progress', bg: 'bg-blue-50/50', border: 'border-blue-200', headerObj: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⚡' } },
        { id: 'done', title: 'Done', bg: 'bg-green-50/50', border: 'border-green-200', headerObj: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' } }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
            <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ViewSwitcher />
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Kanban Board
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 pl-3 border-l border-gray-200">
                            <UserMenu user={user} onLogout={logout} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto p-2 sm:p-4 md:p-6 lg:p-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full min-w-[600px] sm:min-w-[800px] gap-3 sm:gap-4 md:gap-6 max-w-7xl mx-auto">
                        {columns.map(col => {
                            const colTasks = getTasksByStatus(col.id);
                            return (
                                <DroppableColumn
                                    key={col.id}
                                    id={col.id}
                                    title={col.title}
                                    count={colTasks.length}
                                    bg={col.bg}
                                    border={col.border}
                                    headerObj={col.headerObj}
                                >
                                    <SortableContext
                                        id={col.id}
                                        items={colTasks.map(t => t.tId)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="flex-1 p-2 sm:p-3 overflow-y-auto custom-scrollbar">
                                            {colTasks.map(task => (
                                                <SortableTaskItem
                                                    key={task.tId}
                                                    task={task}
                                                    onClick={() => navigate(`/tasks/${task.tId}`)}
                                                />
                                            ))}
                                            {colTasks.length === 0 && (
                                                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200/50 rounded-xl m-2 pointer-events-none">
                                                    Kéo thả task vào đây
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>
                                </DroppableColumn>
                            );
                        })}
                    </div>

                    <DragOverlay>
                        {activeDragTask ? (
                            <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                                <div className="bg-white p-4 rounded-xl shadow-xl border-l-4 border-indigo-500 w-[280px]">
                                    <h4 className="font-bold text-gray-800 text-sm mb-2">{activeDragTask.tName}</h4>
                                    <div className="h-2 w-20 bg-gray-100 rounded-full"></div>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};

export default KanbanBoard;
