import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  TablePagination
} from '@mui/material';

import { useState, useMemo } from 'react';

const POAmountHistoryDialog = ({ open, onClose, history, currentAmount }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pagedHistory = useMemo(() => {
    if (!history) return [];
    const start = page * rowsPerPage;
    return history.slice(start, start + rowsPerPage);
  }, [history, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Logistics Change History</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current PO Amount:
          </Typography>
          <Typography variant="h6">
            ${(currentAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        {history && history.length > 0 ? (
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Changed By</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedHistory.map((log, index) => (
                    <TableRow key={log._id || index}>
                      <TableCell>
                        {new Date(log.changedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {log.changedBy?.firstName} {log.changedBy?.lastName}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.changedByRole} size="small" />
                      </TableCell>
                      <TableCell>{log.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 20]}
              count={history.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        ) : (
          <Alert severity="info">
            No logistics changes have been recorded yet.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default POAmountHistoryDialog;
