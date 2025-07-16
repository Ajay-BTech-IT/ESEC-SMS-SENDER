import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminPage from './Admin/AdminPage';
// import StaffPage from './Staff/StaffPage';
import AdvisorPage from './Advisor/AdvisorPage'; // Import AdvisorPage

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('token') === 'loggedIn'
  );

  const handleLoginSuccess = (userType) => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Default login route */}
        <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />

        {/* Admin route */}
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminPage /> : <Navigate to="/" />}
        />

        {/* Staff route */}
        {/* <Route
          path="/staff"
          element={isAuthenticated ? <StaffPage /> : <Navigate to="/" />}
        /> */}

        {/* Advisor route */}
        <Route
          path="/advisor"
          element={isAuthenticated ? <AdvisorPage /> : <Navigate to="/" />}
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;

