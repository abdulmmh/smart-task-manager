import client from './client';

export const dashboardApi = {
  getMetrics: async () => {
    const response = await client.get('/dashboard');
    return response.data;
  },
};
