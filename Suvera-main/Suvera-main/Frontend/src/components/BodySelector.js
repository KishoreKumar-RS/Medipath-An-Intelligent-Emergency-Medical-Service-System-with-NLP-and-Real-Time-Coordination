import React, { useState } from 'react';

const BodySelector = ({ onSelect }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  const bodyParts = [
    { id: 'Head', label: 'Head / Brain', symptom: 'Stroke, Trauma', color: "#ef4444", path: "M120 40 Q120 20 140 20 Q160 20 160 40 Q160 70 140 70 Q120 70 120 40" },
    { id: 'Chest', label: 'Chest / Heart', symptom: 'Heart Attack, Breathing', color: "#3b82f6", path: "M100 75 Q140 75 180 75 L170 140 Q140 150 110 140 Z" },
    { id: 'Abdomen', label: 'Stomach / GI', symptom: 'Severe Pain, Bleeding', color: "#eab308", path: "M110 140 Q140 150 170 140 L165 200 Q140 210 115 200 Z" },
    { id: 'Arms', label: 'Arms / Limbs', symptom: 'Fractures, Cuts', color: "#10b981", path: "M100 75 L80 150 L100 150 L110 90 M180 75 L200 150 L180 150 L170 90" },
    { id: 'Legs', label: 'Legs / Mobility', symptom: 'Accident, Trauma', color: "#f97316", path: "M115 200 L110 320 L130 320 L135 210 M165 200 L170 320 L150 320 L145 210" }
  ];

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{margin:0, color:'#1f2937', fontSize:'2rem'}}>Visual Triage</h2>
        <p style={{margin:'5px 0 0', color:'#6b7280', fontSize:'1rem'}}>Tap the affected area OR select General Emergency.</p>
      </div>

      <div style={styles.flexContent}>
        
        {/* --- LEFT: BODY DIAGRAM (LARGE) --- */}
        <div style={styles.bodyWrapper}>
            <svg viewBox="0 0 280 350" style={styles.svg}>
                <g fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2">
                    <path d="M120 40 Q120 20 140 20 Q160 20 160 40 Q160 70 140 70 Q120 70 120 40 M100 75 Q140 75 180 75 L170 140 Q140 150 110 140 Z M110 140 Q140 150 170 140 L165 200 Q140 210 115 200 Z M100 75 L80 150 L100 150 L110 90 M180 75 L200 150 L180 150 L170 90 M115 200 L110 320 L130 320 L135 210 M165 200 L170 320 L150 320 L145 210" />
                </g>
                {bodyParts.map((part) => (
                    <path
                        key={part.id} d={part.path}
                        fill={hoveredPart === part.id ? part.color : "transparent"}
                        stroke={hoveredPart === part.id ? "white" : "transparent"}
                        strokeWidth={hoveredPart === part.id ? "2" : "0"}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', opacity: 0.8 }}
                        onMouseEnter={() => setHoveredPart(part.id)}
                        onMouseLeave={() => setHoveredPart(null)}
                        onClick={() => onSelect(part.id)}
                    />
                ))}
            </svg>
            
            <div style={{height: '30px', textAlign:'center', marginTop:'15px'}}>
                {hoveredPart ? (
                    <span style={{background: bodyParts.find(p => p.id === hoveredPart).color, color:'white', padding:'6px 16px', borderRadius:'15px', fontSize:'0.9rem', fontWeight:'bold'}}>
                        {bodyParts.find(p => p.id === hoveredPart).label}
                    </span>
                ) : (
                    <span style={{color:'#94a3b8', fontSize:'0.9rem', fontStyle:'italic'}}>Tap body part to locate</span>
                )}
            </div>
        </div>

        {/* --- RIGHT: ACTIONS & INFO --- */}
        <div style={styles.actionSection}>
            
            {/* 1. GENERAL EMERGENCY BUTTON (Active) */}
            <div 
                onClick={() => onSelect('General_Emergency')} 
                style={styles.emergencyBtn}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <div style={{fontSize:'3rem', marginBottom:'10px'}}>🚑</div>
                <div style={{fontWeight:'800', color:'#b91c1c', fontSize:'1.4rem'}}>LOCATE EMERGENCY UNIT</div>
                <div style={{fontSize:'0.9rem', color:'#7f1d1d', opacity:0.8}}>Trauma, Accident, Unconscious</div>
                <div style={{marginTop:'15px', background:'#b91c1c', color:'white', padding:'8px 20px', borderRadius:'20px', fontSize:'0.9rem', fontWeight:'bold'}}>TAP TO LOCATE</div>
            </div>

            {/* 2. INFO CARDS (Non-Clickable / Informational) */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                <div style={styles.infoCard}>
                    <div style={{fontSize:'2rem'}}>📞</div>
                    <div>
                        <div style={{fontWeight:'bold', color:'#333', fontSize:'1.1rem'}}>Ambulance</div>
                        <div style={{fontSize:'1.2rem', color:'#dc2626', fontWeight:'800'}}>108</div>
                        <div style={{fontSize:'0.7rem', color:'#666'}}>Govt. Hotline</div>
                    </div>
                </div>
                <div style={styles.infoCard}>
                    <div style={{fontSize:'2rem'}}>👮‍♂️</div>
                    <div>
                        <div style={{fontWeight:'bold', color:'#333', fontSize:'1.1rem'}}>Police</div>
                        <div style={{fontSize:'1.2rem', color:'#2563eb', fontWeight:'800'}}>100</div>
                        <div style={{fontSize:'0.7rem', color:'#666'}}>Crime/Safety</div>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

const styles = {
    container: {
        background: 'white',
        borderRadius: '24px',
        padding: '50px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '20px'
    },
    flexContent: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '60px' 
    },
    bodyWrapper: {
        width: '300px', // ✅ INCREASED SIZE
        height: '480px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    svg: {
        width: '100%',
        height: '100%',
        filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.05))'
    },
    actionSection: {
        flex: 1,
        minWidth: '350px',
        display: 'flex',
        flexDirection: 'column',
        gap: '25px'
    },
    emergencyBtn: {
        background: '#fff1f2',
        borderRadius: '20px',
        padding: '30px',
        textAlign: 'center',
        border: '3px solid #fca5a5',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(220, 38, 38, 0.1)',
        transition: 'all 0.2s ease',
        display:'flex', flexDirection:'column', alignItems:'center'
    },
    infoCard: {
        background: '#f8fafc',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        justifyContent: 'center',
        textAlign: 'left'
    }
};

export default BodySelector;