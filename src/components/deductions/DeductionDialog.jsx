import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete
} from '@mui/material';

const DeductionDialog = ({ open, onClose, onSubmit, deduction, buyers, loading }) => {
  const [formData, setFormData] = useState({
    deductionName: '',
    percentage: '',
    buyers: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (deduction) {
      setFormData({
        deductionName: deduction.deductionName || '',
        percentage: deduction.percentage || '',
        buyers: deduction.buyers || []
      });
    } else {
      setFormData({
        deductionName: '',
        percentage: '',
        buyers: []
      });
    }
    setErrors({});
  }, [deduction, open]);

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

  const handleBuyersChange = (event, newValue) => {
    setFormData({
      ...formData,
      buyers: newValue
    });
    if (errors.buyers) {
      setErrors({
        ...errors,
        buyers: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.deductionName.trim()) {
      newErrors.deductionName = 'Deduction name is required';
    }

    if (formData.percentage === '' || formData.percentage === null) {
      newErrors.percentage = 'Percentage is required';
    } else {
      const percentageNum = Number(formData.percentage);
      if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
        newErrors.percentage = 'Percentage must be > 0 and ≤ 100';
      }
    }

    // Buyers optional per request

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        deductionName: formData.deductionName,
        percentage: Number(formData.percentage),
        buyers: formData.buyers.map(buyer => buyer._id)
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {deduction ? 'Edit Deduction' : 'Create New Deduction'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Deduction Name"
              name="deductionName"
              value={formData.deductionName}
              onChange={handleChange}
              error={!!errors.deductionName}
              helperText={errors.deductionName}
              required
              autoFocus
              placeholder="e.g., Freight, Tax, Handling"
            />

            <TextField
              fullWidth
              label="Percentage"
              name="percentage"
              type="number"
              value={formData.percentage}
              onChange={handleChange}
              error={!!errors.percentage}
              helperText={errors.percentage || 'Enter a value > 0 and ≤ 100. Decimals allowed (e.g., 0.3)'}
              required
              inputProps={{
                min: 0.01,
                max: 100,
                step: 0.01
              }}
            />

            <Autocomplete
              multiple
              options={buyers}
              getOptionLabel={(option) => option.buyerName || ''}
              value={formData.buyers}
              onChange={handleBuyersChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buyers"
                  error={!!errors.buyers}
                  helperText={errors.buyers || 'Optional: select one or more buyers'}
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : deduction ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DeductionDialog;
