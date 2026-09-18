import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
  Alert
} from '@mui/material';

const CreateCIDialog = ({ open, onClose, onSubmit, buyers, loading }) => {
  const [formData, setFormData] = useState({
    buyer: null,
    poNumber: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setFormData({
        buyer: null,
        poNumber: ''
      });
      setErrors({});
    }
  }, [open]);

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

  const handleBuyerChange = (event, newValue) => {
    setFormData({
      ...formData,
      buyer: newValue
    });
    if (errors.buyer) {
      setErrors({
        ...errors,
        buyer: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.buyer) {
      newErrors.buyer = 'Buyer is required';
    }

    if (!formData.poNumber.trim()) {
      newErrors.poNumber = 'PO Number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        buyer: formData.buyer._id,
        poNumber: formData.poNumber
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Create New Commercial Invoice
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info">
              CI Number will be automatically assigned upon creation.
            </Alert>

            <Autocomplete
              options={buyers}
              getOptionLabel={(option) => option.buyerName || ''}
              value={formData.buyer}
              onChange={handleBuyerChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buyer *"
                  error={!!errors.buyer}
                  helperText={errors.buyer}
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />

            <TextField
              fullWidth
              label="PO Number"
              name="poNumber"
              value={formData.poNumber}
              onChange={handleChange}
              error={!!errors.poNumber}
              helperText={errors.poNumber}
              required
              placeholder="e.g., PO-2024-001"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create CI'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateCIDialog;
