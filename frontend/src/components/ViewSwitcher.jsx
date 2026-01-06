import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ViewSwitcher = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="flex bg-white/80 p-1 rounded-xl border border-gray-200 shadow-sm">
            <button
                onClick={() => navigate('/tasks')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${location.pathname === '/tasks'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                title="List View"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List</span>
            </button>
            <button
                onClick={() => navigate('/kanban')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${location.pathname === '/kanban'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                title="Kanban View"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
                onClick={() => navigate('/calendar')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${location.pathname === '/calendar'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                title="Calendar View"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
                onClick={() => navigate('/analytics')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${location.pathname === '/analytics'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                title="Analytics Dashboard"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
            </button>
        </div>
    );
};

export default ViewSwitcher;
