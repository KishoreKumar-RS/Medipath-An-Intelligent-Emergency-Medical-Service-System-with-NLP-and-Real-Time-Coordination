import React, { useState } from 'react';
import api from '../../api'; 
import '../../styles/Auth.css';

const UserSignup = ({ onSwitchToLogin, onBack }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', contact: '', bloodGroup: '', email: '', password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/Patients/register', {
        name: formData.name,
        age: parseInt(formData.age),
        phoneNumber: formData.contact,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        email: formData.email,
        password: formData.password
      });

      showNotification('success', 'Registration Successful! Redirecting...');
      setTimeout(onSwitchToLogin, 2000); // Wait 2s so user sees the popup

    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Server Error. Try again.";
      showNotification('error', `Registration Failed: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* 🔔 CUSTOM POPUP NOTIFICATION */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: notification.type === 'success' ? '#2ecc71' : '#e74c3c',
          color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)', fontWeight: 'bold', animation: 'fadeIn 0.5s'
        }}>
          {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
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
            <div className="auth-icon">👨‍⚕️</div>
            <h2>Patient Registration</h2>
            <p className="auth-subtitle">Create account with Email & Password</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon"><span className="input-icon">👤</span>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required /></div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon"><span className="input-icon">📧</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required /></div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon"><span className="input-icon">🔒</span>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" minLength="6" required /></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <div className="input-with-icon"><span className="input-icon">📅</span>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-input" required /></div>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div className="input-with-icon"><span className="input-icon">⚧</span>
                <select name="gender" value={formData.gender} onChange={handleChange} className="form-input" style={{paddingLeft:'40px'}} required>
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                </select></div>
              </div>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <div className="input-with-icon"><span className="input-icon">📱</span>
              <input type="tel" name="contact" value={formData.contact} onChange={handleChange} className="form-input" pattern="[0-9]{10}" required /></div>
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <div className="input-with-icon"><span className="input-icon">💉</span>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-input" style={{paddingLeft:'40px'}} required>
                  <option value="">Select Group</option><option value="A+">A+</option><option value="O+">O+</option><option value="B+">B+</option>
              </select></div>
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>{isLoading ? "Creating..." : "Create Account"}</button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <span className="auth-link" onClick={onSwitchToLogin}>Sign In</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSignup;