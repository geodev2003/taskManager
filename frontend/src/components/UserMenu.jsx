import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Đóng menu khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-indigo-50 transition-all duration-200 focus:outline-none"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
            {user?.uName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 sm:w-56 glass rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 py-2 z-50 animate-scale-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200/50">
            <p className="text-sm font-bold text-gray-800">{user?.uName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.uEmail}</p>
            {isAdmin && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg">
                Admin
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/profile");
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-white/60 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Hồ sơ của tôi</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin");
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-white/60 transition-colors flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5 text-purple-500"
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
                <span>Admin Dashboard</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
            >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
