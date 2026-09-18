import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Chip,
  Stack,
  Slide
} from '@mui/material';
import {
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ciService } from '../services/ciService';
import LogisticsSection from '../components/ci/LogisticsSection';
import AccountingSection from '../components/ci/AccountingSection';
import POAmountHistoryDialog from '../components/ci/POAmountHistoryDialog';

const CIDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ci, setCI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [poAmountHistory, setPOAmountHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchCI();
  }, [id]);

  // If user is on Accounting tab and Logistics status is no longer DONE, push back to Logistics tab
  useEffect(() => {
    if (tabValue === 1 && ci && ci.logisticsStatus !== 'DONE') {
      setTabValue(0);
    }
  }, [tabValue, ci]);

  const fetchCI = async () => {
    try {
      setLoading(true);
      const response = await ciService.getCIById(id);
      setCI(response.data.ci);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load CI details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLogistics = async (logisticsData) => {
    try {
      // Use MongoDB _id for updates
      const response = await ciService.updateLogistics(ci._id, logisticsData);
      setCI(response.data.ci);
      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update logistics',
        severity: 'error'
      });
    }
  };

  const handleViewHistory = async () => {
    try {
      // Use MongoDB _id for fetching history
      const response = await ciService.getPOAmountHistory(ci._id);
      setPOAmountHistory(response.data.history);
      setHistoryDialogOpen(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load PO amount history',
        severity: 'error'
      });
    }
  };

  const handleInitializeAccounting = async () => {
    try {
      const response = await ciService.initializeAccounting(ci._id);
      setCI(response.data.ci);
      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to initialize accounting',
        severity: 'error'
      });
    }
  };

  const handleUpdateAccounting = async (accountingData) => {
    try {
      const response = await ciService.updateAccounting(ci._id, accountingData);
      setCI(response.data.ci);
      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update accounting',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const canEditLogistics = user?.role === 'Admin' || user?.role === 'Logistics';
  const canEditAccounting = user?.role === 'Admin' || user?.role === 'Accounting';
  const logisticsDone = ci?.logisticsStatus === 'DONE';
  const canEditAccountingEffective = canEditAccounting && logisticsDone;
  const isAccountingInitialized = ci?.accountingPoAmount > 0;

  const logisticsChipColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'info';
      case 'ON-HOLD':
        return 'warning';
      case 'CANCEL':
        return 'error';
      case 'DONE':
        return 'success';
      default:
        return 'default';
    }
  };

  const accountingChipColor = (status) => {
    switch (status) {
      case 'CLOSED':
        return 'success';
      case 'ON-HOLD':
        return 'warning';
      case 'Ready for Collection':
        return 'info';
      case 'Partially Deducted':
        return 'warning';
      case 'Waiting to Due':
        return 'default';
      default:
        return 'default';
    }
  };

  // Auto-initialize Accounting once Logistics is DONE and accounting not yet initialized
  useEffect(() => {
    if (ci && ci.logisticsStatus === 'DONE' && !isAccountingInitialized) {
      handleInitializeAccounting();
    }
  }, [ci, isAccountingInitialized]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error">{error}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

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

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="h1">
              Commercial Invoice #{ci?.ciNumber}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">Logistics</Typography>
              <Chip size="small" label={ci?.logisticsStatus || ''} color={logisticsChipColor(ci?.logisticsStatus)} />
              <Typography variant="caption" color="text.secondary">Accounting</Typography>
              <Chip
                size="small"
                label={(ci && ci.logisticsStatus !== 'DONE') ? 'ON-HOLD' : (ci?.accountingStatus || '')}
                color={accountingChipColor((ci && ci.logisticsStatus !== 'DONE') ? 'ON-HOLD' : (ci?.accountingStatus))}
              />
            </Stack>
          </Box>

          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Buyer</Typography>
                <Typography variant="body1" fontWeight="bold">{ci?.buyer?.buyerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PO Number</Typography>
                <Typography variant="body1" fontWeight="bold">{ci?.poNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created By</Typography>
                <Typography variant="body1" fontWeight="bold">{ci?.createdBy?.firstName} {ci?.createdBy?.lastName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created At</Typography>
                <Typography variant="body1" fontWeight="bold">{ci?.createdAt ? new Date(ci.createdAt).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              // Prevent navigating to Accounting unless Logistics is DONE
              if (newValue === 1 && !(ci && ci.logisticsStatus === 'DONE')) return;
              setTabValue(newValue);
            }}
            variant="fullWidth"
            textColor="secondary"
            indicatorColor="secondary"
            TabIndicatorProps={{ sx: { height: 4, bgcolor: 'secondary.main', borderRadius: 2 } }}
            sx={{
              '& .MuiTabs-flexContainer': { justifyContent: 'center' },
              '& .MuiTab-root': { color: 'text.secondary', fontWeight: 500 },
              '& .MuiTab-root.Mui-selected': { color: 'secondary.main', fontWeight: 700 },
              '& .MuiTab-root.Mui-disabled': { opacity: 0.5 }
            }}
          >
            <Tab label="Logistics" />
            <Tab label="Accounting" disabled={!(ci && ci.logisticsStatus === 'DONE')} />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <LogisticsSection
            ci={ci}
            onUpdate={handleUpdateLogistics}
            canEdit={canEditLogistics}
            isAdmin={user?.role === 'Admin'}
            onViewHistory={handleViewHistory}
          />
        )}

        {tabValue === 1 && (
          <AccountingSection
            ci={ci}
            onInitialize={handleInitializeAccounting}
            onUpdate={handleUpdateAccounting}
            canEdit={canEditAccountingEffective}
            isInitialized={isAccountingInitialized}
          />
        )}

        <POAmountHistoryDialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          history={poAmountHistory}
          currentAmount={ci?.poAmount || 0}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={(props) => <Slide {...props} direction="up" />}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default CIDetail;
