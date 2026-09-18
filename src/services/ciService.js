import api from './api';

export const ciService = {
  getAllCIs: async (params = {}) => {
    const response = await api.get('/ci', { params });
    return response.data;
  },

  getCIById: async (id) => {
    const response = await api.get(`/ci/${id}`);
    return response.data;
  },

  createCI: async (ciData) => {
    const response = await api.post('/ci', ciData);
    return response.data;
  },

  updateCI: async (id, ciData) => {
    const response = await api.put(`/ci/${id}`, ciData);
    return response.data;
  },

  deleteCI: async (id) => {
    const response = await api.delete(`/ci/${id}`);
    return response.data;
  },

  updateLogistics: async (id, logisticsData) => {
    const response = await api.put(`/ci/${id}/logistics`, logisticsData);
    return response.data;
  },

  getPOAmountHistory: async (id) => {
    const response = await api.get(`/ci/${id}/po-amount-history`);
    return response.data;
  },

  initializeAccounting: async (id) => {
    const response = await api.post(`/ci/${id}/accounting/initialize`);
    return response.data;
  },

  updateAccounting: async (id, accountingData) => {
    const response = await api.put(`/ci/${id}/accounting`, accountingData);
    return response.data;
  },

  getAccountingHistory: async (id) => {
    const response = await api.get(`/ci/${id}/accounting/history`);
    return response.data;
  },

  getPendingDeductions: async (params = {}) => {
    const response = await api.get('/ci/pending-deductions', { params });
    return response.data;
  }
};
