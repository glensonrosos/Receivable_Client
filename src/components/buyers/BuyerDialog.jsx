import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';

const BuyerDialog = ({ open, onClose, onSubmit, buyer, loading }) => {
  const [formData, setFormData] = useState({
    buyerName: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (buyer) {
      setFormData({
        buyerName: buyer.buyerName || ''
      });
    } else {
      setFormData({
        buyerName: ''
      });
    }
    setErrors({});
  }, [buyer, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Buyer name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {buyer ? 'Edit Buyer' : 'Create New Buyer'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Buyer Name"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleChange}
              error={!!errors.buyerName}
              helperText={errors.buyerName}
              required
              autoFocus
              placeholder="e.g., Buyer A, Buyer B, etc."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : buyer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BuyerDialog;
