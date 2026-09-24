import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  Paper,
  Alert,
  Snackbar,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Save as SaveIcon, Refresh as RefreshIcon, History as HistoryIcon } from '@mui/icons-material';
import { ciService } from '../../services/ciService';
import { DataGrid } from '@mui/x-data-grid';

const AccountingSection = ({ ci, onInitialize, onUpdate, canEdit, isInitialized }) => {
  const [formData, setFormData] = useState({
    deductions: [],
    bankCharges: 0,
    actualPayment: 0,
    dateReceived: null,
    accountingRemarks: '',
    accountingStatus: 'Waiting to Due'
  });

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Percentage edit dialog state
  const [pctDialogOpen, setPctDialogOpen] = useState(false);
  const [pctEditIndex, setPctEditIndex] = useState(null);
  const [pctNewValue, setPctNewValue] = useState('');
  const [pctReason, setPctReason] = useState('');
  const [deductionReasons, setDeductionReasons] = useState({}); // key by deductionId or name:percentage
  const [pctSaving, setPctSaving] = useState(false);

  // Snackbar for success/error
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const showSnack = (msg, severity = 'success') => { setSnackbarMsg(msg); setSnackbarSeverity(severity); setSnackbarOpen(true); };
  const closeSnack = () => setSnackbarOpen(false);

  // Add deduction dialogs state
  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [addFromCiOpen, setAddFromCiOpen] = useState(false);
  const [fromCiNumber, setFromCiNumber] = useState('');
  const [fromPoNumber, setFromPoNumber] = useState('');
  const [fromPct, setFromPct] = useState('');
  const [fromReason, setFromReason] = useState('');
  const [addingDeduction, setAddingDeduction] = useState(false);
  const [ciOptions, setCiOptions] = useState([]);
  // Remove confirmation
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeTargetIndex, setRemoveTargetIndex] = useState(null);
  const [ciSearch, setCiSearch] = useState('');
  const [selectedCi, setSelectedCi] = useState(null);
  // Pending deductions list for Add From CI (flattened across prior CIs)
  const [pendingRows, setPendingRows] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  // DataGrid pagination and selection
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [pendingSelectedIds, setPendingSelectedIds] = useState([]);

  useEffect(() => {
    if (ci) {
      setFormData({
        deductions: ci.deductions || [],
        bankCharges: ci.bankCharges / 100 || 0,
        actualPayment: ci.actualPayment / 100 || 0,
        dateReceived: ci.dateReceived ? new Date(ci.dateReceived) : null,
        accountingRemarks: ci.accountingRemarks || '',
        accountingStatus: ci.accountingStatus || 'Waiting to Due'
      });
    }
  }, [ci]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Fetch ALL uncharged deductions from prior CIs via backend endpoint
  useEffect(() => {
    const run = async () => {
      try {
        if (!addFromCiOpen) return;
        const buyerObj = ci?.buyer;
        const buyerId = typeof buyerObj === 'object' ? buyerObj?._id : buyerObj; // populated or raw id
        if (!buyerId) { setPendingRows([]); return; }

        setPendingLoading(true);
        const resp = await ciService.getPendingDeductions({
          buyerId,
          search: ciSearch || '',
          excludeCiNumber: ci?.ciNumber,
          accountingStatus: 'Partially Deducted,No Deduction'
        });
        const items = resp?.data?.items || [];
        const accPoCents = Number(ci?.accountingPoAmount || 0); // cents on client
        const computed = items.map(r => {
          const pctNum = typeof r.percentage === 'number' ? r.percentage : Number(r.percentage ?? 0);
          // Compute display-unit amount for rendering (not cents)
          let amtDisplay = Number(r.amountDeducted ?? 0);
          if ((isNaN(amtDisplay) || amtDisplay <= 0) && pctNum > 0) {
            if (accPoCents > 0) {
              amtDisplay = Math.round(((accPoCents / 100) * pctNum) ) / 100; // (cents->display) * pct /100
            } else {
              const srcPoDisplay = Number(r.sourceAccountingPoAmount ?? 0);
              amtDisplay = srcPoDisplay > 0 ? Math.round(((srcPoDisplay * pctNum)) ) / 100 : 0; // display * pct /100
            }
          }
          const row = {
            key: `${r.ciNumber}-${r.poNumber}-${r.deductionName}-${pctNum}`,
            ...r,
            dispPercentage: pctNum,
            dispAmountDisplay: amtDisplay
          };
          return row;
        });
        try { console.debug('AddFromCI pending computed:', computed); } catch {}
        setPendingRows(computed);
        setPendingSelectedIds([]);
        setPendingLoading(false);
      } catch {
        setPendingRows([]);
        setPendingSelectedIds([]);
        setPendingLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFromCiOpen, ciSearch]);

  // Refresh CI from server to sync computed totals after immediate add
  const refreshCI = async () => {
    try {
      if (!ci?._id) return;
      const resp = await ciService.getCIById(ci._id);
      const fresh = resp?.data?.data?.ci;
      if (fresh) {
        setFormData({
          deductions: fresh.deductions || [],
          bankCharges: (fresh.bankCharges || 0) / 100,
          actualPayment: (fresh.actualPayment || 0) / 100,
          dateReceived: fresh.dateReceived ? new Date(fresh.dateReceived) : null,
          accountingRemarks: fresh.accountingRemarks || '',
          accountingStatus: fresh.accountingStatus || 'Waiting to Due'
        });
      }
    } catch {}
  };

  const handleDeductionPercentChange = (index, value) => {
    if (!allowEditPercentage) return;
    const num = Number(value);
    if (isNaN(num)) return;
    const updated = [...formData.deductions];
    updated[index] = {
      ...updated[index],
      percentage: num
    };
    setFormData({ ...formData, deductions: updated });
  };

  const makeDeductionKey = (d) => {
    const id = d && d.deductionId ? String(d.deductionId) : null;
    return id || `${d.deductionName}:${d.percentage}`;
  };

  const openPercentEdit = (index) => {
    if (!allowEditPercentage) return;
    setPctEditIndex(index);
    setPctNewValue(String(formData.deductions[index].percentage || ''));
    const key = makeDeductionKey(formData.deductions[index]);
    setPctReason(deductionReasons[key] || '');
    setPctDialogOpen(true);
  };

  const closePercentEdit = () => {
    setPctDialogOpen(false);
    setPctEditIndex(null);
    setPctNewValue('');
    setPctReason('');
  };

  const confirmPercentEdit = async () => {
    const idx = pctEditIndex;
    if (idx === null || idx === undefined) return;
    const num = Number(pctNewValue);
    if (isNaN(num) || num <= 0 || num > 100) return;
    if (!pctReason.trim()) return; // require reason

    // Build a focused payload for a single deduction immediate save
    const target = formData.deductions[idx];
    // Optimistic UI update: snapshot and apply locally
    const prevForm = JSON.parse(JSON.stringify(formData));
    const updatedDeductions = [...formData.deductions];
    const accPo = Number(ci?.accountingPoAmount || 0);
    const recomputed = Math.round((accPo * num) / 100);
    updatedDeductions[idx] = { ...updatedDeductions[idx], percentage: num, amountDeducted: recomputed };
    setFormData({ ...formData, deductions: updatedDeductions });
    const payload = {
      deductions: [{
        deductionId: target.deductionId,
        charged: target.charged,
        percentage: num,
        reason: pctReason.trim()
      }]
    };

    try {
      setPctSaving(true);
      const maybePromise = onUpdate(payload);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
      // Optionally refresh history if the dialog is currently open
      if (historyOpen && ci?._id) {
        try {
          const resp = await ciService.getAccountingHistory(ci._id);
          setHistoryItems(resp?.data?.history || []);
        } catch (_) { /* no-op */ }
      }
      // Clear stored reason for this key since it is already saved
      const key = makeDeductionKey(target);
      const nextReasons = { ...deductionReasons };
      delete nextReasons[key];
      setDeductionReasons(nextReasons);
      showSnack('Percentage updated and logged.', 'success');
      closePercentEdit();
    } catch (err) {
      // Roll back optimistic update
      setFormData(prevForm);
      showSnack(err?.message || 'Failed to update percentage.', 'error');
    } finally {
      setPctSaving(false);
    }
  };

  const openHistory = async () => {
    if (!ci?._id) return;
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const resp = await ciService.getAccountingHistory(ci._id);
      setHistoryItems(resp?.data?.history || []);
    } catch (e) {
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeductionToggle = (index) => {
    if (!effectiveCanEdit) return;
    
    const updatedDeductions = [...formData.deductions];
    updatedDeductions[index] = {
      ...updatedDeductions[index],
      charged: !updatedDeductions[index].charged
    };
    
    setFormData({
      ...formData,
      deductions: updatedDeductions
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.dateReceived) {
      const dr = new Date(formData.dateReceived);
      dr.setHours(0, 0, 0, 0);
      if (dr.getTime() > today.getTime()) {
        showSnack('Date Received cannot be in the future.', 'error');
        return;
      }
    }
    if (Number(formData.actualPayment) > 0 && !formData.dateReceived) {
      showSnack('Date Received is required when Actual Payment is greater than 0.', 'error');
      return;
    }

    const payload = {
      deductions: formData.deductions.map(d => ({
        deductionId: d.deductionId,
        charged: d.charged,
        percentage: typeof d.percentage === 'number' ? d.percentage : undefined,
        reason: (() => {
          const key = makeDeductionKey(d);
          return deductionReasons[key] || undefined;
        })()
      })),
      bankCharges: Math.round(formData.bankCharges * 100),
      actualPayment: Math.round(formData.actualPayment * 100),
      dateReceived: formData.dateReceived?.toISOString(),
      accountingRemarks: formData.accountingRemarks
    };

    onUpdate(payload);
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const accountingPoAmount = ci?.accountingPoAmount || 0;
  const accountingAmountDue = ci?.accountingAmountDue || 0;
  const pendingDeductions = ci?.pendingDeductions || 0;
  const netAmount = ci?.netAmount || 0;
  const varianceAmount = ci?.varianceAmount || 0;
  const effectiveCanEdit = canEdit;
  const allowEditPercentage = canEdit && (ci?.accountingStatus !== 'CLOSED');

  const getStatusColor = (status) => {
    switch (status) {
      case 'CLOSED': return 'success';
      case 'No Deduction': return 'error';
      case 'Cancel': return 'error';
      case 'ON-HOLD': return 'warning';
      case 'Ready for Collection': return 'info';
      case 'Partially Deducted': return 'warning';
      case 'Waiting to Due': return 'default';
      default: return 'default';
    }
  };

  if (!isInitialized) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Accounting Section Not Initialized
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Initialize the accounting section to copy deductions from the buyer and set up accounting fields.
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onInitialize}
          >
            Initialize Accounting Section
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Accounting Section</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Accounting Change History">
              <span>
                <IconButton color="primary" onClick={openHistory} size="small">
                  <HistoryIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Chip 
              label={formData.accountingStatus} 
              color={getStatusColor(formData.accountingStatus)}
              sx={{ fontWeight: 'medium' }}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* PO Amount from Logistics */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Accounting PO Amount:</strong> {formatCurrency(accountingPoAmount)}
                  <br />
                  <em>Initialized from Logistics Amount Due</em>
                </Typography>
              </Alert>
            </Grid>

            {/* Deductions Table */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Deductions
              </Typography>
              {allowEditPercentage && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => setAddCustomOpen(true)}>Add Custom</Button>
                  <Button size="small" variant="outlined" onClick={() => setAddFromCiOpen(true)}>Add From CI</Button>
                </Box>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Deduction Name</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Amount Deducted</TableCell>
                      <TableCell align="center">Charged?</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.deductions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No deductions configured for this buyer
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.deductions.map((deduction, index) => {
                        const isImported = typeof deduction.deductionName === 'string' && deduction.deductionName.startsWith('CI#-');
                        const isCustom = typeof deduction.deductionName === 'string' && deduction.deductionName.startsWith('CUSTOM_');
                        let sourceLabel = '';
                        if (isImported) {
                          const full = String(deduction.deductionName);
                          const m = full.match(/^CI#-(\d+),PO#-(.+)$/);
                          if (m && m.length >= 3) {
                            const tail = m[2];
                            const cut = tail.lastIndexOf('-');
                            const po = cut >= 0 ? tail.substring(0, cut) : tail;
                            sourceLabel = `From CI ${m[1]} / ${po}`;
                          }
                        }
                        if (deduction.chargedByCiNumber) {
                          const po = deduction.chargedByPoNumber || '';
                          sourceLabel = `Charged by CI ${deduction.chargedByCiNumber}${po ? ' / ' + po : ''}`;
                        }
                        const disableRow = Boolean(deduction.chargedByCiNumber);
                        const showRemove = effectiveCanEdit && (isImported || (typeof deduction.deductionName === 'string' && deduction.deductionName.startsWith('CUSTOM_')));
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              ...(deduction.charged ? {} : {
                                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                '& td': { borderBottomColor: 'rgba(211, 47, 47, 0.24)' },
                                borderLeft: '3px solid',
                                borderLeftColor: 'error.main'
                              }),
                              ...(disableRow ? { '& td': { textDecoration: 'line-through', color: 'text.disabled' } } : {})
                            }}
                          >
                            <TableCell>{deduction.deductionName}</TableCell>
                            <TableCell>{sourceLabel}</TableCell>
                            <TableCell align="right" onDoubleClick={() => { if (!disableRow) openPercentEdit(index); }} sx={{ cursor: allowEditPercentage && !disableRow ? 'pointer' : 'default' }}>
                              {typeof deduction.percentage === 'number' && deduction.percentage > 0 ? `${deduction.percentage}%` : '—'}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(deduction.amountDeducted)}
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={deduction.charged}
                                onChange={() => handleDeductionToggle(index)}
                                disabled={!effectiveCanEdit || disableRow || isImported || isCustom}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {showRemove && (
                                <Tooltip title="Remove this deduction">
                                  <span>
                                    <Button size="small" color="error" variant="outlined" onClick={() => { setRemoveTargetIndex(index); setRemoveConfirmOpen(true); }}>Remove</Button>
                                  </span>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Calculation Summary */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Accounting Amount Due
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(accountingAmountDue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PO Amount - Charged Deductions
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pending Deductions
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {formatCurrency(pendingDeductions)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unchecked Deductions
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Bank Charges */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bank Charges (USD)"
                type="number"
                value={formData.bankCharges}
                onChange={(e) => handleChange('bankCharges', Number(e.target.value))}
                disabled={!effectiveCanEdit}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Net Amount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Net Amount (USD)"
                value={formatCurrency(netAmount)}
                InputProps={{ readOnly: true }}
                disabled
                helperText="Amount Due - Bank Charges"
              />
            </Grid>

            {/* Actual Payment */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Actual Payment (USD)"
                type="number"
                value={formData.actualPayment}
                onChange={(e) => handleChange('actualPayment', Number(e.target.value))}
                disabled={!effectiveCanEdit}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Date Received */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date Received"
                value={formData.dateReceived}
                onChange={(date) => handleChange('dateReceived', date)}
                disabled={!effectiveCanEdit}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>

            {/* Variance Amount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Variance Amount (USD)"
                value={formatCurrency(varianceAmount)}
                InputProps={{ readOnly: true }}
                helperText="Actual Payment - Net Amount"
                sx={{
                  '& .MuiInputBase-input': {
                    color: varianceAmount < 0 ? 'error.main' : 'success.main',
                    fontWeight: 'medium'
                  }
                }}
              />
            </Grid>

            {/* Accounting Remarks */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Accounting Remarks"
                value={formData.accountingRemarks}
                onChange={(e) => handleChange('accountingRemarks', e.target.value)}
                disabled={!effectiveCanEdit}
                placeholder="Enter accounting remarks, payment notes, collection notes..."
              />
            </Grid>

            {effectiveCanEdit && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                  >
                    Save Accounting
                  </Button>
                </Box>
              </Grid>
            )}

            {!effectiveCanEdit && (
              <Grid item xs={12}>
                <Alert severity="info">
                  You have view-only access to the Accounting section.
                </Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
      <HistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} items={historyItems} loading={loadingHistory} />

      {/* Percentage Edit Dialog */}
      <Dialog open={pctDialogOpen} onClose={closePercentEdit} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Deduction Percentage</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="New Percentage"
              type="number"
              size="small"
              value={pctNewValue}
              onChange={(e) => setPctNewValue(e.target.value)}
              inputProps={{ min: 0.01, max: 100, step: 0.01 }}
              helperText="> 0 and ≤ 100; decimals allowed (e.g., 0.3)"
              autoFocus
            />
            <TextField
              label="Reason for Change"
              size="small"
              value={pctReason}
              onChange={(e) => setPctReason(e.target.value)}
              required
              helperText="Required"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePercentEdit} disabled={pctSaving}>Cancel</Button>
          <Button onClick={confirmPercentEdit} variant="contained" disabled={pctSaving}>
            {pctSaving ? 'Saving…' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeConfirmOpen} onClose={() => setRemoveConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Deduction</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">Are you sure you want to remove this deduction?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            const idx = removeTargetIndex;
            setRemoveConfirmOpen(false);
            setRemoveTargetIndex(null);
            if (idx == null) return;
            const prevForm = JSON.parse(JSON.stringify(formData));
            const target = formData.deductions[idx];
            const nextDeds = formData.deductions.filter((_, i) => i !== idx);
            setFormData({ ...formData, deductions: nextDeds });
            try {
              const entry = target.deductionId ? { deductionId: target.deductionId, remove: true } : { deductionName: target.deductionName, percentage: target.percentage, remove: true };
              const maybe = onUpdate({ deductions: [entry] });
              if (maybe && typeof maybe.then === 'function') await maybe;
              await refreshCI();
              showSnack('Deduction removed.', 'success');
            } catch (e) {
              setFormData(prevForm);
              showSnack('Failed to remove deduction.', 'error');
            }
          }}>Remove</Button>
        </DialogActions>
      </Dialog>

      {/* Add Custom Deduction Dialog */}
      <Dialog open={addCustomOpen} onClose={() => !addingDeduction && setAddCustomOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Custom Deduction</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Custom Name"
              size="small"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              helperText={'Will be saved as CUSTOM_' + (customName || 'NAME')}
            />
            <TextField
              label="Amount (USD)"
              type="number"
              size="small"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
            {/* Charged is enforced to true on add; toggle removed to avoid confusion */}
            <TextField
              label="Reason"
              size="small"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCustomOpen(false)} disabled={addingDeduction}>Cancel</Button>
          <Button onClick={async () => {
            if (!customName.trim()) return;
            const amt = Number(customAmount);
            if (isNaN(amt) || amt <= 0) return;
            if (!customReason.trim()) return;
            const name = `CUSTOM_${customName.trim()}`;
            // optimistic
            const prevForm = JSON.parse(JSON.stringify(formData));
            const amountCents = Math.round(amt * 100);
            setFormData({ ...formData, deductions: [...formData.deductions, { deductionName: name, charged: true, amountDeducted: amountCents }] });
            setAddingDeduction(true);
            try {
              const maybe = onUpdate({ deductions: [{ deductionName: name, amount: amt, charged: true, reason: customReason.trim() }] });
              if (maybe && typeof maybe.then === 'function') await maybe;
              if (historyOpen && ci?._id) {
                try { const resp = await ciService.getAccountingHistory(ci._id); setHistoryItems(resp?.data?.history || []); } catch {}
              }
              showSnack('Custom deduction added.', 'success');
              setAddCustomOpen(false);
              setCustomName(''); setCustomAmount(''); setCustomReason('');
              await refreshCI();
            } catch (err) {
              setFormData(prevForm);
              showSnack(err?.message || 'Failed to add deduction.', 'error');
            } finally {
              setAddingDeduction(false);
            }
          }} variant="contained" disabled={addingDeduction}>
            {addingDeduction ? 'Saving…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add From CI Deduction Dialog */}
      <Dialog open={addFromCiOpen} onClose={() => !addingDeduction && setAddFromCiOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Deduction From Previous CIs (Same Buyer)</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField size="small" label="Search CI#/PO#" value={ciSearch} onChange={(e) => setCiSearch(e.target.value)} />
          </Box>
          {pendingLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={{ height: 420, width: '100%' }}>
              {pendingRows.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No pending deductions found.</Typography>
                </Box>
              ) : (
                <DataGrid
                  rows={(pendingRows || []).map(r => ({ id: r.key, ...r }))}
                  columns={[
                    { field: 'ciNumber', headerName: 'CI#', width: 110 },
                    { field: 'poNumber', headerName: 'PO#', width: 140 },
                    { field: 'deductionName', headerName: 'Deduction Name', flex: 1, minWidth: 200 },
                    {
                      field: 'dispPercentage',
                      headerName: 'Percentage',
                      width: 120,
                      type: 'number',
                      align: 'right',
                      headerAlign: 'right',
                      valueGetter: (params) => Number(params?.row?.dispPercentage ?? params?.row?.percentage ?? 0),
                      renderCell: (params) => {
                        // Prefer payload percentage directly to avoid any intermediate state issues
                        const raw = params?.row?.percentage ?? params?.value;
                        const n = Number(raw ?? 0);
                        // keep up to 2 decimals but drop trailing .00
                        const s = (Math.round(n * 100) / 100).toString();
                        return `${s}%`;
                      }
                    },
                    {
                      field: 'dispAmountDisplay',
                      headerName: 'Amount Deducted',
                      width: 160,
                      type: 'number',
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params) => {
                        const backend = Number(params?.row?.amountDeducted ?? 0);
                        const computed = Number(params?.row?.dispAmountDisplay ?? 0);
                        const v = backend > 0 ? backend : computed;
                        return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                    }
                  ]}
                  checkboxSelection
                  disableRowSelectionOnClick
                  pagination
                  paginationModel={{ page: pendingPage, pageSize: pendingPageSize }}
                  onPaginationModelChange={(m) => { setPendingPage(m.page); setPendingPageSize(m.pageSize); }}
                  pageSizeOptions={[5, 10, 20]}
                  onRowSelectionModelChange={(sel) => setPendingSelectedIds(sel)}
                  rowSelectionModel={pendingSelectedIds}
                  getRowHeight={() => 'auto'}
                />
              )}
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Reason"
              size="small"
              fullWidth
              value={fromReason}
              onChange={(e) => setFromReason(e.target.value)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddFromCiOpen(false); setPendingSelectedIds([]); }} disabled={addingDeduction}>Cancel</Button>
          <Button onClick={async () => {
            const selected = pendingRows.filter(r => pendingSelectedIds.includes(r.key));
            if (selected.length === 0) return;
            if (!fromReason.trim()) return;
            const prevForm = JSON.parse(JSON.stringify(formData));
            // Optimistic: add all selected with current PO-based recomputed amounts
            const optimisticAdds = selected.map(r => ({
              deductionName: `CI#-${r.ciNumber},PO#-${r.poNumber}-${r.deductionName}`,
              percentage: r.percentage,
              charged: true,
              amountDeducted: Math.round(Number(r.amountDeducted) * 100)
            }));
            setFormData({ ...formData, deductions: [...formData.deductions, ...optimisticAdds] });
            setAddingDeduction(true);
            try {
              const payload = { deductions: selected.map(r => ({ deductionName: `CI#-${r.ciNumber},PO#-${r.poNumber}-${r.deductionName}`, percentage: r.percentage, amount: Number(r.amountDeducted), charged: true, reason: fromReason.trim() })) };
              const maybe = onUpdate(payload);
              if (maybe && typeof maybe.then === 'function') await maybe;
              if (historyOpen && ci?._id) {
                try { const resp = await ciService.getAccountingHistory(ci._id); setHistoryItems(resp?.data?.history || []); } catch {}
              }
              showSnack('Selected deductions added.', 'success');
              setAddFromCiOpen(false);
              setPendingSelectedIds([]); setFromReason(''); setCiSearch(''); setPendingPage(0);
              await refreshCI();
            } catch (err) {
              setFormData(prevForm);
              showSnack(err?.message || 'Failed to add deductions.', 'error');
            } finally {
              setAddingDeduction(false);
            }
          }} variant="contained" disabled={addingDeduction}>
            {addingDeduction ? 'Saving…' : 'Add Selected'}
          </Button>
        </DialogActions>
      </Dialog>
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

const HistoryDialog = ({ open, onClose, items, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const formatUser = (u) => u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'Unknown') : 'Unknown';
  const formatWhen = (d) => d ? new Date(d).toLocaleString() : '';

  useEffect(() => {
    if (!open) {
      setPage(0);
      setRowsPerPage(10);
    }
  }, [open]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const total = items?.length || 0;
  const paged = items ? items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Accounting Change History</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (!items || items.length === 0) ? (
          <Typography variant="body2" color="text.secondary">No history found.</Typography>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Changed By</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Field</TableCell>
                    <TableCell>Old → New</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((h, idx) => {
                    const isPct = typeof h.field === 'string' && h.field.includes(':percentage');
                    const prev = isPct ? String(h.previousValue || '').replace('%', '') : h.previousValue;
                    const next = isPct ? String(h.newValue || '').replace('%', '') : h.newValue;
                    const reason = h.reason && String(h.reason).trim() ? ` [${String(h.reason).trim()}]` : '';
                    return (
                      <TableRow key={idx}>
                        <TableCell>{formatWhen(h.changedAt)}</TableCell>
                        <TableCell>{formatUser(h.changedBy)}</TableCell>
                        <TableCell>{h.changedByRole || ''}</TableCell>
                        <TableCell>{h.field}</TableCell>
                        <TableCell>{`${prev} → ${next}${reason}`}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccountingSection;
