import React, { useState } from 'react';
import api from '../../api'; // Import your API instance
import '../../styles/Auth.css';

const HospitalLogin = ({ onLogin, onSwitchToSignup, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Send Login Request
      const response = await api.post('/Auth/login', {
        email: formData.email,
        password: formData.password
      });

      // 2. ✅ CRITICAL FIX: Save Email & Token to LocalStorage
      // The Dashboard uses this 'hospitalEmail' to fetch the profile data.
      localStorage.setItem('hospitalToken', response.data.token);
      localStorage.setItem('hospitalEmail', formData.email); 

      // 3. Navigate to Dashboard
      onLogin();

    } catch (error) {
      console.error("Login Error:", error);
      alert(error.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <nav className="auth-nav">
        <div className="auth-nav-content">
          <h1>🏥 Emergency Help System</h1>
          <button className="back-button" onClick={onBack}>
            ← Back to Home
          </button>
        </div>
      </nav>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🏥</div>
            <h2>Hospital Login</h2>
            <p className="auth-subtitle">Manage emergency requests & capacity</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Hospital Email ID</label>
              <div className="input-with-icon">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hospital.com"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter secure password"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="auth-btn"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "🔐 Access Dashboard"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              New Healthcare Provider?{' '}
              <span className="auth-link" onClick={onSwitchToSignup}>
                Register Facility
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;