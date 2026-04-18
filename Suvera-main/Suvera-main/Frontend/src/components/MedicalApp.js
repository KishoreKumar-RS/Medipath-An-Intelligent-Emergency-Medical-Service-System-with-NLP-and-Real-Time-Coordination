import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// --- Fix Leaflet Icons ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Icons ---
const userIcon = L.divIcon({
    className: 'user-marker',
    html: '<div style="background-color:#3498db; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const hospitalIcon = L.divIcon({
    className: 'hospital-marker',
    html: '<div style="font-size:30px; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.4));">🏥</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const EmergencyMap = ({ symptomData, onBack }) => {
    const [map, setMap] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [userLoc, setUserLoc] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [statusMsg, setStatusMsg] = useState('Locating...');
    
    const mapRef = useRef(null);
    const routingControlRef = useRef(null); 

    const specialty = symptomData?.specialty || "Emergency";

    // 1. Initialize Map
    useEffect(() => {
        if (!mapRef.current) return;

        if (map) map.remove();

        const mapInstance = L.map(mapRef.current, {
            zoomControl: false 
        }).setView([13.0827, 80.2707], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(mapInstance);

        L.control.zoom({ position: 'topright' }).addTo(mapInstance);

        setMap(mapInstance);

        return () => { if (mapInstance) mapInstance.remove(); };
        // eslint-disable-next-line
    }, []);

    // 2. Fetch Logic
    useEffect(() => {
        if (!map) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLoc([lat, lng]);

                L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("<b>You are Here</b>").openPopup();
                map.setView([lat, lng], 14);

                fetchBackendHospitals(lat, lng);
            },
            (err) => setStatusMsg("Location Access Denied."),
            { enableHighAccuracy: true }
        );
        // eslint-disable-next-line
    }, [map]);

    const fetchBackendHospitals = async (lat, lng) => {
        try {
            const response = await fetch(`https://localhost:7189/api/hospitals/search?specialty=${specialty}`);
            if(!response.ok) throw new Error("Failed");
            const data = await response.json();
            
            setHospitals(data);

            if (data.length > 0) {
                setStatusMsg(`${data.length} Centers Found`);
                data.forEach(h => {
                    const hLat = parseFloat(h.latitude);
                    const hLng = parseFloat(h.longitude);
                    if(hLat && hLng) {
                        L.marker([hLat, hLng], { icon: hospitalIcon }).addTo(map).bindPopup(`<b>${h.name}</b>`);
                    }
                });
                const nearest = data[0];
                drawRoute([lat, lng], [parseFloat(nearest.latitude), parseFloat(nearest.longitude)], map);
            } else {
                setStatusMsg(`No ${specialty} hospitals found.`);
            }
        } catch (e) {
            console.error(e);
            setStatusMsg("Backend Connection Failed");
        }
    };

    const drawRoute = (start, end, mapInstance) => {
        if (routingControlRef.current) {
            try { mapInstance.removeControl(routingControlRef.current); } catch(e){}
        }

        const control = L.Routing.control({
            waypoints: [L.latLng(start), L.latLng(end)],
            lineOptions: { styles: [{ color: '#c0392b', weight: 8, opacity: 0.8 }] },
            createMarker: () => null, 
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            containerClassName: 'display-none'
        });

        control.on('routesfound', (e) => {
            const summary = e.routes[0].summary;
            setRouteInfo(`${Math.round(summary.totalTime / 60)} min (${(summary.totalDistance / 1000).toFixed(1)} km)`);
        });

        control.addTo(mapInstance);
        routingControlRef.current = control;
    };

    // --- STYLES THAT FIX THE PURPLE SCREEN ---
    
    const wrapperStyle = {
        position: 'fixed', 
        top: 0, left: 0, width: '100vw', height: '100vh', 
        backgroundColor: '#ffffff', // ✅ THIS LINE KILLS THE PURPLE COLOR
        zIndex: 9999
    };

    const headerStyle = {
        position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
        background: '#c0392b', color: 'white', padding: '0 20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    };

    const sidebarStyle = {
        position: 'absolute', top: '60px', left: 0, bottom: 0, width: '350px',
        background: 'white', borderRight: '1px solid #ccc', zIndex: 5, overflowY: 'auto',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    };

    const mapContainerStyle = {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 1, backgroundColor: '#e5e5e5' // Fallback color
    };

    return (
        <div style={wrapperStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🚨 EMERGENCY: {specialty}</h2>
                    <small style={{ fontWeight: 'bold' }}>Auto-routing active</small>
                </div>
                <button onClick={onBack} style={{ background: 'white', color: '#c0392b', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', cursor:'pointer' }}>EXIT</button>
            </div>

            {/* Sidebar */}
            <div style={sidebarStyle}>
                {routeInfo && <div style={{ background: '#ffebee', padding: '15px', color: '#c62828', fontWeight: 'bold', borderBottom: '1px solid #ffcdd2' }}>⏱ ETA to Nearest <br/><span style={{fontSize:'1.3rem'}}>{routeInfo}</span></div>}
                
                <div style={{ padding: '15px' }}>
                    {hospitals.map((h, i) => (
                        <div key={i} onClick={() => userLoc && drawRoute(userLoc, [h.latitude, h.longitude], map)} 
                                style={{ border: i===0?'2px solid #e53935':'1px solid #eee', borderRadius: '8px', padding: '15px', marginBottom: '10px', background: 'white', cursor: 'pointer' }}>
                            <strong style={{color:'#c62828', fontSize:'1.1rem'}}>{h.name}</strong>
                            <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#555' }}>{h.address}</p>
                            <strong style={{color: '#333'}}>📞 {h.phoneNumber}</strong>
                            {i===0 && <div style={{color:'red', fontSize:'0.8rem', marginTop:'5px'}}>📍 Nearest Recommendation</div>}
                        </div>
                    ))}
                    {hospitals.length === 0 && <p>{statusMsg}</p>}
                </div>
            </div>

            {/* Map - ABSOLUTE POSITIONING TO FILL SCREEN */}
            <div ref={mapRef} style={mapContainerStyle} />

            <style>{`.leaflet-routing-container { display: none !important; }`}</style>
        </div>
    );
};

export default EmergencyMap;