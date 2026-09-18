import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Grid
} from '@mui/material';
import BackgroundBible from '../assets/image5.png';
import { Visibility, VisibilityOff, Login as LoginIcon, LockOutlined as LockIcon } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 }
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} sx={{ minHeight: { md: 640 }, alignItems: 'stretch' }}>
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                height: '100%',
                minHeight: { xs: 240, md: 640 },
                borderRadius: { xs: 2, md: 2 },
                bgcolor: 'grey.200',
                backgroundImage: {
                  xs: `linear-gradient(
                    rgba(0,0,0,0.35),
                    rgba(0,0,0,0.35)
                  ), url(${BackgroundBible})`
                },
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                maxWidth: 460,
                mx: 'auto'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 3,
                  mb: 1.5
                }}>
                  <LockIcon />
                </Box>
                <Typography variant="h6" component="h6" gutterBottom sx={{ fontWeight: 500, letterSpacing: 1 }}>
                  ACCOUNT RECEIVABLE MONITORING
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sign in to continue
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  autoFocus
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<LoginIcon />}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              <Typography variant="caption" color="text.secondary" display="block" align="center" sx={{ mt: 2 }}>
                © Glenson_Encode {new Date().getFullYear()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;
