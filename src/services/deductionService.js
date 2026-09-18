import api from './api';

export const deductionService = {
  getAllDeductions: async () => {
    const response = await api.get('/deductions');
    return response.data;
  },

  getDeductionsByBuyer: async (buyerId) => {
    const response = await api.get(`/deductions/buyer/${buyerId}`);
    return response.data;
  },

  getDeductionById: async (id) => {
    const response = await api.get(`/deductions/${id}`);
    return response.data;
  },

  createDeduction: async (deductionData) => {
    const response = await api.post('/deductions', deductionData);
    return response.data;
  },

  updateDeduction: async (id, deductionData) => {
    const response = await api.put(`/deductions/${id}`, deductionData);
    return response.data;
  },

  deleteDeduction: async (id) => {
    const response = await api.delete(`/deductions/${id}`);
    return response.data;
  },

  toggleDeductionStatus: async (id) => {
    const response = await api.patch(`/deductions/${id}/toggle-status`);
    return response.data;
  }
};
