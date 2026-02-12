import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import useAutoLogout from './hooks/useAutoLogout';
import Dashboard from './components/Dashboard'; // Admin Dashboard
import MerchantDashboard from './components/MerchantDashboard';
import MerchantRegister from './components/MerchantRegister';
import LandingPage from './components/LandingPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';

// Protected Route Component
const ProtectedRoute = ({ userRole, allowedRole, children }) => {
  if (!userRole) {
    return <Navigate to="/aurum/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'merchant') return <Navigate to="/merchant-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Wrappers to handle navigation logic inside Router context
const LoginWrapper = ({ onLogin }) => {
  const navigate = useNavigate();
  return (
    <Login
      onLogin={onLogin}
      onRegisterClick={() => navigate('/register')}
    />
  );
};

const RegisterWrapper = ({ onRegister }) => {
  const navigate = useNavigate();
  return (
    <MerchantRegister
      onRegister={onRegister}
      onSwitchToLogin={() => navigate('/aurum/login')}
    />
  );
};

function App() {
  const [userRole, setUserRole] = useState(null); // 'admin', 'merchant', 'user' or null
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'user') {
          localStorage.removeItem('user');
          return;
        }
        const role = user.role || (user.plan ? 'merchant' : 'user'); // Fallback if role missing
        handleLogin(role, user);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (role, userData) => {
    setUserRole(role);
    setCurrentUser(userData);
  };
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUserRole(null);
    setCurrentUser(null);
  };

  const handleRegister = (newMerchantData) => {
    // Automatically login after register
    handleLogin('merchant', newMerchantData);
  };

  console.log("current user", currentUser);


  useAutoLogout(handleLogout, 15 * 60 * 1000, !!userRole); // 15 minutes

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route
            path="/aurum/login"
            element={
              !userRole ? (
                <LoginWrapper onLogin={handleLogin} />
              ) : (
                <Navigate
                  to={
                    userRole === 'admin'
                      ? '/admin-dashboard'
                      : userRole === 'merchant'
                        ? '/merchant-dashboard'
                        : '/'
                  }
                  replace
                />
              )
            }
          />

          <Route
            path="/register"
            element={
              !userRole ? (
                <RegisterWrapper onRegister={handleRegister} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute userRole={userRole} allowedRole="admin">
                <Dashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchant-dashboard"
            element={
              <ProtectedRoute userRole={userRole} allowedRole="merchant">
                <MerchantDashboard user={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />



          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
