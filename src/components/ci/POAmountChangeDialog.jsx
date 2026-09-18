import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert
} from '@mui/material';

const POAmountChangeDialog = ({ open, onClose, onSubmit, currentAmount }) => {
  const [newAmount, setNewAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setNewAmount('');
      setReason('');
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const newErrors = {};

    const amount = Number(newAmount);
    if (!newAmount || isNaN(amount) || amount < 0) {
      newErrors.newAmount = 'Valid amount is required';
    } else if (amount === currentAmount) {
      newErrors.newAmount = 'New amount must be different from current amount';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason for change is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(Number(newAmount), reason);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change PO Amount</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="warning">
              This change will be recorded in the audit log.
            </Alert>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current PO Amount:
              </Typography>
              <Typography variant="h6">
                ${currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="New PO Amount (USD)"
              type="number"
              value={newAmount}
              onChange={(e) => {
                setNewAmount(e.target.value);
                if (errors.newAmount) {
                  setErrors({ ...errors, newAmount: '' });
                }
              }}
              error={!!errors.newAmount}
              helperText={errors.newAmount}
              required
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for Change"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors({ ...errors, reason: '' });
                }
              }}
              error={!!errors.reason}
              helperText={errors.reason}
              required
              placeholder="e.g., Updated based on revised purchase order"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save Change
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default POAmountChangeDialog;
