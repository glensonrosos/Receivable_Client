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
  VpnKey as ResetPasswordIcon,
  ArrowBack,
  PersonOff,
  PersonAdd
} from '@mui/icons-material';
import { userService } from '../services/userService';
import UserDialog from '../components/users/UserDialog';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToReset, setUserToReset] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      showSnackbar('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmailNotif = async (user) => {
    try {
      await userService.toggleEmailNotifications(user._id);
      showSnackbar(`Email notifications ${user.emailNotificationsEnabled ? 'disabled' : 'enabled'} for ${user.firstName}`);
      fetchUsers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to update email notification setting',
        'error'
      );
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

  const handleOpenDialog = (user = null) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      if (selectedUser) {
        await userService.updateUser(selectedUser._id, formData);
        showSnackbar('User updated successfully');
      } else {
        await userService.createUser(formData);
        showSnackbar('User created successfully');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Operation failed',
        'error'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await userService.deleteUser(userToDelete._id);
      showSnackbar('User deleted successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to delete user',
        'error'
      );
    }
  };

  const handleResetPasswordClick = (user) => {
    setUserToReset(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    try {
      const response = await userService.resetPassword(userToReset._id);
      showSnackbar(response.message);
      setResetPasswordDialogOpen(false);
      setUserToReset(null);
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to reset password',
        'error'
      );
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user._id);
      showSnackbar(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to update user status',
        'error'
      );
    }
  };

  const columns = [
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'Admin'
              ? 'error'
              : params.value === 'Logistics'
              ? 'primary'
              : 'success'
          }
          size="small"
        />
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
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
      field: 'emailNotificationsEnabled',
      headerName: 'Email Notifications',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Enabled' : 'Disabled'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
          onClick={() => handleToggleEmailNotif(params.row)}
          sx={{ cursor: 'pointer' }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            title="Edit User"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="warning"
            onClick={() => handleResetPasswordClick(params.row)}
            title="Reset Password"
          >
            <ResetPasswordIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={params.row.isActive ? 'default' : 'success'}
            onClick={() => handleToggleStatus(params.row)}
            title={params.row.isActive ? 'Deactivate' : 'Activate'}
          >
            {params.row.isActive ? <PersonOff fontSize="small" /> : <PersonAdd fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete User"
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
              User Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create User
            </Button>
          </Box>

          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={users}
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

      <UserDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        user={selectedUser}
        loading={submitLoading}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
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

      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset the password for <strong>{userToReset?.firstName} {userToReset?.lastName}</strong>?
            <br /><br />
            The password will be reset to: <strong>peba@1234</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetPasswordConfirm} color="warning" variant="contained">
            Reset Password
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

export default UserManagement;
