import api from './api';

export const reportService = {
  exportDeductions: async (params = {}) => {
    const response = await api.get('/reports/deductions/export', {
      params,
      responseType: 'blob'
    });
    return response;
  }
};
