import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import api from '../../api';

/* 
   GLOBAL LEAFLET FIX 
   Fixes missing icons that cause 'appendChild' errors 
*/
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const userIcon = L.divIcon({
    className: 'user-marker',
    html: `
        <div style="position:relative; width:20px; height:20px;">
            <div style="position:absolute; background-color:#2563eb; width:100%; height:100%; border-radius:50%; border:2px solid white; z-index:2;"></div>
            <div class="radar-pulse"></div>
        </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const hospitalIcon = L.divIcon({
    className: 'hospital-marker',
    html: '<div style="font-size:32px; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3)); transition: transform 0.2s;">🏥</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const EmergencyMap = ({ symptomData, onBack, onGoHome }) => {
    // State
    const [map, setMap] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [userLoc, setUserLoc] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [statusMsg, setStatusMsg] = useState('Acquiring Satellite Link...');
    const [requestStatus, setRequestStatus] = useState(null); 
    const [activeRequestId, setActiveRequestId] = useState(null); 

    const mapRef = useRef(null);
    const routingControlRef = useRef(null); 
    const isMounted = useRef(true); // Track if component is mounted

    const specialty = symptomData?.specialty || "Emergency";

    // 1. INITIALIZE MAP
    useEffect(() => {
        isMounted.current = true;
        if (!mapRef.current) return;

        // Cleanup existing map instance to prevent memory leaks
        const container = mapRef.current;
        if (container._leaflet_id) {
            container._leaflet_id = null; // Reset Leaflet ID
        }

        const mapInstance = L.map(mapRef.current, { zoomControl: false }).setView([20.59, 78.96], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(mapInstance);

        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
        setMap(mapInstance);

        // ✅ CRITICAL CRASH FIX: Safe Cleanup Sequence
        return () => {
            isMounted.current = false;
            
            // 1. Kill Route Control first
            if (routingControlRef.current) {
                try {
                    // Force clear plan to stop events
                    routingControlRef.current.getPlan().setWaypoints([]);
                    mapInstance.removeControl(routingControlRef.current);
                } catch(e) {
                    // Suppress routing error
                }
                routingControlRef.current = null;
            }

            // 2. Destroy Map
            if (mapInstance) {
                try {
                    mapInstance.off();
                    mapInstance.remove();
                } catch(e) {}
            }
        };
    }, []);

    // 2. FETCH DATA
    useEffect(() => {
        if (!map) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if(!isMounted.current) return;
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLoc([lat, lng]);

                // Ensure map exists
                if(map && map.getContainer()) {
                    L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("<b>You are Here</b>").openPopup();
                    map.setView([lat, lng], 14);
                    fetchBackendHospitals(lat, lng, map);
                }
            },
            () => setStatusMsg("Location Signal Lost. Enable GPS."),
            { enableHighAccuracy: true }
        );
        // eslint-disable-next-line
    }, [map]);

    const fetchBackendHospitals = async (lat, lng, currentMap) => {
        try {
            const response = await fetch(`https://localhost:7189/api/hospitals/search?specialty=${specialty}`);
            if(!response.ok) throw new Error("Backend connection failed");
            const data = await response.json();
            
            if(isMounted.current) setHospitals(data);

            if (data.length > 0) {
                if(isMounted.current) setStatusMsg(`${data.length} UNITS DETECTED`);
                
                data.forEach(h => {
                    const hLat = parseFloat(h.latitude);
                    const hLng = parseFloat(h.longitude);
                    if(hLat && hLng && currentMap) {
                        const marker = L.marker([hLat, hLng], { icon: hospitalIcon }).addTo(currentMap);
                        marker.on('click', () => {
                            if(isMounted.current) {
                                setSelectedId(h.hospitalId); 
                                drawRoute([lat, lng], [hLat, hLng], currentMap);
                            }
                        });
                    }
                });
                
                const nearest = data[0];
                if(isMounted.current) {
                    setSelectedId(nearest.hospitalId);
                    drawRoute([lat, lng], [parseFloat(nearest.latitude), parseFloat(nearest.longitude)], currentMap);
                }
            } else {
                if(isMounted.current) setStatusMsg(`No ${specialty} coverage available.`);
            }
        } catch (e) {
            if(isMounted.current) setStatusMsg("Network Offline");
        }
    };

    const drawRoute = (start, end, mapInstance) => {
        if (!mapInstance || !isMounted.current) return;

        // Remove old route safely
        if (routingControlRef.current) {
            try { 
                routingControlRef.current.getPlan().setWaypoints([]);
                mapInstance.removeControl(routingControlRef.current);
            } catch(e) {}
            routingControlRef.current = null;
        }

        try {
            const control = L.Routing.control({
                waypoints: [L.latLng(start), L.latLng(end)],
                lineOptions: { 
                    styles: [
                        { color: '#dc2626', opacity: 0.8, weight: 8 },
                        { color: 'white', opacity: 1, weight: 3, dashArray: '10, 10', className: 'animated-route' } 
                    ] 
                },
                createMarker: () => null, 
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                show: false,
                containerClassName: 'display-none'
            });

            control.on('routesfound', (e) => {
                if(isMounted.current) {
                    const summary = e.routes[0].summary;
                    setRouteInfo(`${Math.round(summary.totalTime / 60)} min (${(summary.totalDistance / 1000).toFixed(1)} km)`);
                }
            });

            control.addTo(mapInstance);
            routingControlRef.current = control;
        } catch (e) {
            console.error("Route error:", e);
        }
    };

    const sendRequest = async (hospital) => {
        if (!window.confirm(`Transmit Critical Request to ${hospital.name}?`)) return;
        try {
            const payload = {
                HospitalId: hospital.hospitalId,
                PatientName: "Emergency User", 
                ContactNumber: "9876543210", 
                SymptomDescription: `${specialty} Emergency`
            };
            const res = await api.post('/Requests/create', payload);
            setActiveRequestId(hospital.hospitalId);
            setRequestStatus("Pending");
            startStatusPolling(res.data.id);
        } catch (e) { alert("Signal Failed."); }
    };

    const startStatusPolling = (reqId) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/Requests/check-status/${reqId}`);
                if (!isMounted.current) { clearInterval(interval); return; }

                const status = res.data.status;
                if (status !== 'Pending') {
                    setRequestStatus(status);
                    clearInterval(interval);
                    if (status === 'Accepted') alert("✅ HOSPITAL APPROVED. UNIT PREPARING FOR ARRIVAL.");
                    if (status === 'Declined') alert("❌ HOSPITAL FULL. REROUTING ADVISED.");
                }
            } catch (e) {}
        }, 3000); 
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ background: '#dc2626', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px', zIndex: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
                    <button onClick={onGoHome} style={{ background: 'white', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor:'pointer', fontWeight:'bold' }}>🏠 Home</button>
                    {onBack && <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor:'pointer', fontWeight:'bold' }}>← Dashboard</button>}
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight:'700' }}>{specialty.toUpperCase()} ALERT</h2>
                </div>
                {routeInfo && <div style={{ background: 'white', color: '#dc2626', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>⏱ {routeInfo}</div>}
            </div>

            <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '360px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', zIndex: 5, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '15px 15px 5px' }}><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>{statusMsg}</p></div>
                    <div style={{ padding: '10px' }}>
                        {hospitals.map((h, i) => (
                            <div key={i} onClick={() => { setSelectedId(h.hospitalId); if (userLoc) drawRoute(userLoc, [h.latitude, h.longitude], map); }} style={{ padding: '15px', marginBottom: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedId === h.hospitalId ? '#fef2f2' : 'white', border: selectedId === h.hospitalId ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                                <div style={{ fontWeight: 'bold', color: selectedId === h.hospitalId ? '#b91c1c' : '#1f2937' }}>{h.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{h.address}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', margin:'5px 0' }}>📞 {h.phoneNumber}</div>
                                <button onClick={(e) => { e.stopPropagation(); sendRequest(h); }} disabled={activeRequestId === h.hospitalId && requestStatus !== null} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: 'white', backgroundColor: activeRequestId === h.hospitalId && requestStatus === 'Pending' ? '#f59e0b' : '#2563eb' }}>
                                    {activeRequestId === h.hospitalId && requestStatus === 'Pending' ? '⏳ Wait...' : '🔔 Request Admission'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div ref={mapRef} style={{ flex: 1, height: '100%', backgroundColor: '#fff', zIndex: 1 }} />
            </div>
            <style>{`.leaflet-routing-container { display: none !important; } .animated-route { stroke-dasharray: 10; animation: dash 1s linear infinite; } @keyframes dash { to { stroke-dashoffset: -20; } }`}</style>
        </div>
    );
};
export default EmergencyMap;