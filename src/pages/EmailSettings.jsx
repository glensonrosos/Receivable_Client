import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination
} from '@mui/material';
import { notificationService } from '../services/notificationService';
import { ciService } from '../services/ciService';

const EmailSettings = () => {
  const navigate = useNavigate();
  const [readyCount, setReadyCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const show = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const close = () => setSnackbar(s => ({ ...s, open: false }));

  const fetchReady = async () => {
    try {
      // Query server using the same endpoint dashboard uses to get counts: request with accountingStatus filter and read total
      const res = await ciService.getAllCIs({ page: 1, pageSize: 1, accountingStatus: 'Ready for Collection' });
      setReadyCount(res?.data?.total || 0);
    } catch (e) {
      // ignore
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await notificationService.listLogs(100);
      setLogs(res?.data?.logs || []);
      setPage(0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchReady();
    fetchLogs();
  }, []);

  const handleNotify = async (force = false) => {
    try {
      setLoading(true);
      const res = await notificationService.notifyReady(force);
      show(res?.message || 'Processed');
      fetchLogs();
    } catch (e) {
      show(e?.response?.data?.message || 'Failed to send', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      const res = await notificationService.testEmail();
      show(res?.message || 'Test email sent');
      fetchLogs();
    } catch (e) {
      show(e?.response?.data?.message || 'Failed to send test email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      setLoading(true);
      const res = await notificationService.clearLogs();
      show(res?.message || 'Logs cleared');
      fetchLogs();
    } catch (e) {
      show(e?.response?.data?.message || 'Failed to clear logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Email Settings</Typography>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="contained"
              color="secondary"
              size="small"
              sx={{ fontWeight: 700, letterSpacing: 0.5, borderRadius: 2, boxShadow: 2, textTransform: 'uppercase' }}
            >
              Back to Dashboard
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ready for Collection Count: <strong>{readyCount}</strong>
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="contained" disabled={loading || readyCount === 0} onClick={() => handleNotify(false)}>
              Send Notification
            </Button>
            <Button variant="outlined" disabled={loading} onClick={() => handleNotify(true)}>
              Resend (force)
            </Button>
            <Button variant="outlined" disabled={loading} onClick={handleTest}>
              Send Test Email
            </Button>
            <Button color="error" variant="outlined" disabled={loading} onClick={handleClear}>
              Clear Logs
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Notification Logs</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Ready Count</TableCell>
                <TableCell>Recipients</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0 ? logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : logs).map(l => (
                <TableRow key={l._id}>
                  <TableCell>{l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</TableCell>
                  <TableCell>{l.readyCount}</TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: 420 }}>
                    {Array.isArray(l.recipients) && l.recipients.length > 0 ? l.recipients.join(', ') : '—'}
                  </TableCell>
                  <TableCell>{l.status}</TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: 420 }}>{l.errorDetails || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={logs.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={close} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default EmailSettings;
