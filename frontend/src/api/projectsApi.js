import client from './client';

export const projectsApi = {
  getProjects: async () => {
    const response = await client.get('/projects');
    return response.data;
  },

  getProjectById: async (id) => {
    const response = await client.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data) => {
    const response = await client.post('/projects', data);
    return response.data;
  },

  updateProject: async (id, data) => {
    const response = await client.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await client.delete(`/projects/${id}`);
    return response.data;
  },
};
