import React, { useState, useRef, useEffect } from 'react';
import api from '../../api'; // ✅ Import API instance
import NearbyHospitals from "./NearbyHospitals";
import EmergencyMap from "./EmergencyMap"; // ✅ Import Emergency Map
import '../../styles/Dashboard.css';
import '../../styles/Chatbot.css'; 

/* =========================================================================================
   INTERNAL HELPER: NOTIFICATION BANNER
   Replaces window.alert() with a nice UI popup inside the dashboard.
   ======================================================================================== */
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;

    const styles = {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.95rem',
        fontWeight: '600',
        animation: 'slideDown 0.3s ease-out'
    };

    return (
        <div style={styles}>
            <span>{type === 'success' ? '✅' : '⚠️'}</span>
            <span>{message}</span>
            <button 
                onClick={onClose} 
                style={{
                    background: 'transparent', 
                    border: 'none', 
                    color: 'white', 
                    marginLeft: '15px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}
            >
                ✕
            </button>
        </div>
    );
};

/* =========================================================================================
   MODULE 1: MEDICAL CHATBOT COMPONENT
   Fully functional AI chat interface connected to Groq API.
   ========================================================================================= */
const MedicalChatbot = () => {
    const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY; 
    
    // Chat State Management
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: "Hello! I am Suvera - your Personal Doc. <br> How can I help you today?", 
            sender: 'bot', 
            isHtml: true 
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Auto-scroll Reference
    const chatBoxRef = useRef(null);

    // Effect: Scroll to bottom whenever messages change
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Function: Handle Send Message
    const handleSend = async (textOverride = null) => {
        const text = textOverride || input.trim();
        if (!text) return;

        // 1. Add User Message to Chat
        const userMsg = { id: Date.now(), text: text, sender: 'user', isHtml: false };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        const lowerInput = text.toLowerCase();
        
        // 2. Simple heuristic for basic greetings
        if (lowerInput === "hi" || lowerInput === "hello") {
            setTimeout(() => {
                addBotMessage("Hello! Please describe your symptoms in detail so I can assist you.");
                setIsLoading(false);
            }, 600);
            return;
        }

        try {
            // 3. Call AI API
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { 
                            role: "system", 
                            content: `You are Suvera, an expert Medical AI Assistant. 
                            1. ANALYZE symptoms carefully.
                            2. IF CRITICAL (Heart attack, Stroke, TB, Severe Burns): Start with "⚠️ **CRITICAL WARNING**" and advise immediate doctor visit.
                            3. Use HTML tags like <b> or <br> for formatting if needed.
                            4. Keep it concise.`
                        },
                        { role: "user", content: text }
                    ]
                })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error?.message || "API Error");

            const aiText = data.choices[0].message.content;
            
            // 4. Format Response (Convert Markdown/Bold to HTML)
            const formattedText = formatResponse(aiText);
            const isCritical = aiText.includes("CRITICAL") || aiText.includes("WARNING");
            
            // 5. Add Bot Message to Chat
            addBotMessage(formattedText, isCritical);

        } catch (error) {
            console.error(error);
            addBotMessage(`❌ Connection Error: Unable to reach AI server.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Add Bot Message
    const addBotMessage = (text, isCritical = false) => {
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            text: text, 
            sender: 'bot', 
            isHtml: true,
            isCritical: isCritical
        }]);
    };

    // Helper: Format HTML Response
    const formatResponse = (text) => {
        let cleanText = text.replace(/\n/g, "<br>");
        cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); 
        
        // Highlights for specific keywords
        cleanText = cleanText.replace(/Condition:/gi, "<strong>🏥 Condition:</strong>");
        cleanText = cleanText.replace(/Home Remed/gi, "<br><strong>💊 Home Remedy</strong>");
        cleanText = cleanText.replace(/Do:/g, "<br><strong>✅ Do:</strong>");
        cleanText = cleanText.replace(/Avoid:/g, "<br><strong>❌ Avoid:</strong>");
        
        if (text.includes("CRITICAL") || text.includes("WARNING")) {
            return `<div class="warning-box">${cleanText}</div>`;
        }
        return cleanText;
    };

    return (
        <div className="content-card" style={{ height: 'calc(100vh - 120px)', padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <div className="chatbot-container">
                <div className="chat-header">
                    <div className="bot-avatar-circle">🩺</div>
                    <div className="header-info">
                        <h3>Suvera</h3>
                        <p><span className="online-dot"></span> AI Health Assistant</p>
                    </div>
                </div>
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}-message ${msg.isCritical ? 'critical-msg' : ''}`}>
                            {msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : msg.text}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot-message typing-indicator">
                            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                        </div>
                    )}
                </div>
                
                {/* Quick Action Chips */}
                <div className="quick-actions">
                    <div className="chip" onClick={() => handleSend('I have a bad headache')}>🤕 Headache</div>
                    <div className="chip" onClick={() => handleSend('I burned my hand')}>🔥 Burn</div>
                    <div className="chip" onClick={() => handleSend('Stomach pain')}>🤢 Stomach</div>
                </div>

                <div className="chat-input-area">
                    <input 
                        type="text" 
                        placeholder="Type symptoms here..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={() => handleSend()}>➡️</button>
                </div>
            </div>
        </div>
    );
};

/* =========================================================================================
   MODULE 2: DASHBOARD HOME (LIVE AREA STATUS REMOVED)
   Shows Quick actions and AI symptom analyzer
   ========================================================================================= */
const DashboardHome = ({ onNavigate, onTriggerEmergency, setNotification }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);

  // LOGIC TO CALL PYTHON API FOR ANALYSIS
  const handleAnalyze = async () => {
    // 1. Validation
    if (!input.trim()) {
        setInputError(true);
        setNotification({ type: 'error', message: 'Please describe your symptoms.' });
        setTimeout(() => setInputError(false), 2000);
        return;
    }
    
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append("text", input); 

        // 2. Call the Python AI Engine
        const response = await fetch("http://127.0.0.1:8000/analyze-text/", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("AI Server Error");
        const data = await response.json();
        
        // 3. Notify Success
        setNotification({ type: 'success', message: 'Analysis Complete. Redirecting to Map...' });
        
        // 4. Pass the analysis data (Department, Severity) to the Parent Component to switch views
        setTimeout(() => {
            onTriggerEmergency(data.analysis);
        }, 1000);

    } catch (error) {
        console.error(error);
        setNotification({ type: 'error', message: 'AI Service Unavailable. Try manual search.' });
        setInputError(true);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="dashboard-home fade-in">
      
      {/* HERO SECTION WITH AI ANALYZER */}
      <section className="dashboard-hero">
        <div className="hero-content-left">
          <h2><span className="wave">👋</span> How can Suvera help you?</h2>
          <p className="hero-subtitle">AI-powered symptom analysis & specialist matching.</p>
          
          <div className="ai-input-wrapper" style={{ border: inputError ? '2px solid #ef4444' : 'none' }}>
            <span className="ai-icon">🧠</span>
            <input 
                type="text" 
                placeholder={inputError ? "Please type a symptom..." : "Describe symptoms (e.g. chest pain, fever)..."} 
                className="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button 
                className="ai-analyze-btn" 
                onClick={handleAnalyze} 
                disabled={loading}
            >
                {loading ? 'Thinking...' : 'Analyze'}
            </button>
          </div>

          <div className="quick-tags">
            <span>Try:</span>
            <button className="tag" onClick={() => setInput("Stomach ache")}>Stomach ache</button>
            <button className="tag" onClick={() => setInput("Trauma from accident")}>Trauma</button>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="pulse-ring"></div>
          <div className="pulse-icon">🏥</div>
        </div>
      </section>

      {/* QUICK ACTIONS GRID */}
      <section className="action-grid">
        <div className="card emergency-card" onClick={() => onNavigate('emergency')}>
          <div className="card-icon-bg">🚨</div>
          <div className="card-text">
            <h3>Emergency SOS</h3>
            <p>Critical Case Bypass & Map</p>
            <span className="link-arrow">Get Help Now &rarr;</span>
          </div>
        </div>

        <div className="card standard-card" onClick={() => onNavigate('nearby')}>
          <div className="card-icon-bg" style={{ color: '#3498db', background: '#eaf2f8' }}>📍</div>
          <div className="card-text">
            <h3>Nearby Hospitals</h3>
            <p>View General Locations</p>
          </div>
        </div>

        <div className="card standard-card" onClick={() => onNavigate('chatbot')}>
          <div className="card-icon-bg" style={{ color: '#9b59b6', background: '#f5eef8' }}>💬</div>
          <div className="card-text">
            <h3>Medical Assistant</h3>
            <p>Chat with AI Doctor</p>
          </div>
        </div>
      </section>

      {/* 🛑 DELETED: "stats-section" (Live Area Status) has been removed completely */}

    </div>
  );
};

/* =========================================================================================
   MODULE 3: USER PROFILE
   Fetches user details by EMAIL (from login) and allows updates.
   ========================================================================================= */
const UserProfile = ({ setNotification }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable Form State
    const [editData, setEditData] = useState({});

    // 1. Initial Load: Fetch Profile using stored Email
    useEffect(() => {
        // We look for 'userEmail' in storage (set by UserLogin.js)
        const email = localStorage.getItem('userEmail');
        
        if (email) {
            fetchProfile(email);
        } else {
            setNotification({ type: 'error', message: 'User Email not found in session.' });
            setLoading(false);
        }
    }, [setNotification]);

    // Fetch Profile API Call
    const fetchProfile = async (email) => {
        try {
            // New Backend Endpoint: GET /api/Patients/by-email/{email}
            const response = await api.get(`/Patients/by-email/${email}`); 
            setProfile(response.data);
            setEditData(response.data); // Initialize form with fetched data
        } catch (error) {
            console.error("Error fetching profile:", error);
            setNotification({ type: 'error', message: 'Could not load profile data.' });
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle Text Change
    const handleInputChange = (e) => {
        setEditData({
            ...editData,
            [e.target.name]: e.target.value
        });
    };

    // 3. Handle Save (Update)
    const handleSave = async () => {
        if (!profile) return;
        
        // Simple Validation
        if (!editData.name || !editData.age) {
            setNotification({ type: 'error', message: 'Name and Age are required.' });
            return;
        }

        try {
            // Send PUT request to /api/Patients/{id}
            // IMPORTANT: Send password back or handle logic in backend to ignore if null
            await api.put(`/Patients/${profile.patientId}`, {
                ...editData,
                password: editData.password || "Unchanged" 
            });
            
            setProfile(editData);
            setIsEditing(false);
            setNotification({ type: 'success', message: 'Profile updated successfully!' });

        } catch (error) {
            console.error("Error updating profile:", error);
            setNotification({ type: 'error', message: 'Failed to save changes. Check inputs.' });
        }
    };

    // Cancel Edits
    const handleCancel = () => {
        setEditData(profile); // Revert changes to original profile
        setIsEditing(false);
    };

    if (loading) return <div className="content-card"><h3>Loading Profile...</h3></div>;
    if (!profile) return <div className="content-card"><h3>Guest User</h3><p>Please login to view details.</p></div>;

    return (
        <div className="content-card">
            {/* Header with Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '80px', background: '#4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        {isEditing ? (
                             <input 
                                 type="text" 
                                 name="name"
                                 value={editData.name}
                                 onChange={handleInputChange}
                                 className="ai-input"
                                 style={{ fontSize: '1.5rem', fontWeight: 'bold', width: '100%' }}
                             />
                        ) : (
                            <h2 style={{ margin: 0 }}>{profile.name}</h2>
                        )}
                        <p style={{ color: '#64748b', margin: '5px 0' }}>Patient ID: #{profile.patientId}</p>
                    </div>
                </div>

                {/* Edit Controls */}
                <div>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} className="ai-analyze-btn" style={{ background: '#22c55e' }}>Save</button>
                            <button onClick={handleCancel} className="ai-analyze-btn" style={{ background: '#ef4444' }}>Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="ai-analyze-btn">
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="card standard-card">
                <h3>📋 Medical Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '15px' }}>
                    
                    {/* Age Field */}
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>Age</label>
                        {isEditing ? (
                            <input 
                                type="number" 
                                name="age"
                                value={editData.age}
                                onChange={handleInputChange}
                                className="ai-input"
                                style={{ width: '100%' }}
                            />
                        ) : (
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile.age} Years</div>
                        )}
                    </div>

                    {/* Gender Field */}
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>Gender</label>
                        {isEditing ? (
                             <select 
                                name="gender"
                                value={editData.gender}
                                onChange={handleInputChange}
                                className="ai-input"
                                style={{ width: '100%' }}
                             >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                             </select>
                        ) : (
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile.gender}</div>
                        )}
                    </div>

                    {/* Blood Group Field */}
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>Blood Group</label>
                        {isEditing ? (
                            <select 
                                name="bloodGroup"
                                value={editData.bloodGroup}
                                onChange={handleInputChange}
                                className="ai-input"
                                style={{ width: '100%' }}
                            >
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        ) : (
                            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#ef4444' }}>{profile.bloodGroup}</div>
                        )}
                    </div>

                    {/* Contact (Editable) */}
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>Contact</label>
                         {isEditing ? (
                             <input 
                                name="phoneNumber"
                                value={editData.phoneNumber} 
                                onChange={handleInputChange} 
                                className="ai-input" 
                                style={{ width: '100%' }}
                             />
                        ) : (
                             <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#64748b' }}>
                                {profile.phoneNumber}
                             </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

/* =========================================================================================
   4. MAIN USER DASHBOARD (Parent Container)
   Handles sidebar state, notification logic, and module switching.
   ========================================================================================= */
const UserDashboard = ({ onLogout, initialMode = "dashboard", emergencyContext = null }) => {
  const [activeModule, setActiveModule] = useState(initialMode);
  
  // Central Notification State to serve all modules
  const [notification, setNotification] = useState(null); 
  
  // Stores Current Emergency Data (Either from props or new Analysis)
  const [currentEmergencyData, setCurrentEmergencyData] = useState(
      emergencyContext || { specialty: "Emergency", isCritical: true }
  );
  
  const [userName, setUserName] = useState('User');

  // Handle Initial Props (from Login or Home redirect)
  useEffect(() => {
    if (initialMode) setActiveModule(initialMode);
    if (emergencyContext) setCurrentEmergencyData(emergencyContext);
  }, [initialMode, emergencyContext]);

  // Handle Notification Banner Timeout
  useEffect(() => {
    if(notification) {
        const timer = setTimeout(() => setNotification(null), 3500);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  // ✅ AI TRANSITION: When "Dashboard Home" triggers Analyze, switch view to Map
  const handleAiTransition = (analysisResult) => {
      const specialty = analysisResult.disease_info.top_department;
      const isCritical = analysisResult.final_status === "Critical";
      
      setCurrentEmergencyData({ specialty, isCritical });
      setActiveModule('emergency');
      
      setNotification({ type: 'success', message: `Analysis Complete. Routing to ${specialty} Center...` });
  };

  const menuItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Overview' },
    { key: 'emergency', icon: '🚨', label: 'Emergency', description: 'Get help' },
    { key: 'nearby', icon: '📍', label: 'Hospitals', description: 'Find nearby' },
    { key: 'chatbot', icon: '🤖', label: 'Medical Assistant', description: 'AI Doctor' },
    { key: 'profile', icon: '👤', label: 'Profile', description: 'Account' },
  ];

  /* --- MODULE SWITCHER --- */
  
  // 1. GENERAL MAP MODULE
  if (activeModule === 'nearby') {
    return <NearbyHospitals onBack={() => setActiveModule('dashboard')} searchSpecialty="General" />;
  }

  // 2. EMERGENCY MAP MODULE (Uses local onBack logic)
  if (activeModule === 'emergency') {
    return <EmergencyMap 
             onBack={() => setActiveModule('dashboard')} // Goes back to Home Dash
             onGoHome={onLogout} // Goes all the way out
             symptomData={currentEmergencyData} 
           />;
  }

  // 3. MAIN DASHBOARD CONTENT (Sidebar Wrapped)
  const renderModule = () => {
    switch(activeModule) {
      case 'chatbot': 
        return <MedicalChatbot />;
      case 'profile': 
        return <UserProfile setNotification={setNotification} />;
      default: 
        // Pass notification setter and trigger handler to Home
        return <DashboardHome 
                    onNavigate={setActiveModule} 
                    onTriggerEmergency={handleAiTransition} 
                    setNotification={setNotification} 
               />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* GLOBAL NOTIFICATION COMPONENT */}
      <NotificationBanner 
          message={notification?.message} 
          type={notification?.type} 
          onClose={() => setNotification(null)} 
      />

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🏥</div>
          <div className="app-name">Suvera</div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button 
              key={item.key}
              className={`nav-item ${activeModule === item.key ? 'active' : ''}`}
              onClick={() => {
                  // If emergency clicked manually, reset to default state
                  if(item.key === 'emergency') setCurrentEmergencyData({ specialty: "Emergency", isCritical: true });
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
          <button 
            className="nav-item logout-btn" 
            onClick={() => { 
                localStorage.removeItem('userPhone'); 
                localStorage.removeItem('userEmail'); 
                onLogout(); 
            }}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content-area">
        <header className="top-header">
          <div className="header-greeting">
            <h1>{menuItems.find(item => item.key === activeModule)?.label}</h1>
            <p>Welcome back, {userName}</p>
          </div>
          <div className="header-actions">
            <button className="notif-btn">🔔</button>
            <div className="user-avatar">{userName.charAt(0)}</div>
          </div>
        </header>

        <div className="content-scrollable">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;