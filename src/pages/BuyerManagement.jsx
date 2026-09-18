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
  Business,
  Block
} from '@mui/icons-material';
import { buyerService } from '../services/buyerService';
import BuyerDialog from '../components/buyers/BuyerDialog';

const BuyerManagement = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await buyerService.getAllBuyers();
      setBuyers(response.data.buyers);
    } catch (error) {
      showSnackbar('Failed to load buyers', 'error');
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

  const handleOpenDialog = (buyer = null) => {
    setSelectedBuyer(buyer);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBuyer(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      if (selectedBuyer) {
        await buyerService.updateBuyer(selectedBuyer._id, formData);
        showSnackbar('Buyer updated successfully');
      } else {
        await buyerService.createBuyer(formData);
        showSnackbar('Buyer created successfully');
      }
      handleCloseDialog();
      fetchBuyers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Operation failed',
        'error'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (buyer) => {
    setBuyerToDelete(buyer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await buyerService.deleteBuyer(buyerToDelete._id);
      showSnackbar('Buyer deleted successfully');
      setDeleteDialogOpen(false);
      setBuyerToDelete(null);
      fetchBuyers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to delete buyer',
        'error'
      );
    }
  };

  const handleToggleStatus = async (buyer) => {
    try {
      await buyerService.toggleBuyerStatus(buyer._id);
      showSnackbar(`Buyer ${buyer.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchBuyers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to update buyer status',
        'error'
      );
    }
  };

  const columns = [
    {
      field: 'buyerName',
      headerName: 'Buyer Name',
      flex: 1,
      minWidth: 200
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
            title="Edit Buyer"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={params.row.isActive ? 'default' : 'success'}
            onClick={() => handleToggleStatus(params.row)}
            title={params.row.isActive ? 'Deactivate' : 'Activate'}
          >
            {params.row.isActive ? <Block fontSize="small" /> : <Business fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete Buyer"
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
              Buyer Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Buyer
            </Button>
          </Box>

          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={buyers}
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

      <BuyerDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        buyer={selectedBuyer}
        loading={submitLoading}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Buyer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete buyer <strong>{buyerToDelete?.buyerName}</strong>?
            <br /><br />
            Note: You cannot delete a buyer that has associated deductions.
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

export default BuyerManagement;
