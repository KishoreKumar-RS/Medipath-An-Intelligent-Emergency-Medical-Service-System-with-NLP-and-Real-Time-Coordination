// src/pages/Auth/HospitalSignup.js
import React, { useState } from 'react';
import api from '../../api'; // Import the API connection
import '../../styles/Auth.css';

const HospitalSignup = ({ onSwitchToLogin, onBack }) => {
  const [formData, setFormData] = useState({
    hospitalName: '',
    address: '',
    email: '',
    contact: '',
    licenceNumber: '', 
    password: '',
    confirmPassword: '',
    latitude: '',  
    longitude: ''  
  });

  const [isLoading, setIsLoading] = useState(false);

  // ✅ FIX: Added the missing state variable for the location loading spinner
  const [locating, setLocating] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

   // Get Current Location Function
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setLocating(true); // Now this works because the state is defined above
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLocating(false);
        alert("📍 Location captured successfully!");
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve location. Please enter manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Password Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // 2. Location Validation
    if (!formData.latitude || !formData.longitude) {
      alert("Please capture the hospital location (Auto-Detect or Enter Manually).");
      return;
    }

    setIsLoading(true);

    // 3. Prepare Data for Backend
    const payload = {
      name: formData.hospitalName,
      address: formData.address,
      phoneNumber: formData.contact,
      licenceNumber: formData.licenceNumber,
      email: formData.email,
      password: formData.password,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    };

    try {
      // 4. Send Data to C#
      const response = await api.post('/Auth/register', payload);
      
      console.log("Registration Success:", response.data);
      alert("Registration Successful! Please Login.");
      
      // 5. Redirect to Login Page
      onSwitchToLogin();

    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.response?.data?.message || "Registration failed. Please check your connection.");
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
            <h2>Hospital Registration</h2>
            <p className="auth-subtitle">Join our healthcare network</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Hospital Name */}
            <div className="form-group">
              <label htmlFor="hospitalName">🏥 Hospital Name</label>
              <input
                type="text"
                id="hospitalName"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="Enter hospital name"
                className="form-input"
                required
              />
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">📍 Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full hospital address"
                className="form-input"
                required
              />
            </div>

            {/* Location Section */}
            <div className="form-group" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <label style={{fontWeight:'bold'}}>🌍 Hospital Geolocation (For Map)</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input type="number" step="any" placeholder="Latitude" name="latitude" value={formData.latitude} onChange={handleChange} className="form-input" required />
                    <input type="number" step="any" placeholder="Longitude" name="longitude" value={formData.longitude} onChange={handleChange} className="form-input" required />
                </div>
                <button type="button" onClick={handleGetLocation} className="auth-btn" style={{ marginTop: '10px', background: '#27ae60' }}>
                    {locating ? "📍 Locating..." : "📍 Auto-Detect My Location"}
                </button>
            </div>

            {/* Email & Contact */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">📧 Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hospital@email.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact">📞 Contact Number</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Hospital contact number"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* License Number */}
            <div className="form-group">
              <label htmlFor="licenceNumber">📄 License Number</label>
              <input
                type="text"
                id="licenceNumber"
                name="licenceNumber"
                value={formData.licenceNumber}
                onChange={handleChange}
                placeholder="e.g. LIC-12345"
                className="form-input"
                required
              />
            </div>

            {/* Passwords */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">🔒 Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">✅ Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Registering..." : "🏥 Register Hospital"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already registered?{' '}
              <span className="auth-link" onClick={onSwitchToLogin}>
                Hospital Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSignup;