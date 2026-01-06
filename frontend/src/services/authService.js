import api from '../utils/api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Kiểm tra response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (!accessToken || !refreshToken || !user) {
        throw new Error('Missing authentication data in response');
      }
      
      // Lưu vào localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      console.error('authService.login error:', error);
      throw error;
    }
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Xóa tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async updateProfile(userData) {
    try {
      // Sử dụng route /users/profile như đã định nghĩa ở backend
      const response = await api.put('/users/profile', userData);
      
      // Cập nhật localStorage với thông tin user mới
      if (response.data?.data?.user) {
        const updatedUser = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};

