import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Admin Dashboard
import MerchantDashboard from './components/MerchantDashboard';
import MerchantRegister from './components/MerchantRegister';

import UserDashboard from './components/UserDashboard';

// Protected Route Component
const ProtectedRoute = ({ userRole, allowedRole, children }) => {
  if (!userRole) {
    return <Navigate to="/" replace />;
  }
  // Allow if role matches OR if allowedRole is array/generic (simplified here)
  if (allowedRole && userRole !== allowedRole) {
    // If user tries to access merchant/admin, redirect to their home
    if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'merchant') return <Navigate to="/merchant-dashboard" replace />;
    if (userRole === 'user') return <Navigate to="/user-dashboard" replace />;
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
      onSwitchToLogin={() => navigate('/')}
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
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              !userRole ? (
                <LoginWrapper onLogin={handleLogin} />
              ) : (
                <Navigate
                  to={
                    userRole === 'admin' ? '/admin-dashboard' :
                      userRole === 'merchant' ? '/merchant-dashboard' : '/user-dashboard'
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

          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute userRole={userRole} allowedRole="user">
                <UserDashboard user={currentUser} onLogout={handleLogout} />
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
