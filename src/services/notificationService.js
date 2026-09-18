import api from './api';

export const notificationService = {
  notifyReady: async (force = false) => {
    const response = await api.post('/notifications/notify-ready', { force });
    return response.data;
  },
  testEmail: async () => {
    const response = await api.post('/notifications/test');
    return response.data;
  },
  listLogs: async (limit = 100) => {
    const response = await api.get('/notifications/logs', { params: { limit } });
    return response.data;
  },
  clearLogs: async () => {
    const response = await api.delete('/notifications/logs');
    return response.data;
  }
};
