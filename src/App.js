import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Admin Dashboard
import MerchantDashboard from './components/MerchantDashboard';
import MerchantRegister from './components/MerchantRegister';

function App() {
  const [userRole, setUserRole] = useState(null); // 'admin', 'merchant' or null (not logged in)
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = (role, userData) => {
    setUserRole(role);
    setCurrentUser(userData);
    setIsRegistering(false);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
  };

  const handleRegister = (newMerchantData) => {
    // Automatically login after register
    handleLogin('merchant', newMerchantData);
  };

  // View Routing Logic
  if (userRole === 'admin') {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (userRole === 'merchant') {
    return <MerchantDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (isRegistering) {
    return (
      <div className="app-container">
        <MerchantRegister
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsRegistering(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Login
        onLogin={handleLogin}
        onRegisterClick={() => setIsRegistering(true)}
      />
    </div>
  );
}

export default App;
