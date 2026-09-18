import api from './api';

export const buyerService = {
  getAllBuyers: async () => {
    const response = await api.get('/buyers');
    return response.data;
  },

  getBuyerById: async (id) => {
    const response = await api.get(`/buyers/${id}`);
    return response.data;
  },

  createBuyer: async (buyerData) => {
    const response = await api.post('/buyers', buyerData);
    return response.data;
  },

  updateBuyer: async (id, buyerData) => {
    const response = await api.put(`/buyers/${id}`, buyerData);
    return response.data;
  },

  deleteBuyer: async (id) => {
    const response = await api.delete(`/buyers/${id}`);
    return response.data;
  },

  toggleBuyerStatus: async (id) => {
    const response = await api.patch(`/buyers/${id}/toggle-status`);
    return response.data;
  }
};
