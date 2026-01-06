import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Không log warning cho các request công khai như /auth/login, /auth/register
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Chỉ log lỗi không phải 429 (rate limiting đã được xử lý ở UI)
    // và không phải 401 (sẽ được xử lý bởi refresh token logic)
    if (error.response?.status !== 429 && error.response?.status !== 401) {
      console.error('API Error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.response?.data?.message,
        code: error.response?.data?.code
      });
    }

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Gọi API refresh token
        const response = await axios.post('http://localhost:3000/api/auth/refresh', {
          refreshToken
        });

        const { accessToken } = response.data.data;
        
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          
          // Retry request với token mới
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;