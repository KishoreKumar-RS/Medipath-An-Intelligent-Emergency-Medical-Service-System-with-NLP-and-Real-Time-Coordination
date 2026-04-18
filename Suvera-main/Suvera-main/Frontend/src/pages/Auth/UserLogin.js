import React, { useState } from 'react';
import api from '../../api'; 
import '../../styles/Auth.css';

const UserLogin = ({ onLogin, onSwitchToSignup, onBack }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null); // 🔔 Custom Notification State

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/Patients/login', formData);
      const { message, user } = response.data;
      
      // Save data
      if (user.phone) localStorage.setItem('userPhone', user.phone);
      if (user.email) localStorage.setItem('userEmail', user.email);
      
      // Show Success Popup
      showNotification('success', `Welcome back, ${user.name}!`);
      
      // Delay nav slightly to let user read message
      setTimeout(onLogin, 1500);

    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Invalid credentials";
      showNotification('error', `Login Failed: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* 🔔 NOTIFICATION POPUP */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: notification.type === 'success' ? '#2ecc71' : '#e74c3c',
          color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)', fontWeight: 'bold', animation: 'fadeIn 0.5s'
        }}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}

      <nav className="auth-nav">
        <div className="auth-nav-content">
          <h1>🏥 Emergency Help System</h1>
          <button className="back-button" onClick={onBack}>← Back</button>
        </div>
      </nav>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h2>Patient Login</h2>
            <p className="auth-subtitle">Sign in with Email & Password</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon"><span className="input-icon">📧</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required autoFocus /></div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon"><span className="input-icon">🔑</span>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" required /></div>
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : "🔓 Secure Login"}
            </button>
          </form>

          <div className="auth-footer">
            <p>New user? <span className="auth-link" onClick={onSwitchToSignup}>Create Account</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;