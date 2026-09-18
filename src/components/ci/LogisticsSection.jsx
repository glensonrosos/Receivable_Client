import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Divider,
  Paper,
  Alert,
  Snackbar,
  Slide,
  Chip,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Save as SaveIcon, History as HistoryIcon } from '@mui/icons-material';
import POAmountChangeDialog from './POAmountChangeDialog';
import { buyerService } from '../../services/buyerService';

const LogisticsSection = ({ ci, onUpdate, canEdit, onViewHistory, isAdmin = false }) => {
  const [formData, setFormData] = useState({
    buyer: '',
    poNumber: '',
    shipDate: null,
    ciDate: null,
    uploadDate: null,
    terms: 30,
    poAmount: 0,
    logisticsDeduction: 0,
    logisticsRemarks: '',
    logisticsStatus: 'OPEN'
  });
  const [poAmountDialogOpen, setPOAmountDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [buyers, setBuyers] = useState([]);
  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const showSnack = (msg, severity = 'success') => { setSnackbarMsg(msg); setSnackbarSeverity(severity); setSnackbarOpen(true); };
  const closeSnack = () => setSnackbarOpen(false);
  const persistedStatus = ci?.logisticsStatus;
  const isLocked = (persistedStatus === 'DONE' || persistedStatus === 'CANCEL') && !isAdmin;

  useEffect(() => {
    if (ci) {
      setFormData({
        buyer: ci.buyer?._id || '',
        poNumber: ci.poNumber || '',
        shipDate: ci.shipDate ? new Date(ci.shipDate) : null,
        ciDate: ci.ciDate ? new Date(ci.ciDate) : null,
        uploadDate: ci.uploadDate ? new Date(ci.uploadDate) : null,
        terms: ci.terms || 30,
        poAmount: ci.poAmount / 100 || 0,
        logisticsDeduction: ci.logisticsDeduction / 100 || 0,
        logisticsRemarks: ci.logisticsRemarks || '',
        logisticsStatus: ci.logisticsStatus || 'OPEN'
      });
    }
  }, [ci]);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const res = await buyerService.getAllBuyers();
        setBuyers(res.data.buyers || []);
      } catch (e) {
        // ignore
      }
    };
    if (canEdit) fetchBuyers();
  }, [canEdit]);

  const calculateDueDate = () => {
    if (!formData.shipDate || !formData.terms) return null;
    const dueDate = new Date(formData.shipDate);
    dueDate.setDate(dueDate.getDate() + formData.terms);
    return dueDate;
  };

  const calculateAmountDue = () => {
    return formData.poAmount - formData.logisticsDeduction;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return 'success';
      case 'CANCEL': return 'error';
      case 'ON-HOLD': return 'warning';
      case 'OPEN': return 'default';
      default: return 'default';
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const handlePOAmountClick = () => {
    if (!canEdit) return;
    if (isLocked) return;
    setPOAmountDialogOpen(true);
  };

  const handlePOAmountChange = (newAmount, reason) => {
    const updateData = {
      ...formData,
      poAmount: newAmount
    };

    const payload = {
      buyer: updateData.buyer || undefined,
      poNumber: updateData.poNumber,
      shipDate: updateData.shipDate === null ? null : updateData.shipDate?.toISOString(),
      ciDate: updateData.ciDate === null ? null : updateData.ciDate?.toISOString(),
      uploadDate: updateData.uploadDate === null ? null : updateData.uploadDate?.toISOString(),
      terms: updateData.terms,
      poAmount: Math.round(newAmount * 100),
      logisticsDeduction: Math.round(updateData.logisticsDeduction * 100),
      logisticsRemarks: updateData.logisticsRemarks,
      logisticsStatus: updateData.logisticsStatus,
      poAmountChangeReason: reason
    };

    onUpdate(payload);
    setPOAmountDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Clear previous errors
    setErrors({});

    // General date validations: CI Date and Upload Date cannot be in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDateErrors = {};
    if (formData.ciDate) {
      const ciDateOnly = new Date(formData.ciDate);
      ciDateOnly.setHours(0, 0, 0, 0);
      if (ciDateOnly.getTime() > today.getTime()) newDateErrors.ciDate = 'CI Date cannot be in the future';
    }
    if (formData.uploadDate) {
      const upDateOnly = new Date(formData.uploadDate);
      upDateOnly.setHours(0, 0, 0, 0);
      if (upDateOnly.getTime() > today.getTime()) newDateErrors.uploadDate = 'Upload Date cannot be in the future';
    }
    if (Object.keys(newDateErrors).length > 0) {
      setErrors(newDateErrors);
      const firstErr = newDateErrors.ciDate || newDateErrors.uploadDate;
      if (firstErr) showSnack(firstErr, 'error');
      return;
    }

    // Status-based client validations
    if (formData.logisticsStatus === 'ON-HOLD' || formData.logisticsStatus === 'CANCEL') {
      if (!formData.logisticsRemarks || !formData.logisticsRemarks.trim()) {
        setErrors((prev) => ({ ...prev, logisticsRemarks: `Remarks are required when status is ${formData.logisticsStatus}` }));
        return;
      }
    }
    if (formData.logisticsStatus === 'DONE') {
      const newErrors = {};
      if (!formData.buyer) newErrors.buyer = 'Buyer is required when status is DONE';
      if (!formData.poNumber || !formData.poNumber.trim()) newErrors.poNumber = 'PO Number is required when status is DONE';
      if (!formData.terms) newErrors.terms = 'Terms are required when status is DONE';
      if (!formData.shipDate) newErrors.shipDate = 'Ship Date is required when status is DONE';
      if (!formData.ciDate) newErrors.ciDate = 'CI Date is required when status is DONE';
      if (!formData.uploadDate) newErrors.uploadDate = 'Upload Date is required when status is DONE';
      if (!(Number(formData.poAmount) > 0)) newErrors.poAmount = 'PO Amount must be greater than 0 when status is DONE';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        const first = newErrors.buyer || newErrors.poNumber || newErrors.terms || newErrors.shipDate || newErrors.ciDate || newErrors.uploadDate || newErrors.poAmount;
        if (first) showSnack(first, 'error');
        return;
      }
    }

    const payload = {
      buyer: formData.buyer || undefined,
      poNumber: formData.poNumber,
      shipDate: formData.shipDate === null ? null : formData.shipDate?.toISOString(),
      ciDate: formData.ciDate === null ? null : formData.ciDate?.toISOString(),
      uploadDate: formData.uploadDate === null ? null : formData.uploadDate?.toISOString(),
      terms: formData.terms,
      poAmount: Math.round(formData.poAmount * 100),
      logisticsDeduction: Math.round(formData.logisticsDeduction * 100),
      logisticsRemarks: formData.logisticsRemarks,
      logisticsStatus: formData.logisticsStatus
    };

    onUpdate(payload);
  };

  const dueDate = calculateDueDate();
  const amountDue = calculateAmountDue();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Logistics Section</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Logistics Change History">
              <span>
                <IconButton color="primary" onClick={onViewHistory} size="small">
                  <HistoryIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Chip
              label={ci?.logisticsStatus || 'OPEN'}
              color={getStatusColor(ci?.logisticsStatus || 'OPEN')}
              sx={{ fontWeight: 'medium' }}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CI Number"
                value={ci?.ciNumber || ''}
                InputProps={{ readOnly: true }}
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              {canEdit ? (
                <TextField
                  select
                  fullWidth
                  label="Buyer"
                  value={formData.buyer}
                  onChange={(e) => handleChange('buyer', e.target.value)}
                  disabled={isLocked}
                  error={!!errors.buyer}
                  helperText={errors.buyer}
                >
                  {buyers.map((b) => (
                    <MenuItem key={b._id} value={b._id}>{b.buyerName}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label="Buyer"
                  value={ci?.buyer?.buyerName || ''}
                  InputProps={{ readOnly: true }}
                  disabled
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {canEdit ? (
                <TextField
                  fullWidth
                  label="PO Number"
                  value={formData.poNumber}
                  onChange={(e) => handleChange('poNumber', e.target.value)}
                  disabled={isLocked}
                  error={!!errors.poNumber}
                  helperText={errors.poNumber}
                />
              ) : (
                <TextField
                  fullWidth
                  label="PO Number"
                  value={ci?.poNumber || ''}
                  InputProps={{ readOnly: true }}
                  disabled
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Ship Date"
                value={formData.shipDate}
                onChange={(date) => handleChange('shipDate', date)}
                disabled={!canEdit || isLocked}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.shipDate,
                    helperText: errors.shipDate
                  },
                  field: {}
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="CI Date"
                value={formData.ciDate}
                onChange={(date) => handleChange('ciDate', date)}
                disabled={!canEdit || isLocked}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.ciDate,
                    helperText: errors.ciDate
                  },
                  field: {}
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Upload Date"
                value={formData.uploadDate}
                onChange={(date) => handleChange('uploadDate', date)}
                disabled={!canEdit || isLocked}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.uploadDate,
                    helperText: errors.uploadDate
                  },
                  field: {}
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Terms (Days)"
                value={formData.terms}
                onChange={(e) => handleChange('terms', Number(e.target.value))}
                disabled={!canEdit || isLocked}
                error={!!errors.terms}
                helperText={errors.terms}
              >
                <MenuItem value={30}>30</MenuItem>
                <MenuItem value={60}>60</MenuItem>
                <MenuItem value={90}>90</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                value={dueDate ? dueDate.toLocaleDateString() : 'N/A'}
                InputProps={{ readOnly: true }}
                disabled
                helperText="Calculated: Ship Date + Terms"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PO Amount (USD)"
                value={`$${formData.poAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                InputProps={{ readOnly: true }}
                onClick={handlePOAmountClick}
                sx={{ cursor: canEdit && !isLocked ? 'pointer' : 'default' }}
                helperText={canEdit ? "Click to change (requires reason)" : ""}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Logistics Deduction (USD)"
                type="number"
                value={formData.logisticsDeduction}
                onChange={(e) => handleChange('logisticsDeduction', Number(e.target.value))}
                disabled={!canEdit || isLocked}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount Due (USD)"
                value={`$${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                InputProps={{ readOnly: true }}
                disabled
                helperText="Calculated: PO Amount - Logistics Deduction"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Logistics Status"
                value={formData.logisticsStatus}
                onChange={(e) => handleChange('logisticsStatus', e.target.value)}
                disabled={!canEdit || (!isAdmin && isLocked)}
              >
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="ON-HOLD">ON-HOLD</MenuItem>
                <MenuItem value="CANCEL">CANCEL</MenuItem>
                <MenuItem value="DONE">DONE</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                value={formData.logisticsRemarks}
                onChange={(e) => handleChange('logisticsRemarks', e.target.value)}
                disabled={!canEdit || isLocked}
                error={!!errors.logisticsRemarks}
                helperText={errors.logisticsRemarks}
                placeholder="Enter logistics remarks..."
              />
            </Grid>

            {canEdit && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isLocked && !isAdmin}
                  >
                    Save Logistics
                  </Button>
                </Box>
              </Grid>
            )}

            {!canEdit && (
              <Grid item xs={12}>
                <Alert severity="info">
                  You have view-only access to the Logistics section.
                </Alert>
              </Grid>
            )}
          </Grid>
        </form>

        <POAmountChangeDialog
          open={poAmountDialogOpen}
          onClose={() => setPOAmountDialogOpen(false)}
          onSubmit={handlePOAmountChange}
          currentAmount={formData.poAmount}
        />
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={(props) => <Slide {...props} direction="up" />}
      >
        <Alert onClose={closeSnack} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default LogisticsSection;
