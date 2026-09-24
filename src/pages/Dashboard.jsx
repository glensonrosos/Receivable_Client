import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  InputAdornment,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Logout as LogoutIcon,
  VpnKey as PasswordIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Percent as PercentIcon,
  Add as AddIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { buyerService } from '../services/buyerService';
import { ciService } from '../services/ciService';
import { reportService } from '../services/reportService';
import CreateCIDialog from '../components/ci/CreateCIDialog';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [createCIDialogOpen, setCreateCIDialogOpen] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Phase 7: CI list state
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState([{ field: 'ciNumber', sort: 'desc' }]);
  const [search, setSearch] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [logisticsStatus, setLogisticsStatus] = useState('');
  const [accountingStatus, setAccountingStatus] = useState('');
  // Date range filters
  const [shipDateFrom, setShipDateFrom] = useState(null);
  const [shipDateTo, setShipDateTo] = useState(null);
  const [ciDateFrom, setCiDateFrom] = useState(null);
  const [ciDateTo, setCiDateTo] = useState(null);
  const [uploadDateFrom, setUploadDateFrom] = useState(null);
  const [uploadDateTo, setUploadDateTo] = useState(null);
  // Legend counts for accounting statuses (respect current filters)
  const [legendCounts, setLegendCounts] = useState({
    waiting: 0,
    ready: 0,
    partial: 0,
    none: 0
  });
  const [legendLoading, setLegendLoading] = useState(false);

  useEffect(() => {
    fetchBuyers();
  }, []);

  useEffect(() => {
    fetchCIs();
    fetchLegend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, sortModel, search, buyerId, logisticsStatus, accountingStatus, shipDateFrom, shipDateTo, ciDateFrom, ciDateTo, uploadDateFrom, uploadDateTo]);

  // Auto-refresh every 10 minutes; restarts when dependencies change to use latest filters/sort
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCIs();
      fetchLegend();
    }, 600000); // 10 minutes
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, sortModel, search, buyerId, logisticsStatus, accountingStatus, shipDateFrom, shipDateTo, ciDateFrom, ciDateTo, uploadDateFrom, uploadDateTo]);

  const fetchBuyers = async () => {
    try {
      const response = await buyerService.getAllBuyers();
      setBuyers(response.data.buyers);
    } catch (error) {
      console.error('Failed to load buyers:', error);
    }
  };

  // Fetch legend counts per accounting status with current filters (except accountingStatus itself)
  const fetchLegend = async () => {
    try {
      setLegendLoading(true);
      const statuses = [
        { key: 'waiting', label: 'Waiting to Due', value: 'Waiting to Due' },
        { key: 'ready', label: 'Ready for Collection', value: 'Ready for Collection' },
        { key: 'partial', label: 'Partially Deducted', value: 'Partially Deducted' },
        { key: 'none', label: 'No Deduction', value: 'No Deduction' }
      ];
      const sort = sortModel && sortModel[0] ? sortModel[0] : { field: 'ciNumber', sort: 'desc' };
      const base = {
        page: 1,
        pageSize: 1,
        search: search || '',
        buyerId: buyerId || '',
        logisticsStatus: logisticsStatus || '',
        sortBy: sort.field,
        sortDir: sort.sort === 'asc' ? 'asc' : 'desc'
      };
      const calls = statuses.map(s => ciService.getAllCIs({ ...base, accountingStatus: s.value }));
      const results = await Promise.allSettled(calls);
      const next = { waiting: 0, ready: 0, partial: 0, none: 0 };
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          const total = r.value?.data?.total ?? 0;
          const mapKey = statuses[idx].key;
          next[mapKey] = total;
        }
      });
      setLegendCounts(next);
    } catch (e) {
      // ignore legend errors
    } finally {
      setLegendLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const canCreateCI = user?.role === 'Admin' || user?.role === 'Logistics';

  const handleOpenCreateCI = () => {
    if (!canCreateCI) return;
    setCreateCIDialogOpen(true);
  };

  const handleCloseCreateCI = () => {
    setCreateCIDialogOpen(false);
  };

  const handleCreateCI = async (formData) => {
    try {
      setSubmitLoading(true);
      const response = await ciService.createCI(formData);
      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success'
      });
      handleCloseCreateCI();
      navigate(`/ci/${response.data.ci.ciNumber}`);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create CI',
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Phase 7: fetch CI list
  const fetchCIs = async () => {
    try {
      setLoading(true);
      const sort = sortModel && sortModel[0] ? sortModel[0] : { field: 'ciNumber', sort: 'desc' };
      const fmt = (d) => (d ? new Date(d).toISOString().slice(0,10) : undefined);
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: search || '',
        buyerId: buyerId || '',
        logisticsStatus: logisticsStatus || '',
        accountingStatus: accountingStatus || '',
        shipDateFrom: fmt(shipDateFrom),
        shipDateTo: fmt(shipDateTo),
        ciDateFrom: fmt(ciDateFrom),
        ciDateTo: fmt(ciDateTo),
        uploadDateFrom: fmt(uploadDateFrom),
        uploadDateTo: fmt(uploadDateTo),
        sortBy: sort.field,
        sortDir: sort.sort === 'asc' ? 'asc' : 'desc'
      };
      const res = await ciService.getAllCIs(params);
      const items = res?.data?.items || [];
      const total = res?.data?.total || 0;
      const mapped = items.map(ci => ({
        id: ci._id,
        ciNumber: ci.ciNumber,
        buyerName: ci.buyer?.buyerName || '',
        poNumber: ci.poNumber,
        shipDate: ci.shipDate || null,
        ciDate: ci.ciDate || null,
        uploadDate: ci.uploadDate || null,
        logisticsAmountDue: ci.logisticsAmountDue || 0,
        logisticsStatus: ci.logisticsStatus,
        actualPayment: ci.actualPayment || 0,
        accountingStatus: ci.accountingStatus,
        varianceAmount: ci.varianceAmount || 0,
        dateReceived: ci.dateReceived || null
      }));
      setRows(mapped);
      setRowCount(total);
    } catch (e) {
      // Optional: surface snackbar
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents) => `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Manual refresh
  const handleRefresh = async () => {
    await Promise.allSettled([fetchCIs(), fetchLegend()]);
  };

  // Phase 8: summary totals for current page
  const pageTotals = useMemo(() => {
    let due = 0;
    let paid = 0;
    let varAmt = 0;
    let hasDisplayableVariance = false;
    for (const r of rows) {
      const dueC = Number(r?.logisticsAmountDue || 0);
      const paidC = Number(r?.actualPayment || 0);
      const varC = Number(r?.varianceAmount || 0);
      due += dueC;
      paid += paidC;
      if (paidC !== 0) {
        hasDisplayableVariance = true;
        varAmt += varC;
      }
    }
    return { due, paid, varAmt, hasDisplayableVariance };
  }, [rows]);

  // Helpers: chip colors for statuses
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
      case 'No Deduction':
        return 'error';
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

  // Export XLSX (ALL filtered rows) with header describing active filters
  const [exportingAllXlsx, setExportingAllXlsx] = useState(false);
  const [exportingDeductions, setExportingDeductions] = useState(false);

  const handleExportAllXlsx = async () => {
    try {
      setExportingAllXlsx(true);
      const fmtDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const buyerName = buyers.find(b => b._id === buyerId)?.buyerName || '';
      const sort = sortModel && sortModel[0] ? sortModel[0] : { field: 'ciNumber', sort: 'desc' };

      // Fetch all pages from backend with current filters
      const fmtParam = (d) => (d ? new Date(d).toISOString().slice(0,10) : undefined);
      const baseParams = {
        search: search || '',
        buyerId: buyerId || '',
        logisticsStatus: logisticsStatus || '',
        accountingStatus: accountingStatus || '',
        shipDateFrom: fmtParam(shipDateFrom),
        shipDateTo: fmtParam(shipDateTo),
        ciDateFrom: fmtParam(ciDateFrom),
        ciDateTo: fmtParam(ciDateTo),
        sortBy: sort.field,
        sortDir: sort.sort === 'asc' ? 'asc' : 'desc'
      };
      const pageSize = 500; // batch size for export
      let page = 1;
      let total = Infinity;
      const allItems = [];
      while (allItems.length < total) {
        const res = await ciService.getAllCIs({ ...baseParams, page, pageSize });
        const items = res?.data?.items || [];
        total = res?.data?.total ?? items.length;
        allItems.push(...items);
        if (items.length === 0) break;
        page += 1;
      }

      // Header rows
      const header = [
        ['Filters'],
        ['Search', search || ''],
        ['Buyer', buyerName || 'All Buyers'],
        ['Logistics Status', logisticsStatus || 'All'],
        ['Accounting Status', accountingStatus || 'All'],
        ['Ship Date From', shipDateFrom ? fmtDate(shipDateFrom) : ''],
        ['Ship Date To', shipDateTo ? fmtDate(shipDateTo) : ''],
        ['CI Date From', ciDateFrom ? fmtDate(ciDateFrom) : ''],
        ['CI Date To', ciDateTo ? fmtDate(ciDateTo) : ''],
        ['Upload Date From', uploadDateFrom ? fmtDate(uploadDateFrom) : ''],
        ['Upload Date To', uploadDateTo ? fmtDate(uploadDateTo) : ''],
        ['Sort', `${sort.field} ${sort.sort}`],
        ['Total Exported Rows', `${allItems.length}`],
        [],
      ];

      // Table header
      const tableHeader = [[
        'CI#',
        'Buyer',
        'PO#',
        'Upload Date',
        'Ship Date',
        'CI Date',
        'Amount Due ($)',
        'Logistics Status',
        'Actual Payment ($)',
        'Date Received',
        'Variance Amount ($)',
        'Accounting Status'
      ]];

      // Try ExcelJS (styled); fallback to XLSX only on runtime error
      let usedExcelJs = false;
      try {
        const WorkbookCtor = ExcelJS?.Workbook || (ExcelJS?.default && ExcelJS.default.Workbook) || ExcelJS;
        if (!WorkbookCtor) throw new Error('exceljs Workbook not found');
        usedExcelJs = true;
        const wb = new WorkbookCtor();
        const ws = wb.addWorksheet('CI Page');

          // Build header
          header.forEach((row, idx) => {
            const r = ws.addRow(row);
            if (idx === 0) {
              r.font = { bold: true, size: 12 };
            } else if (row.length === 2 && row[0]) {
              r.getCell(1).font = { bold: true };
            }
          });
          ws.addRow([]); // spacer

          // Table header with styling
          const hdr = ws.addRow(tableHeader[0]);
          hdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          hdr.alignment = { vertical: 'middle', horizontal: 'center' };
          hdr.height = 20;
          hdr.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } }; // MUI primary blue
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFB0BEC5' } },
              left: { style: 'thin', color: { argb: 'FFB0BEC5' } },
              bottom: { style: 'thin', color: { argb: 'FF90A4AE' } },
              right: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            };
          });

          // Column widths
          const colDefs = [
            { key: 'ci', width: 10 },
            { key: 'buyer', width: 24 },
            { key: 'po', width: 18 },
            { key: 'upload', width: 14 },
            { key: 'ship', width: 14 },
            { key: 'ciDate', width: 14 },
            { key: 'due', width: 16 },
            { key: 'logStatus', width: 18 },
            { key: 'paid', width: 18 },
            { key: 'recv', width: 16 },
            { key: 'var', width: 18 },
            { key: 'accStatus', width: 20 },
          ];
          ws.columns = colDefs;

          // Data rows with formats and borders
          const currencyFmt = '$#,##0.00';
          const dateFmt = 'yyyy-mm-dd';
          // Zebra striping + data rows with formats and borders
          let idx = 0;
          let sumDue = 0;
          let sumPaid = 0;
          let sumVar = 0;
          allItems.forEach(ci => {
            const due = Number(ci.logisticsAmountDue || 0) / 100;
            const paid = Number(ci.actualPayment || 0) / 100;
            const variance = (Number(ci.actualPayment || 0) === 0) ? '' : (Number(ci.varianceAmount || 0) / 100);
            const rowVals = [
              ci.ciNumber,
              (ci.buyer?.buyerName) || '',
              ci.poNumber || '',
              ci.uploadDate ? fmtDate(ci.uploadDate) : '',
              ci.shipDate ? fmtDate(ci.shipDate) : '',
              ci.ciDate ? fmtDate(ci.ciDate) : '',
              due,
              ci.logisticsStatus || '',
              paid,
              ci.dateReceived ? fmtDate(ci.dateReceived) : '',
              variance,
              ci.accountingStatus || ''
            ];
            const r = ws.addRow(rowVals);
            // accumulate totals
            sumDue += due;
            sumPaid += paid;
            if (variance !== '') sumVar += Number(variance);
            // number/date formats
            r.getCell(6).numFmt = currencyFmt;
            r.getCell(8).numFmt = currencyFmt;
            if (r.getCell(10).value !== '') r.getCell(10).numFmt = currencyFmt;
            if (r.getCell(4).value) r.getCell(4).numFmt = dateFmt;
            if (r.getCell(5).value) r.getCell(5).numFmt = dateFmt;
            if (r.getCell(9).value) r.getCell(9).numFmt = dateFmt;
            r.eachCell((cell) => {
              cell.border = {
                top: { style: 'hair', color: { argb: 'FFCFD8DC' } },
                left: { style: 'hair', color: { argb: 'FFCFD8DC' } },
                bottom: { style: 'hair', color: { argb: 'FFCFD8DC' } },
                right: { style: 'hair', color: { argb: 'FFCFD8DC' } },
              };
            });
            // zebra striping (every other row)
            if (idx % 2 === 1) {
              r.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
              });
            }
            idx += 1;
          });

          // Totals row
          const totalRow = ws.addRow(['Totals', '', '', '', '', '', sumDue, '', sumPaid, '', sumVar, '']);
          totalRow.font = { bold: true };
          totalRow.getCell(6).numFmt = currencyFmt;
          totalRow.getCell(8).numFmt = currencyFmt;
          totalRow.getCell(10).numFmt = currencyFmt;
          totalRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'medium', color: { argb: 'FF90A4AE' } },
              left: { style: 'thin', color: { argb: 'FFCFD8DC' } },
              bottom: { style: 'thin', color: { argb: 'FFCFD8DC' } },
              right: { style: 'thin', color: { argb: 'FFCFD8DC' } },
            };
          });

          // Validation sheet
          const wsVal = wb.addWorksheet('Validation');
          wsVal.addRow(['Validation']).font = { bold: true, size: 12 };
          wsVal.addRow(['Expected Rows', allItems.length]);
          wsVal.addRow(['Exported Rows', idx]);
          wsVal.addRow(['Pass', allItems.length === idx ? 'YES' : 'NO']);
          wsVal.addRow([]);
          const hdr2 = wsVal.addRow(['Totals Check', 'Amount Due', 'Actual Payment', 'Variance']);
          hdr2.font = { bold: true };
          const r2 = wsVal.addRow(['Computed', sumDue, sumPaid, sumVar]);
          r2.getCell(2).numFmt = currencyFmt;
          r2.getCell(3).numFmt = currencyFmt;
          r2.getCell(4).numFmt = currencyFmt;
          wsVal.columns = [{ width: 22 }, { width: 18 }, { width: 18 }, { width: 18 }];

          // Freeze panes (keep header visible) and add autoFilter
          const headerRowIndex = header.length + 2; // filters + spacer + table header
          ws.views = [{ state: 'frozen', ySplit: headerRowIndex }];
          ws.autoFilter = {
            from: { row: headerRowIndex, column: 1 },
            to: { row: headerRowIndex, column: 11 },
          };

        // Write and download
        const out = await wb.xlsx.writeBuffer();
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ci_export_all.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        // ExcelJS path failed; will use fallback below
      }

      if (!usedExcelJs) {
        const XLSX = (await import('xlsx')).default || (await import('xlsx'));
        // Table rows (map directly from API items)
        const tableRows = allItems.map(ci => [
          ci.ciNumber,
          (ci.buyer?.buyerName) || '',
          ci.poNumber || '',
          ci.shipDate ? fmtDate(ci.shipDate) : '',
          ci.ciDate ? fmtDate(ci.ciDate) : '',
          Number(ci.logisticsAmountDue || 0) / 100,
          ci.logisticsStatus || '',
          Number(ci.actualPayment || 0) / 100,
          ci.dateReceived ? fmtDate(ci.dateReceived) : '',
          (Number(ci.actualPayment || 0) === 0) ? '' : (Number(ci.varianceAmount || 0) / 100),
          ci.accountingStatus || ''
        ]);

        // Append totals row (no styling in xlsx fallback)
        const sumDue = allItems.reduce((acc, ci) => acc + (Number(ci.logisticsAmountDue || 0) / 100), 0);
        const sumPaid = allItems.reduce((acc, ci) => acc + (Number(ci.actualPayment || 0) / 100), 0);
        const sumVar = allItems.reduce((acc, ci) => acc + (Number(ci.actualPayment || 0) === 0 ? 0 : (Number(ci.varianceAmount || 0) / 100)), 0);

        const data = [...header, ...tableHeader, ...tableRows, ['Totals', '', '', '', '', '', sumDue, '', sumPaid, '', sumVar, '']];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [
          { wch: 10 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
          { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 20 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CI Page');
        // Validation sheet (fallback)
        const val = XLSX.utils.aoa_to_sheet([
          ['Validation'],
          ['Expected Rows', allItems.length],
          ['Exported Rows', tableRows.length],
          ['Pass', allItems.length === tableRows.length ? 'YES' : 'NO'],
          [],
          ['Totals Check', 'Amount Due', 'Actual Payment', 'Variance'],
          ['Computed', sumDue, sumPaid, sumVar],
        ]);
        XLSX.utils.book_append_sheet(wb, val, 'Validation');
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ci_export_all.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'XLSX export failed. Please ensure the client has the required package(s): exceljs (recommended) or xlsx. You can install via: npm i exceljs OR npm i xlsx', severity: 'error' });
    } finally {
      setExportingAllXlsx(false);
    }
  };

  const handleExportDeductions = async () => {
    try {
      setExportingDeductions(true);
      const sort = sortModel && sortModel[0] ? sortModel[0] : { field: 'ciNumber', sort: 'desc' };
      const fmt = (d) => (d ? new Date(d).toISOString().slice(0,10) : undefined);
      const params = {
        search: search || '',
        buyerId: buyerId || '',
        logisticsStatus: logisticsStatus || '',
        accountingStatus: accountingStatus || '',
        shipDateFrom: fmt(shipDateFrom),
        shipDateTo: fmt(shipDateTo),
        ciDateFrom: fmt(ciDateFrom),
        ciDateTo: fmt(ciDateTo),
        uploadDateFrom: fmt(uploadDateFrom),
        uploadDateTo: fmt(uploadDateTo),
        sortBy: sort.field,
        sortDir: sort.sort === 'asc' ? 'asc' : 'desc'
      };
      const res = await reportService.exportDeductions(params);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cd = res.headers['content-disposition'] || '';
      const match = cd.match(/filename="?([^";]+)"?/i);
      a.href = url;
      a.download = match ? match[1] : `deductions_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to export report', severity: 'error' });
    } finally {
      setExportingDeductions(false);
    }
  };

  const columns = [
    { field: 'ciNumber', headerName: 'CI#', width: 110, sortable: true },
    { field: 'buyerName', headerName: 'Buyer', flex: 1, minWidth: 200, sortable: false },
    { field: 'poNumber', headerName: 'PO#', flex: 1, minWidth: 180, sortable: true },
    { field: 'uploadDate', headerName: 'Upload Date', width: 150, renderCell: (params = {}) => {
      const v = params?.row?.uploadDate;
      return v ? new Date(v).toLocaleDateString() : '—';
    } },
    { field: 'shipDate', headerName: 'Ship Date', width: 150, renderCell: (params = {}) => {
      const v = params?.row?.shipDate;
      return v ? new Date(v).toLocaleDateString() : '—';
    } },
    { field: 'ciDate', headerName: 'CI Date', width: 150, renderCell: (params = {}) => {
      const v = params?.row?.ciDate;
      return v ? new Date(v).toLocaleDateString() : '—';
    } },
    { field: 'logisticsAmountDue', headerName: 'Amount Due', width: 170, headerAlign: 'right', align: 'right', renderCell: (params = {}) => formatCurrency(params?.row?.logisticsAmountDue) },
    { field: 'logisticsStatus', headerName: 'Logistics Status', width: 170, headerAlign: 'center', align: 'center', renderCell: (params = {}) => (
      <Chip size="small" label={params?.row?.logisticsStatus || ''} color={logisticsChipColor(params?.row?.logisticsStatus)} />
    ) },
    { field: 'accountingStatus', headerName: 'Accounting Status', width: 200, headerAlign: 'center', align: 'center', renderCell: (params = {}) => (
      <Chip size="small" label={params?.row?.accountingStatus || ''} color={accountingChipColor(params?.row?.accountingStatus)} />
    ) },
    { field: 'actualPayment', headerName: 'Actual Payment', width: 170, headerAlign: 'right', align: 'right', renderCell: (params = {}) => formatCurrency(params?.row?.actualPayment) },
    { field: 'dateReceived', headerName: 'Date Received', width: 160, renderCell: (params = {}) => {
      const v = params?.row?.dateReceived;
      return v ? new Date(v).toLocaleDateString() : '—';
    } },
    { field: 'varianceAmount', headerName: 'Variance Amount', width: 170, headerAlign: 'right', align: 'right', renderCell: (params = {}) => {
      const actual = Number(params?.row?.actualPayment || 0);
      if (actual === 0) return '—';
      const val = Number(params?.row?.varianceAmount || 0);
      const color = val < 0 ? 'error.main' : 'success.main';
      return (
        <Typography sx={{ fontWeight: 700, color }}>
          {formatCurrency(val)}
        </Typography>
      );
    } },
    
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Container maxWidth="xl">
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ReceiptIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" component="h1">
                  Account Receivable Monitoring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Welcome back, {user?.firstName} {user?.lastName}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {canCreateCI && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateCI}
                >
                  Create CI
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PasswordIcon />}
                onClick={handleChangePassword}
              >
                Change Password
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Box>

          {user?.role === 'Admin' && (
            <Box sx={{ mb: 3 }}>
              <Accordion defaultExpanded={false} sx={{ bgcolor: 'warning.50' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Admin Quick Actions</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<PeopleIcon />}
                      onClick={() => navigate('/admin/users')}
                    >
                      User Management
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<BusinessIcon />}
                      onClick={() => navigate('/admin/buyers')}
                    >
                      Buyer Management
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PercentIcon />}
                      onClick={() => navigate('/admin/deductions')}
                    >
                      Deduction Management
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<DashboardIcon />}
                      onClick={() => navigate('/admin/email-settings')}
                    >
                      Email Settings
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          <Grid container spacing={3}></Grid>

          {/* Removed "Commercial Invoices" header box to save vertical space */}

          <Paper sx={{ p: 3, mt: 2 }}>
            {/* Legend Bar */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Legend:</Typography>
              <Chip label={`Waiting to Due: ${legendCounts.waiting}`} color="default" variant="outlined" />
              <Chip
                label={`Ready for Collection: ${legendCounts.ready}`}
                color={'info'}
                variant={legendCounts.ready > 0 ? 'filled' : 'outlined'}
                sx={{
                  ...(legendCounts.ready > 0 ? { fontWeight: 700, boxShadow: 2 } : {}),
                  cursor: 'pointer'
                }}
                onClick={() => {
                  // Toggle filter: if already filtered to Ready for Collection, clear it; else set it
                  setAccountingStatus(prev => (prev === 'Ready for Collection' ? '' : 'Ready for Collection'));
                  setPaginationModel(pm => ({ ...pm, page: 0 }));
                }}
              />
              <Chip label={`Partially Deducted: ${legendCounts.partial}`} color="warning" variant="outlined" />
              <Chip label={`No Deduction: ${legendCounts.none}`} color="error" variant="outlined" />
              {legendLoading && <Typography variant="caption" color="text.secondary">Updating…</Typography>}
              <Box sx={{ ml: 'auto' }}>
                <Tooltip title="Refresh (auto every 10 min)">
                  <span>
                    <Button onClick={handleRefresh} color="success" variant='contained' size="small" disabled={loading} startIcon={<RefreshIcon fontSize="small" />}> 
                      Refresh
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'flex-end' }}>
              <TextField
                size="small"
                placeholder="Search CI#, Buyer, PO#"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
                sx={{ minWidth: 260 }}
              />
              <TextField
                size="small"
                select
                label="Buyer"
                value={buyerId}
                onChange={(e) => { setBuyerId(e.target.value); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">All Buyers</MenuItem>
                {buyers.map(b => (
                  <MenuItem key={b._id} value={b._id}>{b.buyerName}</MenuItem>
                ))}
              </TextField>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 600 }}>Ship Date</Typography>
                    <DatePicker
                      label="From"
                      value={shipDateFrom}
                      onChange={(v) => { setShipDateFrom(v); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 138 } } }}
                    />
                    <Typography variant="body2" color="text.secondary">to</Typography>
                    <DatePicker
                      label="To"
                      value={shipDateTo}
                      onChange={(v) => { setShipDateTo(v); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 138 } } }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 600 }}>CI Date</Typography>
                    <DatePicker
                      label="From"
                      value={ciDateFrom}
                      onChange={(v) => { setCiDateFrom(v); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 138 } } }}
                    />
                    <Typography variant="body2" color="text.secondary">to</Typography>
                    <DatePicker
                      label="To"
                      value={ciDateTo}
                      onChange={(v) => { setCiDateTo(v); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 138 } } }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 600 }}>Upload Date</Typography>
                    <DatePicker
                      label="From"
                      value={uploadDateFrom}
                      onChange={(v) => { setUploadDateFrom(v); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 138 } } }}
                    />
                    <Typography variant="body2" color="text.secondary">to</Typography>
                    <DatePicker
                      label="To"
                      value={uploadDateTo}
                      onChange={(v) => { setUploadDateTo(v); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 138 } } }}
                    />
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setShipDateFrom(null);
                      setShipDateTo(null);
                      setCiDateFrom(null);
                      setCiDateTo(null);
                      setUploadDateFrom(null);
                      setUploadDateTo(null);
                      setPaginationModel(pm => ({ ...pm, page: 0 }));
                    }}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Clear Dates
                  </Button>
                </Box>
              </LocalizationProvider>
              <TextField
                size="small"
                select
                label="Logistics Status"
                value={logisticsStatus}
                onChange={(e) => { setLogisticsStatus(e.target.value); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="ON-HOLD">ON-HOLD</MenuItem>
                <MenuItem value="CANCEL">CANCEL</MenuItem>
                <MenuItem value="DONE">DONE</MenuItem>
              </TextField>
              <TextField
                size="small"
                select
                label="Accounting Status"
                value={accountingStatus}
                onChange={(e) => { setAccountingStatus(e.target.value); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Waiting to Due">Waiting to Due</MenuItem>
                <MenuItem value="Ready for Collection">Ready for Collection</MenuItem>
                <MenuItem value="Partially Deducted">Partially Deducted</MenuItem>
                <MenuItem value="No Deduction">No Deduction</MenuItem>
                <MenuItem value="CLOSED">CLOSED</MenuItem>
              </TextField>
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleExportAllXlsx}
                  disabled={exportingAllXlsx || exportingDeductions}
                  startIcon={exportingAllXlsx ? <CircularProgress size={16} /> : null}
                >
                  {exportingAllXlsx ? 'Preparing…' : 'Export XLSX (All)'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ ml: 1 }}
                  startIcon={exportingDeductions ? <CircularProgress size={16} /> : <DownloadIcon />}
                  onClick={handleExportDeductions}
                  disabled={exportingAllXlsx || exportingDeductions}
                >
                  {exportingDeductions ? 'Exporting…' : 'Export Deductions'}
                </Button>
              </Box>
            </Box>

            <div style={{ width: '100%' }}>
              <DataGrid
                autoHeight
                rows={rows}
                columns={columns}
                rowCount={rowCount}
                pagination
                paginationMode="server"
                sortingMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={(model) => setPaginationModel(model)}
                pageSizeOptions={[10, 25, 50, 100]}
                sortingOrder={['desc', 'asc']}
                sortModel={sortModel}
                onSortModelChange={(m) => { setSortModel(m); setPaginationModel(pm => ({ ...pm, page: 0 })); }}
                loading={loading}
                disableRowSelectionOnClick
                onRowDoubleClick={(params) => navigate(`/ci/${params.row.ciNumber}`)}
                getRowId={(row) => row.id}
                density="compact"
                getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd')}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'grey.100'
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600
                  },
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: 'grey.50'
                  },
                  '& .even': {
                    bgcolor: 'grey.50'
                  }
                }}
              />
            </div>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
              <Typography variant="body2"><strong>Rows:</strong> {rows.length}</Typography>
              <Typography variant="body2"><strong>Amount Due (page):</strong> {formatCurrency(pageTotals.due)}</Typography>
              <Typography variant="body2"><strong>Actual Payment (page):</strong> {formatCurrency(pageTotals.paid)}</Typography>
              <Typography variant="body2">
                <strong>Variance (page):</strong> {pageTotals.hasDisplayableVariance ? (
                  <>{formatCurrency(pageTotals.varAmt)}</>
                ) : (
                  '—'
                )}
              </Typography>
            </Box>
          </Paper>
        </Paper>

        <CreateCIDialog
          open={createCIDialogOpen}
          onClose={handleCloseCreateCI}
          onSubmit={handleCreateCI}
          buyers={buyers}
          loading={submitLoading}
        />

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
      </Container>
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          © Glenson_Encode {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
