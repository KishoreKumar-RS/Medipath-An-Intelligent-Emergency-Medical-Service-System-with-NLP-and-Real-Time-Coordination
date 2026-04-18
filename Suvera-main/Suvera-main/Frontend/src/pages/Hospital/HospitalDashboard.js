import React, { useState, useEffect } from 'react';
import api from '../../api'; // Ensure this points to your Axios instance
import '../../styles/Dashboard.css';

/* =========================================================================================
   MAIN PARENT COMPONENT
   ========================================================================================= */
const HospitalDashboard = ({ onLogout }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false); // Controls Header Dropdown

  // --- STATE: Hospital Profile Data (Fetched from DB) ---
  const [hospitalProfile, setHospitalProfile] = useState({
      name: "Loading...",
      address: "...",
      email: "...",
      phone: "...",
      licence: "..."
  });

  // --- GLOBAL STATE: ACTIVITY LOGS ---
  // This state is shared. Children (Doctors, Facilities) push logs here.
  const [activityLogs, setActivityLogs] = useState([]);

  // --- LIFTED STATE: BED STATS ---
  const [bedStats, setBedStats] = useState({
    totalBeds: 150,
    occupiedBeds: 105
  });

  // --- 1. INITIAL FETCH: Get Hospital Details By Email ---
  useEffect(() => {
      const fetchProfile = async () => {
          try {
              // 1. Get the email saved during Login (HospitalLogin.js must save this)
              const email = localStorage.getItem('hospitalEmail'); 

              if (!email) {
                  // Fallback if no email found in storage
                  setHospitalProfile(prev => ({...prev, name: "Admin (No Email Found)"}));
                  return;
              }
              
              // 2. Call the NEW Backend Endpoint
              const response = await api.get(`/Hospitals/by-email/${email}`); 
              
              if(response.data) {
                  const data = response.data;
                  setHospitalProfile({
                      name: data.name,
                      address: data.address,
                      email: data.email,
                      phone: data.phoneNumber,
                      licence: data.licenceNumber
                  });
              }
          } catch (error) {
              console.error("Failed to load profile", error);
              setHospitalProfile(prev => ({...prev, name: "Profile Load Error"}));
          }
      };
      fetchProfile();
  }, []);

  // --- FUNCTION: ADD ACTIVITY LOG ---
  const logActivity = (type, details, status) => {
    const newLog = {
        id: Date.now(),
        type: type,
        details: details,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: status
    };
    // Keep the most recent 20 logs
    setActivityLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  // --- FUNCTION: UPDATE BEDS ---
  const handleBedUpdate = (newTotal, newOccupied) => {
    setBedStats({
      totalBeds: parseInt(newTotal) || 0,
      occupiedBeds: parseInt(newOccupied) || 0
    });
    logActivity('Capacity', `Bed Capacity Updated: ${newTotal - newOccupied} Available`, 'Updated');
  };

  const menuItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Hospital overview & stats' },
    { key: 'emergency', icon: '🚨', label: 'Emergency Requests', description: 'Live Triage & Alerts' },
    { key: 'doctors', icon: '👨‍⚕️', label: 'Doctors', description: 'Staff management directory' },
    { key: 'facilities', icon: '🏗️', label: 'Facilities', description: 'Resource status & availability' },
    { key: 'beds', icon: '🛏️', label: 'Bed Capacity', description: 'Occupancy planning' },
  ];

  const renderModule = () => {
    switch(activeModule) {
      case 'doctors':
        return <DoctorManagement logActivity={logActivity} />;
      case 'facilities':
        return <FacilityManagement logActivity={logActivity} />;
      case 'beds':
        return <BedManagement currentStats={bedStats} onUpdate={handleBedUpdate} />;
      case 'emergency':
        return <EmergencyRequests logActivity={logActivity} />;
      default:
        return <HospitalDashboardHome stats={bedStats} logs={activityLogs} onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="dashboard-container" onClick={() => setShowProfile(false)}>
      
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🏥</div>
          <div className="app-name">Admin Portal</div>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button 
              key={item.key}
              className={`nav-item ${activeModule === item.key ? 'active' : ''}`}
              onClick={(e) => {
                  e.stopPropagation();
                  setActiveModule(item.key);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <div className="nav-text">
                <span className="nav-label">{item.label}</span>
                <span className="nav-desc">{item.description}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content-area">
        <header className="top-header">
          <div className="header-greeting">
            <h1>{menuItems.find(item => item.key === activeModule)?.label || 'Dashboard'}</h1>
            <p>{menuItems.find(item => item.key === activeModule)?.description}</p>
          </div>
          
          <div className="header-actions">
            <button className="notif-btn">🔔</button>
            
            {/* --- CLICKABLE PROFILE AVATAR --- */}
            <div 
                className="user-avatar" 
                style={{cursor: 'pointer', border: showProfile ? '2px solid #4f46e5' : 'none', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center'}}
                onClick={(e) => {
                    e.stopPropagation(); 
                    setShowProfile(!showProfile);
                }}
            >
                {hospitalProfile.name ? hospitalProfile.name.charAt(0) : 'H'}
            </div>

            {/* --- DROPDOWN PROFILE --- */}
            {showProfile && (
                <div className="profile-dropdown" onClick={(e) => e.stopPropagation()} style={{
                    position: 'absolute', top: '70px', right: '20px', 
                    background: 'white', padding: '25px', borderRadius: '15px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)', width: '340px', 
                    zIndex: 1000, border: '1px solid #e5e7eb',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}>
                    <div style={{textAlign: 'center', marginBottom:'15px'}}>
                        <div style={{fontSize:'3.5rem', marginBottom:'10px'}}>🏥</div>
                        <h3 style={{margin:'0 0 5px 0', color:'#1f2937', fontSize:'1.2rem', fontWeight:'700'}}>{hospitalProfile.name}</h3>
                        <span style={{background:'#dcfce7', color:'#166534', padding:'4px 12px', borderRadius:'15px', fontSize:'0.75rem', fontWeight:'bold', letterSpacing:'0.5px'}}>● ONLINE & ACTIVE</span>
                    </div>
                    
                    <div style={{textAlign: 'left', fontSize:'0.9rem', color:'#4b5563', borderTop:'1px solid #f3f4f6', paddingTop:'15px'}}>
                        <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
                             <strong style={{color:'#111'}}>Licence No:</strong> 
                             <span>{hospitalProfile.licence}</span>
                        </div>
                        <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
                             <strong style={{color:'#111'}}>Admin Email:</strong> 
                             <span style={{fontSize:'0.85rem'}}>{hospitalProfile.email}</span>
                        </div>
                        <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
                             <strong style={{color:'#111'}}>Contact:</strong> 
                             <span>{hospitalProfile.phone}</span>
                        </div>
                        <div style={{marginTop:'10px'}}>
                             <strong style={{color:'#111', display:'block', marginBottom:'2px'}}>Address:</strong> 
                             <span style={{fontSize:'0.85rem', lineHeight:'1.4'}}>{hospitalProfile.address}</span>
                        </div>
                    </div>

                    <button 
                        onClick={onLogout}
                        style={{
                            width: '100%', marginTop:'20px', padding:'12px', 
                            background: '#ef4444', color:'white', border:'none', 
                            borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                            boxShadow:'0 4px 10px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            )}
          </div>
        </header>

        <div className="content-scrollable">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

/* =========================================================================================
   MODULE 1: DASHBOARD HOME (With Full Real-Time Activity Log)
   ========================================================================================= */
const HospitalDashboardHome = ({ stats, logs, onNavigate }) => {
  const available = stats.totalBeds - stats.occupiedBeds;
  const percentage = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;

  return (
    <div className="dashboard-home">
      <div className="stats-container">
        
        {/* Total Beds */}
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#4f46e5' }}>{stats.totalBeds}</div>
          <div className="stat-label">Total Beds</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
            {percentage}% Occupancy Rate
          </div>
        </div>

        {/* Available Beds */}
        <div className="stat-card">
          <div className="stat-value" style={{ color: available < 10 ? '#ef4444' : '#22c55e' }}>{available}</div>
          <div className="stat-label">Available Beds</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
            Current Capacity Status
          </div>
        </div>

        {/* Emergency Requests */}
        <div 
            className="stat-card" 
            onClick={() => onNavigate('emergency')}
            style={{ cursor: 'pointer', border: '2px solid #ef4444', background: '#fff5f5' }}
        >
          <div className="stat-value" style={{ color: '#ef4444' }}>🚨</div>
          <div className="stat-label">Emergency Requests</div>
          <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '5px' }}>
            Click to View Pending Alerts
          </div>
        </div>
      </div>

      {/* ✅ REAL-TIME RECENT ACTIVITY TABLE */}
      <div className="card standard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems:'center' }}>
          <div>
            <h3>📋 Recent Activity Log</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'#666'}}>Real-time updates of hospital operations</p>
          </div>
          <button style={{ background: '#eef2ff', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold', padding:'8px 15px', borderRadius:'6px' }}>Live View ●</button>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop:'10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0', background:'#f8fafc' }}>
              <th style={{ padding: '15px' }}>Category</th>
              <th style={{ padding: '15px' }}>Action Details</th>
              <th style={{ padding: '15px' }}>Time</th>
              <th style={{ padding: '15px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
                <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontStyle:'italic' }}>
                        No recent activity recorded in this session.
                    </td>
                </tr>
            ) : (
                logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', animation: 'fadeIn 0.5s' }}>
                        <td style={{ padding: '15px', fontWeight: '600', color: '#374151', display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{fontSize:'1.2rem'}}>{log.type === 'Emergency' ? '🚨' : log.type === 'Facility' ? '🏗️' : log.type === 'Staff' ? '👨‍⚕️' : '🛏️'}</span>
                            {log.type}
                        </td>
                        <td style={{ padding: '15px', color: '#4b5563', fontWeight:'500' }}>{log.details}</td>
                        <td style={{ padding: '15px', color: '#6b7280', fontSize: '0.9rem' }}>{log.time}</td>
                        <td style={{ padding: '15px' }}>
                            <span style={{ 
                                background: 
                                    log.status === 'Accepted' || log.status === 'Active' || log.status === 'Completed' || log.status === 'Success' || log.status === 'Updated' ? '#dcfce7' : 
                                    log.status === 'Declined' || log.status === 'Closed' || log.status === 'Deleted' ? '#fee2e2' : '#dbeafe',
                                color: 
                                    log.status === 'Accepted' || log.status === 'Active' || log.status === 'Completed' || log.status === 'Success' || log.status === 'Updated' ? '#166534' : 
                                    log.status === 'Declined' || log.status === 'Closed' || log.status === 'Deleted' ? '#991b1b' : '#1e40af',
                                padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing:'0.5px'
                            }}>
                                {log.status}
                            </span>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* =========================================================================================
   MODULE 2: DOCTOR MANAGEMENT
   ========================================================================================= */
const DoctorManagement = ({ logActivity }) => {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [doctorForm, setDoctorForm] = useState({
    name: '', 
    specialization: '', 
    contactNumber: '', 
    licenceNumber: ''
  });

  useEffect(() => { 
      fetchDoctors(); 
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/Doctors');
      setDoctors(response.data);
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleInputChange = (e) => {
      setDoctorForm({ ...doctorForm, [e.target.name]: e.target.value });
  };

  const handleEdit = (doctor) => {
    setEditingId(doctor.doctorId);
    setDoctorForm({
      name: doctor.name,
      specialization: doctor.specialization,
      contactNumber: doctor.phoneNumber,
      licenceNumber: doctor.licenceNumber
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      name: doctorForm.name,
      specialization: doctorForm.specialization,
      licenceNumber: doctorForm.licenceNumber,
      phoneNumber: doctorForm.contactNumber
    };

    try {
      if (editingId) {
        // Edit existing
        await api.put(`/Doctors/${editingId}`, payload);
        logActivity('Staff', `Updated profile: Dr. ${doctorForm.name}`, 'Updated');
      } else {
        // Create new
        await api.post('/Doctors', payload);
        logActivity('Staff', `New Registration: Dr. ${doctorForm.name}`, 'Success');
      }
      // Reset Form
      setDoctorForm({ name: '', specialization: '', contactNumber: '', licenceNumber: '' });
      setEditingId(null);
      setShowForm(false);
      fetchDoctors();
    } catch (error) { 
        alert("Operation failed. Check inputs."); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this doctor?")) return;
    try { 
        await api.delete(`/Doctors/${id}`); 
        logActivity('Staff', 'Doctor profile deleted from registry', 'Deleted');
        fetchDoctors(); 
    } catch(e) {
        alert("Error deleting doctor.");
    }
  };

  return (
    <div className="card standard-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <h3>👨‍⚕️ Doctor Management Directory</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'#666'}}>Manage on-call and permanent medical staff.</p>
        </div>
        <button className="ai-analyze-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close Form' : '+ Add New Doctor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '25px', borderRadius: '10px', marginBottom: '25px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px rgba(0,0,0,0.02)' }}>
            <h4 style={{marginTop:0, marginBottom:'20px', color:'#1e293b'}}>{editingId ? 'Edit Doctor Profile' : 'Register New Medical Staff'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'5px', display:'block'}}>Full Name</label>
                    <input name="name" value={doctorForm.name} onChange={handleInputChange} placeholder="Dr. Firstname Lastname" className="ai-input" required />
                </div>
                <div>
                    <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'5px', display:'block'}}>Specialization</label>
                    <input name="specialization" value={doctorForm.specialization} onChange={handleInputChange} placeholder="e.g. Cardiology, Neurology" className="ai-input" required />
                </div>
                <div>
                    <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'5px', display:'block'}}>Licence Number</label>
                    <input name="licenceNumber" value={doctorForm.licenceNumber} onChange={handleInputChange} placeholder="LIC-XXXXX" className="ai-input" required />
                </div>
                <div>
                    <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'5px', display:'block'}}>Contact</label>
                    <input name="contactNumber" value={doctorForm.contactNumber} onChange={handleInputChange} placeholder="Mobile / Landline" className="ai-input" required />
                </div>
            </div>
            <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                 <button type="submit" className="ai-analyze-btn" style={{ flex:1 }}>
                    {isLoading ? 'Saving to Database...' : 'Save Record'}
                 </button>
                 <button type="button" onClick={() => setShowForm(false)} style={{background:'white', border:'1px solid #ccc', borderRadius:'8px', padding:'10px 20px', cursor:'pointer', fontWeight:'600'}}>Cancel</button>
            </div>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0', background:'#f8fafc' }}>
                <th style={{ padding: '12px' }}>Doctor Name</th>
                <th style={{ padding: '12px' }}>Specialization</th>
                <th style={{ padding: '12px' }}>Licence ID</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
        </thead>
        <tbody>
            {doctors.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:'30px', color:'#999'}}>No doctors available in directory.</td></tr> : 
            doctors.map(d => (
                <tr key={d.doctorId} style={{ borderBottom: '1px solid #f1f5f9', transition:'0.2s' }}>
                    <td style={{ padding: '12px', fontWeight: '500', color:'#111' }}>{d.name}</td>
                    <td style={{ padding: '12px' }}><span style={{background:'#eef2ff', color:'#4f46e5', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem'}}>{d.specialization}</span></td>
                    <td style={{ padding: '12px', fontSize:'0.9rem', color:'#555' }}>{d.licenceNumber}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => handleEdit(d)} style={{ marginRight: '10px', border:'1px solid #dbeafe', background:'#eff6ff', color:'#2563eb', padding:'6px 12px', borderRadius:'6px', cursor:'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(d.doctorId)} style={{ border:'1px solid #fee2e2', background:'#fef2f2', color:'#dc2626', padding:'6px 12px', borderRadius:'6px', cursor:'pointer' }}>Delete</button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

/* =========================================================================================
   MODULE 3: FACILITY MANAGEMENT (Status Toggle & Logs)
   ========================================================================================= */
const FacilityManagement = ({ logActivity }) => {
  const [facilities, setFacilities] = useState([]);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchFacilities(); }, []);

  const fetchFacilities = async () => {
    try {
      const response = await api.get('/Facilities');
      setFacilities(response.data);
    } catch (error) { console.error(error); }
  };

  const toggleAvailability = async (f) => {
    const originalState = [...facilities];
    const newStatus = !f.availability;

    // 1. Optimistic Update UI
    const updatedFacilities = facilities.map(fac => 
      fac.facilityId === f.facilityId ? { ...fac, availability: newStatus } : fac
    );
    setFacilities(updatedFacilities);

    // 2. LOG THE CHANGE
    // Specific requirements: Show 0 availability if closed.
    const statusText = newStatus ? "OPEN (Active)" : "CLOSED (Availability: 0)";
    logActivity("Facility", `${f.facilityName} is now ${statusText}`, newStatus ? "Active" : "Closed");

    try {
      // 3. API Call
      await api.put(`/Facilities/${f.facilityId}`, {
        facilityName: f.facilityName,
        availability: newStatus 
      });
    } catch (error) {
      setFacilities(originalState); // Revert on fail
      alert("Failed to update status. Server error.");
    }
  };

  const handleAddFacility = async (e) => {
    e.preventDefault();
    if (!newFacilityName.trim()) return;
    setIsLoading(true);
    try {
      await api.post('/Facilities', { facilityName: newFacilityName, availability: true });
      logActivity("Facility", `Added new facility: ${newFacilityName}`, "Created");
      setNewFacilityName('');
      fetchFacilities();
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Permanently delete facility?")) return;
    try { 
        await api.delete(`/Facilities/${id}`); 
        logActivity("Facility", "Facility removed from directory", "Deleted");
        fetchFacilities(); 
    } catch(e){}
  };

  return (
    <div className="card standard-card">
      <div style={{ marginBottom: '25px' }}>
        <h3>🏗️ Facility Status Control</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Control which departments are "Active" for the AI matching algorithm.
            <br/>If you toggle a switch <b>OFF</b>, it is recorded as availability 0, and the AI will stop routing critical patients to that department.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', padding:'20px', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
        <input 
            value={newFacilityName} 
            onChange={(e) => setNewFacilityName(e.target.value)} 
            placeholder="Add new facility (e.g. ICU, MRI, Blood Bank)..." 
            className="ai-input" 
            style={{ flex: 1 }} 
        />
        <button onClick={handleAddFacility} disabled={isLoading} className="ai-analyze-btn" style={{width:'150px'}}>
            {isLoading ? 'Adding...' : '+ Add Facility'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {facilities.map(f => (
          <div key={f.facilityId} style={{ 
              padding: '20px', borderRadius: '12px', border: '1px solid',
              borderColor: f.availability ? '#86efac' : '#fca5a5',
              background: f.availability ? '#f0fdf4' : '#fef2f2',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.03)', transition:'all 0.3s ease'
            }}>
            <div>
              <div style={{ fontWeight: '700', fontSize:'1.1rem', color:'#111' }}>{f.facilityName}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: f.availability ? '#16a34a' : '#dc2626', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px' }}>
                 <span style={{fontSize:'1.2rem'}}>{f.availability ? '●' : '○'}</span>
                 {f.availability ? 'ACTIVE' : 'CLOSED (0)'}
              </div>
            </div>
            
            <div style={{ display:'flex', gap:'15px', alignItems:'center'}}>
                {/* Custom CSS Toggle Switch */}
                <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px' }}>
                    <input type="checkbox" checked={f.availability} onChange={() => toggleAvailability(f)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: f.availability ? '#22c55e' : '#cbd5e1', 
                        transition: '.4s', borderRadius: '34px', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.2)' 
                    }}>
                        <span style={{ 
                            position: 'absolute', content: "", height: '22px', width: '22px', left: '3px', bottom: '3px', 
                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%', 
                            transform: f.availability ? 'translateX(24px)' : 'translateX(0)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' 
                        }}></span>
                    </span>
                </label>
                
                <button 
                    onClick={() => handleDelete(f.facilityId)} 
                    style={{ border:'none', background:'#fff', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', fontSize:'1.2rem', color:'#dc2626', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    &times;
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================================
   MODULE 4: BED MANAGEMENT (Updated UI & Logging)
   ========================================================================================= */
const BedManagement = ({ currentStats, onUpdate }) => {
  const [total, setTotal] = useState(currentStats.totalBeds);
  const [occupied, setOccupied] = useState(currentStats.occupiedBeds);

  const handleSave = () => {
    if (parseInt(occupied) > parseInt(total)) {
      alert("Occupied beds cannot be greater than Total beds!");
      return;
    }
    onUpdate(total, occupied);
    alert("Bed capacity updated successfully!");
  };

  return (
    <div className="card standard-card">
      <h3>🛏️ Bed Capacity Management</h3>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '30px' }}>
        Update total capacity and current occupancy manually. This helps emergency services determine load.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '800px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color:'#333' }}>Total Bed Capacity</label>
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="ai-input" style={{ width: '100%', fontSize:'1.2rem', fontWeight:'bold' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color:'#333' }}>Currently Occupied</label>
          <input type="number" value={occupied} onChange={(e) => setOccupied(e.target.value)} className="ai-input" style={{ width: '100%', fontSize:'1.2rem', fontWeight:'bold' }} />
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '30px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0', maxWidth: '800px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
            <div style={{color:'#64748b', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'5px'}}>Live Calculation</div>
            <div style={{fontSize:'1.4rem', fontWeight:'bold', color:'#333'}}>Remaining Availability</div>
        </div>
        
        <span style={{ 
            fontWeight: '900', fontSize: '2.5rem', 
            color: (total - occupied) > 10 ? '#22c55e' : (total - occupied) > 0 ? '#f59e0b' : '#ef4444' 
        }}>
            {total - occupied} <span style={{fontSize:'1rem', fontWeight:'500', color:'#666'}}>BEDS</span>
        </span>
      </div>

      <button onClick={handleSave} className="ai-analyze-btn" style={{ marginTop: '30px', padding: '15px 40px', width:'250px', fontSize:'1rem' }}>
          Update System Status
      </button>
    </div>
  );
};

/* =========================================================================================
   MODULE 5: EMERGENCY REQUESTS (Forum Feature)
   ========================================================================================= */
const EmergencyRequests = ({ logActivity }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // POLLING MECHANISM
    useEffect(() => {
        // Retrieve ID via email logic or hardcode for demo. In future: id from profile state
        const HOSPITAL_ID = 2; 

        const fetchRequests = async () => {
            try {
                const res = await api.get(`/Requests/hospital/${HOSPITAL_ID}`);
                setRequests(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Polling Error", error);
            }
        };

        fetchRequests(); // First load
        const interval = setInterval(fetchRequests, 5000); // Check every 5s

        return () => clearInterval(interval);
    }, []);

    const handleAction = async (requestId, status, reqDetails) => {
        try {
            await api.post(`/Requests/update-status/${requestId}`, JSON.stringify(status), {
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Remove locally
            setRequests(prev => prev.filter(r => r.requestId !== requestId));
            
            // Log it
            logActivity("Emergency", `Patient ${reqDetails.patientName} was ${status}`, status);
            alert(`Request marked as ${status}`);
        } catch (error) {
            alert("Error updating request status.");
        }
    };

    return (
        <div className="card standard-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h3>🚨 Incoming Emergency Requests (Forum)</h3>
                    <p style={{marginBottom:'20px', color:'#666'}}>Real-time alerts from the patient mobile app requiring admission.</p>
                </div>
                <div style={{background:'#eef2ff', color:'#4f46e5', padding:'8px 15px', borderRadius:'25px', fontSize:'0.85rem', fontWeight:'bold', border:'1px solid #c7d2fe', display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={{display:'block', width:'10px', height:'10px', background:'#4f46e5', borderRadius:'50%', animation:'pulse 2s infinite'}}></span>
                    Live Monitoring Active
                </div>
            </div>

            {loading ? <div style={{padding:'40px', textAlign:'center', color:'#888'}}>🔄 Scanning network for signals...</div> : 
             requests.length === 0 ? (
                <div style={{textAlign:'center', padding:'60px', background:'#f8f9fa', borderRadius:'12px', border:'2px dashed #e5e7eb', marginTop:'20px'}}>
                    <div style={{fontSize:'4rem', opacity:0.2, marginBottom:'10px'}}>✅</div>
                    <h4 style={{color:'#374151', margin:0}}>No Pending Emergencies</h4>
                    <p style={{color:'#9ca3af', fontSize:'0.95rem', marginTop:'10px'}}>Your queue is clear. Stand by for alerts.</p>
                </div>
            ) : (
                <div style={{display:'grid', gap:'20px', marginTop:'20px'}}>
                    {requests.map(req => (
                        <div key={req.requestId} style={{
                            borderLeft:'6px solid #dc3545', background:'#fff5f5', padding:'25px', 
                            borderRadius:'12px', display:'flex', justifyContent:'space-between', alignItems:'center',
                            boxShadow:'0 4px 15px rgba(220, 53, 69, 0.1)', animation:'fadeIn 0.5s'
                        }}>
                            <div style={{maxWidth:'60%'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px'}}>
                                    <span style={{background:'#dc3545', color:'white', padding:'4px 10px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'bold', letterSpacing:'1px'}}>CRITICAL PRIORITY</span>
                                    <span style={{fontSize:'0.85rem', color:'#666'}}>ID: #{req.requestId}</span>
                                </div>
                                <h4 style={{margin:0, color:'#111', fontSize:'1.4rem'}}>PATIENT: {req.patientName || "Emergency User"}</h4>
                                <p style={{margin:'10px 0', fontWeight:'700', fontSize:'1.1rem', color:'#b91c1c'}}>Condition: {req.symptomDescription}</p>
                                <div style={{fontSize:'1rem', color:'#374151', display:'flex', gap:'20px', alignItems:'center'}}>
                                    <span>📞 <strong>{req.contactNumber}</strong></span>
                                    <span style={{color:'#9ca3af'}}>|</span>
                                    <span style={{fontSize:'0.9rem'}}>Time: {new Date(req.requestTime).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            
                            <div style={{display:'flex', gap:'15px', flexDirection:'column', width:'200px'}}>
                                <button 
                                    onClick={() => handleAction(req.requestId, 'Accepted', req)}
                                    style={{
                                        background:'#16a34a', color:'white', border:'none',
                                        padding:'15px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold',
                                        boxShadow:'0 4px 10px rgba(22, 163, 74, 0.25)', transition:'transform 0.2s', fontSize:'1rem'
                                    }}
                                >
                                    ✅ ACCEPT ADMIT
                                </button>
                                <button 
                                    onClick={() => handleAction(req.requestId, 'Declined', req)}
                                    style={{
                                        background:'#fff', color:'#dc2626', border:'2px solid #dc2626',
                                        padding:'12px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold',
                                        transition:'all 0.2s', fontSize:'0.9rem'
                                    }}
                                >
                                    ❌ DECLINE (FULL)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HospitalDashboard;