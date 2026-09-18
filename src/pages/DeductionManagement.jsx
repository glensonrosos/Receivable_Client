import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { deductionService } from '../services/deductionService';
import { buyerService } from '../services/buyerService';
import DeductionDialog from '../components/deductions/DeductionDialog';

const DeductionManagement = () => {
  const navigate = useNavigate();
  const [deductions, setDeductions] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deductionToDelete, setDeductionToDelete] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deductionsResponse, buyersResponse] = await Promise.all([
        deductionService.getAllDeductions(),
        buyerService.getAllBuyers()
      ]);
      setDeductions(deductionsResponse.data.deductions);
      setBuyers(buyersResponse.data.buyers);
    } catch (error) {
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (deduction = null) => {
    setSelectedDeduction(deduction);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDeduction(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      if (selectedDeduction) {
        await deductionService.updateDeduction(selectedDeduction._id, formData);
        showSnackbar('Deduction updated successfully');
      } else {
        await deductionService.createDeduction(formData);
        showSnackbar('Deduction created successfully');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Operation failed',
        'error'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (deduction) => {
    setDeductionToDelete(deduction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deductionService.deleteDeduction(deductionToDelete._id);
      showSnackbar('Deduction deleted successfully');
      setDeleteDialogOpen(false);
      setDeductionToDelete(null);
      fetchData();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to delete deduction',
        'error'
      );
    }
  };

  const handleToggleStatus = async (deduction) => {
    try {
      await deductionService.toggleDeductionStatus(deduction._id);
      showSnackbar(`Deduction ${deduction.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to update deduction status',
        'error'
      );
    }
  };

  const columns = [
    {
      field: 'deductionName',
      headerName: 'Deduction Name',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'percentage',
      headerName: 'Percentage',
      width: 120,
      renderCell: (params) => `${params.value}%`
    },
    {
      field: 'buyers',
      headerName: 'Buyers',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value || params.value.length === 0) {
          return 'N/A';
        }
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
            {params.value.map((buyer, index) => (
              <Chip
                key={buyer._id || index}
                label={buyer.buyerName}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            title="Edit Deduction"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={params.row.isActive ? 'default' : 'success'}
            onClick={() => handleToggleStatus(params.row)}
            title={params.row.isActive ? 'Deactivate' : 'Activate'}
          >
            {params.row.isActive ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete Deduction"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          variant="contained"
          color="secondary"
          size="small"
          sx={{ mb: 2, fontWeight: 700, letterSpacing: 0.5, borderRadius: 2, boxShadow: 2, textTransform: 'uppercase' }}
        >
          Back to Dashboard
        </Button>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              Deduction Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Deduction
            </Button>
          </Box>

          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={deductions}
              columns={columns}
              loading={loading}
              getRowId={(row) => row._id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 }
                }
              }}
              disableRowSelectionOnClick
            />
          </Box>
        </Paper>
      </Container>

      <DeductionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        deduction={selectedDeduction}
        buyers={buyers}
        loading={submitLoading}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Deduction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete deduction <strong>{deductionToDelete?.deductionName}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeductionManagement;
