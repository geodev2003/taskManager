import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra user trong localStorage khi app khởi động
    const storedUser = authService.getCurrentUser();
    const token = localStorage.getItem('accessToken');

    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const userData = response.data.user;
      setUser(userData);
      return response;
    } catch (error) {
      // Chỉ log lỗi thực sự, không log rate limiting (429) vì đã được xử lý ở UI
      if (error.response?.status !== 429) {
        console.error('Login failed:', error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      // Không dùng navigate ở đây, để component gọi logout tự xử lý
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn clear local state dù có lỗi
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};