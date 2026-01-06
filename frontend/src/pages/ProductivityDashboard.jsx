import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line
} from 'recharts';
import { taskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from '../components/UserMenu';
import ViewSwitcher from '../components/ViewSwitcher';

const ProductivityDashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = {
        todo: '#6366f1',      // Indigo-500
        in_progress: '#3b82f6', // Blue-500
        done: '#22c55e'       // Green-500
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch tasks (large limit to get all data for analytics)
            const response = await taskService.getTasks('', 1, 1000);
            const taskList = response.data?.tasks || response.tasks || [];
            setTasks(taskList);
        } catch (error) {
            console.error("Error loading analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Metrics Calculations ---
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.tStatus === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(t => {
        if (t.tStatus === 'done' || !t.tDateExpire) return false;
        return new Date(t.tDateExpire) < new Date();
    }).length;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const velocity = tasks.filter(t => {
        // Assuming tUpdateAt tracks completion time for done tasks, 
        // OR calculate based on when it was moved to 'done' if we had that history easily accessible.
        // For now, simpler approximation: created in last 7 days AND done? 
        // Or better: just verify tStatus is done. Ideally we need 'completedAt'.
        // Falling back to: count 'done' tasks which were *updated* recently might be a proxy 
        // if we trust tUpdateAt update on status change.
        // Let's use tUpdateAt if available, or just tCreateAt as a fallback for 'velocity of new work' 
        // if strictly velocity = completed recently.
        // Given prompt: "Velocity: Number of tasks completed in the last 7 days."
        // We will stick to (Status == Done) AND (UpdatedAt >= 7 days ago).
        if (t.tStatus !== 'done') return false;
        // Check if tUpdateAt exists, else fallback to tCreateAt (imperfect but better than 0)
        const dateToCheck = t.tUpdateAt ? new Date(t.tUpdateAt) : new Date(t.tCreateAt);
        return dateToCheck >= last7Days;
    }).length;


    // --- Status Dist. Data ---
    const statusData = [
        { name: 'To Do', value: tasks.filter(t => t.tStatus === 'todo').length, color: COLORS.todo },
        { name: 'In Progress', value: tasks.filter(t => t.tStatus === 'in_progress').length, color: COLORS.in_progress },
        { name: 'Done', value: tasks.filter(t => t.tStatus === 'done').length, color: COLORS.done },
    ];

    // --- Trend Data (Last 4 Weeks) ---
    const getTrendData = () => {
        const data = [];
        const now = new Date();
        for (let i = 3; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) - 6);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));

            const weekLabel = `${start.getDate()}/${start.getMonth() + 1}`;

            const created = tasks.filter(t => {
                const d = new Date(t.tCreateAt);
                return d >= start && d <= end;
            }).length;

            const completed = tasks.filter(t => {
                if (t.tStatus !== 'done') return false;
                // Again, using UpdateAt as proxy for completion time
                const d = t.tUpdateAt ? new Date(t.tUpdateAt) : new Date(t.tCreateAt);
                return d >= start && d <= end;
            }).length;

            data.push({
                name: weekLabel,
                Created: created,
                Completed: completed
            });
        }
        return data;
    };
    const trendData = getTrendData();

    // --- Upcoming Deadlines Data ---
    const upcomingDeadlines = tasks.filter(t => {
        if (t.tStatus === 'done' || !t.tDateExpire) return false;
        const expireDate = new Date(t.tDateExpire);
        const now = new Date();
        const diffHours = (expireDate - now) / 36e5;
        return diffHours > 0 && diffHours <= 48;
    }).sort((a, b) => new Date(a.tDateExpire) - new Date(b.tDateExpire));


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
            {/* Header */}
            <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ViewSwitcher />
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Analytics Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 pl-3 border-l border-gray-200">
                            <UserMenu user={user} onLogout={logout} />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Completion Rate */}
                    <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-100/50 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-indigo-200/50 transition-colors"></div>
                        <h3 className="text-sm sm:text-base text-gray-500 font-medium mb-1">Completion Rate</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-bold text-gray-800">{completionRate}%</span>
                            <span className="text-xs text-gray-500">of all tasks</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                        </div>
                    </div>

                    {/* Velocity */}
                    <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-green-100/50 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-green-200/50 transition-colors"></div>
                        <h3 className="text-sm sm:text-base text-gray-500 font-medium mb-1">Weekly Velocity</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-bold text-gray-800">{velocity}</span>
                            <span className="text-xs text-green-600 font-medium flex items-center">
                                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                tasks
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Completed in the last 7 days</p>
                    </div>

                    {/* Overdue */}
                    <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-red-100/50 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-red-200/50 transition-colors"></div>
                        <h3 className="text-sm sm:text-base text-gray-500 font-medium mb-1">Overdue Tasks</h3>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl sm:text-4xl font-bold ${overdueTasks > 0 ? 'text-red-500' : 'text-gray-800'}`}>{overdueTasks}</span>
                            <span className="text-xs text-gray-500">needs attention</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Tasks past deadline not done</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Status Distribution */}
                    <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm flex flex-col">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">Task Status Distribution</h3>
                        <div className="flex-1 min-h-[250px] sm:min-h-[300px]" style={{ width: '100%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Productivity Trend */}
                    <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm flex flex-col">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">Productivity Trend (Last 4 Weeks)</h3>
                        <div className="flex-1 min-h-[250px] sm:min-h-[300px]" style={{ width: '100%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Created" fill="#818cf8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/40 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 sm:h-8 bg-red-400 rounded-full"></span>
                        <span className="text-sm sm:text-base">Upcoming Deadlines (Next 48h)</span>
                    </h3>

                    {upcomingDeadlines.length === 0 ? (
                        <div className="py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base">
                            <p>No urgent deadlines coming up.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {upcomingDeadlines.map(task => (
                                <div key={task.tId} className="bg-white/50 p-4 rounded-xl border border-red-100 hover:border-red-300 transition-all shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800 line-clamp-1" title={task.tName}>{task.tName}</h4>
                                        <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {new Date(task.tDateExpire).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>Due: {new Date(task.tDateExpire).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mt-3 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-400 w-2/3 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default ProductivityDashboard;
