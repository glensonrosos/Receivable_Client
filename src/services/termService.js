import api from './api';

export const termService = {
  getAllTerms: async (includeInactive = false) => {
    const response = await api.get('/terms', { params: includeInactive ? { includeInactive: true } : {} });
    return response.data;
  },

  createTerm: async (termData) => {
    const response = await api.post('/terms', termData);
    return response.data;
  },

  updateTerm: async (id, termData) => {
    const response = await api.put(`/terms/${id}`, termData);
    return response.data;
  },

  toggleTermStatus: async (id) => {
    const response = await api.patch(`/terms/${id}/toggle-status`);
    return response.data;
  },

  deleteTerm: async (id) => {
    const response = await api.delete(`/terms/${id}`);
    return response.data;
  }
};
