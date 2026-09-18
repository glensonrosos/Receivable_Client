import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagement';
import BuyerManagement from './pages/BuyerManagement';
import DeductionManagement from './pages/DeductionManagement';
import CIDetail from './pages/CIDetail';
import EmailSettings from './pages/EmailSettings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/buyers"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <BuyerManagement />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/deductions"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DeductionManagement />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/email-settings"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <EmailSettings />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ci/:id"
            element={
              <ProtectedRoute>
                <CIDetail />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
