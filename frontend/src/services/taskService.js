import api from '../utils/api';

// Generate UUID for idempotency key
const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const taskService = {
  async createTask(taskData) {
    // Tạo idempotency key
    const idempotencyKey = generateIdempotencyKey();
    
    const response = await api.post('/tasks', taskData, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  async getTasks(search = '', page = 1, limit = 10) {
    try {
      const response = await api.get('/tasks', {
        params: { search, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('getTasks error:', error);
      throw error;
    }
  },

  async getTaskById(id) {
    // Lấy từ list hoặc có thể tạo endpoint riêng
    const response = await api.get('/tasks', {
      params: { search: '', page: 1, limit: 1000 },
    });
    const tasksData = response.data.data || response.data;
    const tasksList = tasksData.tasks || [];
    const task = tasksList.find(t => t.tId === parseInt(id));
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  },

  async updateTask(id, taskData, version) {
    try {
      const taskId = parseInt(id);
      if (isNaN(taskId) || taskId <= 0) {
        throw new Error('Invalid task ID');
      }
      
      if (!version || version <= 0) {
        throw new Error('Version is required and must be a positive number');
      }
      
      // Backend nhận tName, tStatus, tContent, tRimderAt, tDateExpire, và version
      // Format datetime từ input (YYYY-MM-DDTHH:mm) thành ISO string
      // Chỉ format nếu có giá trị, không gửi field nếu undefined để backend giữ nguyên giá trị cũ
      const formatDateTimeForAPI = (dateTimeStr) => {
        // Nếu undefined, trả về undefined (không gửi field này lên)
        if (dateTimeStr === undefined) return undefined;
        // Nếu null hoặc empty string, trả về null (để xóa date)
        if (!dateTimeStr || (typeof dateTimeStr === 'string' && !dateTimeStr.trim())) return null;
        // Input datetime-local trả về format: YYYY-MM-DDTHH:mm
        // Cần convert thành ISO string để backend hiểu
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      };
      
      const requestBody = {
        tName: taskData.tName || '',
        tStatus: taskData.tStatus || 'todo',
        tContent: taskData.tContent || '',
        version: parseInt(version),
      };
      
      // Chỉ thêm tRimderAt và tDateExpire nếu có giá trị (undefined sẽ không được gửi)
      const formattedRimderAt = formatDateTimeForAPI(taskData.tRimderAt);
      const formattedDateExpire = formatDateTimeForAPI(taskData.tDateExpire);
      
      if (formattedRimderAt !== undefined) {
        requestBody.tRimderAt = formattedRimderAt;
      }
      if (formattedDateExpire !== undefined) {
        requestBody.tDateExpire = formattedDateExpire;
      }
      
      // Validate required fields
      if (!requestBody.tName) {
        throw new Error('Task name is required');
      }
      
      console.log('Update task request:', { id: taskId, body: requestBody }); // Debug
      
      const response = await api.put(`/tasks/${taskId}`, requestBody);
      return response.data;
    } catch (error) {
      console.error('updateTask error:', error);
      throw error;
    }
  },

  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  async restoreTask(id) {
    const response = await api.post(`/tasks/${id}/restore`);
    return response.data;
  },

  async getTaskAudits(id) {
    try {
      const taskId = parseInt(id);
      if (isNaN(taskId) || taskId <= 0) {
        throw new Error('Invalid task ID');
      }
      
      const response = await api.get(`/tasks/${taskId}/audits`);
      return response.data;
    } catch (error) {
      console.error('getTaskAudits error:', error);
      // Không throw để không block UI, chỉ log error
      return { data: [] };
    }
  },

  async getMyDeletedTasks(search = '', page = 1, limit = 10) {
    try {
      const response = await api.get('/tasks/deleted/my', {
        params: { search, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('getMyDeletedTasks error:', error);
      throw error;
    }
  },

  async getSoftDeletedTasks(search = '', page = 1, limit = 10) {
    try {
      const response = await api.get('/tasks/deleted', {
        params: { search, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('getSoftDeletedTasks error:', error);
      throw error;
    }
  },

  async hardDeleteTask(id) {
    const response = await api.delete(`/tasks/${id}/hard`);
    return response.data;
  },
};

