import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, ArrowBack, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { termService } from '../services/termService';

const emptyForm = { termLabel: '', termDays: '' };

const TermManagement = () => {
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTerm, setDeleteTerm] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await termService.getAllTerms(true);
      setTerms(response.data.terms || []);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to load terms', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTerms(); }, [fetchTerms]);

  const openDialog = (term = null) => {
    setSelectedTerm(term);
    setFormData(term ? { termLabel: term.termLabel, termDays: String(term.termDays) } : emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!submitLoading) setDialogOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!formData.termLabel.trim()) errors.termLabel = 'Term label is required';
    if (!formData.termDays || !Number.isInteger(Number(formData.termDays)) || Number(formData.termDays) < 1) {
      errors.termDays = 'Enter a positive whole number of days';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitLoading(true);
      const payload = { termLabel: formData.termLabel.trim(), termDays: Number(formData.termDays) };
      if (selectedTerm) await termService.updateTerm(selectedTerm._id, payload);
      else await termService.createTerm(payload);
      showSnackbar(`Term ${selectedTerm ? 'updated' : 'created'} successfully`);
      setDialogOpen(false);
      fetchTerms();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to save term', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (term) => {
    try {
      await termService.toggleTermStatus(term._id);
      showSnackbar(`Term ${term.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchTerms();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to update term status', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await termService.deleteTerm(deleteTerm._id);
      showSnackbar('Term deleted successfully');
      setDeleteTerm(null);
      fetchTerms();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to delete term', 'error');
    }
  };

  const columns = [
    { field: 'termLabel', headerName: 'Term Label', flex: 1, minWidth: 220 },
    { field: 'termDays', headerName: 'Term Days', width: 140, valueFormatter: (value) => `${value} days` },
    {
      field: 'isActive', headerName: 'Status', width: 130,
      renderCell: (params) => <Chip label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'default'} size="small" variant={params.value ? 'filled' : 'outlined'} />
    },
    {
      field: 'actions', headerName: 'Actions', width: 180, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" color="primary" onClick={() => openDialog(params.row)} title="Edit Term"><EditIcon fontSize="small" /></IconButton>
          <Button size="small" onClick={() => handleToggleStatus(params.row)}>{params.row.isActive ? 'Deactivate' : 'Activate'}</Button>
          <IconButton size="small" color="error" onClick={() => setDeleteTerm(params.row)} title="Delete Term"><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} variant="contained" color="secondary" size="small" sx={{ mb: 2, fontWeight: 700, letterSpacing: 0.5, borderRadius: 2, boxShadow: 2, textTransform: 'uppercase' }}>Back to Dashboard</Button>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box><Typography variant="h5" component="h1">Terms Management</Typography><Typography variant="body2" color="text.secondary">Create the payment terms available in CI Details → Logistics.</Typography></Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Create Term</Button>
          </Box>
          <Box sx={{ height: 500, width: '100%' }}><DataGrid rows={terms} columns={columns} loading={loading} getRowId={(row) => row._id} pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} disableRowSelectionOnClick /></Box>
        </Paper>
      </Container>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{selectedTerm ? 'Edit Term' : 'Create New Term'}</DialogTitle>
          <DialogContent><Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField autoFocus required fullWidth label="Term Label" value={formData.termLabel} onChange={(e) => setFormData({ ...formData, termLabel: e.target.value })} error={!!formErrors.termLabel} helperText={formErrors.termLabel} placeholder="e.g., Net 30" />
            <TextField required fullWidth label="Term Days" type="number" value={formData.termDays} onChange={(e) => setFormData({ ...formData, termDays: e.target.value })} error={!!formErrors.termDays} helperText={formErrors.termDays} inputProps={{ min: 1, step: 1 }} />
          </Box></DialogContent>
          <DialogActions><Button onClick={closeDialog} disabled={submitLoading}>Cancel</Button><Button type="submit" variant="contained" disabled={submitLoading}>{submitLoading ? 'Saving...' : selectedTerm ? 'Update' : 'Create'}</Button></DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!deleteTerm} onClose={() => setDeleteTerm(null)}>
        <DialogTitle>Delete Term</DialogTitle><DialogContent><DialogContentText>Are you sure you want to delete <strong>{deleteTerm?.termLabel}</strong>? Terms already used by a CI cannot be deleted; deactivate them instead.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setDeleteTerm(null)}>Cancel</Button><Button onClick={handleDelete} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}><Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
};

export default TermManagement;
