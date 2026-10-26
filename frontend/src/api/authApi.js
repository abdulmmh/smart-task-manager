import client from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await client.post('/auth/register', { name, email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },

  getUsers: async () => {
    const response = await client.get('/auth/users');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await client.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  updateProfile: async (name) => {
    const response = await client.put('/auth/profile', { name });
    return response.data;
  },
};

