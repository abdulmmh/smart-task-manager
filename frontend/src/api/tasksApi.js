import client from './client';

export const tasksApi = {
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters.overdue) params.append('overdue', 'true');

    const response = await client.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await client.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data) => {
    const response = await client.post('/tasks', data);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await client.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await client.delete(`/tasks/${id}`);
    return response.data;
  },
};
