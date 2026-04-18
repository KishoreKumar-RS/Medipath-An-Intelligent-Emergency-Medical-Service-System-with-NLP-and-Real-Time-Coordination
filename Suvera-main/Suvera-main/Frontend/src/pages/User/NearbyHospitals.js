import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// --- Fix for Leaflet Default Icons in React ---
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

// --- Custom Icons ---
const userIcon = L.divIcon({
    className: 'current-location-marker',
    html: '<div style="background-color: #3498db; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const hospitalIcon = L.divIcon({
    className: 'hospital-marker',
    html: '<i style="color: #e74c3c; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🏥</i>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// --- Helper Functions ---
const toRad = (deg) => deg * (Math.PI / 180);
const toDeg = (rad) => rad * (180 / Math.PI);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const NearbyHospitals = ({ onBack }) => {
    // --- State ---
    const [map, setMap] = useState(null);
    const [userLoc, setUserLoc] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [routeMetrics, setRouteMetrics] = useState({ distance: '0 km', time: '0 min' });
    
    // Loading States
    const [isLocating, setIsLocating] = useState(true);
    const [isFetchingHospitals, setIsFetchingHospitals] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Refs ---
    const mapRef = useRef(null);
    const routeControlsRef = useRef([]);
    const userMarkerRef = useRef(null);
    const hospitalMarkersRef = useRef([]);
    const animationTimeoutsRef = useRef([]); // To track and clear timeouts

    // --- 1. Initialize Map ---
    useEffect(() => {
        if (!mapRef.current) return;

        const mapInstance = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        setMap(mapInstance);

        return () => {
            mapInstance.remove();
        };
    }, []);

    // --- 2. API Fetch Function (Updated to 20km) ---
    const fetchNearbyHospitals = useCallback(async (lat, lng) => {
        setIsFetchingHospitals(true);
        setErrorMsg('');

        // Query: Find nodes, ways, relations tagged "hospital" within 20000m (20km)
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="hospital"](around:20000,${lat},${lng});
              way["amenity"="hospital"](around:20000,${lat},${lng});
              relation["amenity"="hospital"](around:20000,${lat},${lng});
            );
            out center;
        `;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const formattedHospitals = data.elements.map((element) => {
                const hLat = element.lat || element.center.lat;
                const hLon = element.lon || element.center.lon;
                const name = element.tags.name || element.tags['name:en'] || "Unnamed Medical Center";

                return {
                    id: element.id,
                    name: name,
                    coords: [hLat, hLon],
                    phone: element.tags.phone || "Not available"
                };
            }).filter(h => h.name !== "Unnamed Medical Center");

            setHospitals(formattedHospitals);
            
            if(formattedHospitals.length === 0) {
                setErrorMsg("No hospitals found within 20km radius.");
            }

        } catch (error) {
            console.error("Error fetching hospitals:", error);
            setErrorMsg("Failed to fetch hospital data.");
        } finally {
            setIsFetchingHospitals(false);
        }
    }, []);

    // --- 3. Get User Location (High Accuracy Enabled) ---
    useEffect(() => {
        if (!map) return;

        const handleSuccess = (pos) => {
            const { latitude, longitude } = pos.coords;
            const newLoc = [latitude, longitude];
            
            setUserLoc(newLoc);
            setIsLocating(false);

            // Update User Marker
            if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
            userMarkerRef.current = L.marker(newLoc, { icon: userIcon })
                .addTo(map)
                .bindPopup("You are here")
                .openPopup();

            // Add pulse circle
            L.circle(newLoc, {
                color: '#3498db',
                fillColor: '#3498db',
                fillOpacity: 0.2,
                radius: 1500
            }).addTo(map);

            map.setView(newLoc, 13);

            // Fetch Data
            fetchNearbyHospitals(latitude, longitude);
        };

        const handleError = (err) => {
            console.error("Location Error:", err);
            setErrorMsg("Location denied. Using Demo Location.");
            handleSuccess({ coords: { latitude: 9.9252, longitude: 78.1198 } }); // Madurai fallback
        };

        if (navigator.geolocation) {
            // High Accuracy Options
            const options = {
                enableHighAccuracy: true, // Forces GPS/Wifi scan over IP
                timeout: 10000,
                maximumAge: 0
            };
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
        } else {
            handleError();
        }
    }, [map, fetchNearbyHospitals]);

    // --- 4. Route Calculation Logic (Race Condition Fixed) ---
    const calculateRoutes = useCallback((hospital, currentMapInstance) => {
        const currentMap = currentMapInstance || map;
        if (!currentMap || !userLoc) return;

        // Cleanup previous routes
        routeControlsRef.current.forEach(ctrl => {
            try { currentMap.removeControl(ctrl); } catch(e){}
        });
        routeControlsRef.current = [];

        // Cleanup previous timeouts
        animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        animationTimeoutsRef.current = [];

        const start = userLoc;
        const end = hospital.coords;
        const routeColors = ["#00cc00", "#0000ff", "#ff0000"];

        // Math for Waypoints
        const startLatRad = toRad(start[0]);
        const startLngRad = toRad(start[1]);
        const endLatRad = toRad(end[0]);
        const endLngRad = toRad(end[1]);
        
        const dLng = endLngRad - startLngRad;
        const y = Math.sin(dLng) * Math.cos(endLatRad);
        const x = Math.cos(startLatRad) * Math.sin(endLatRad) - 
                  Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);
        const bearing = Math.atan2(y, x);

        const perpBearing1 = bearing + Math.PI/2; 
        const perpBearing2 = bearing - Math.PI/2;

        const directDistance = calculateDistance(start[0], start[1], end[0], end[1]);
        const offsetDist = Math.min(directDistance * 0.3, 5); 

        const midLat = (start[0] + end[0]) / 2;
        const midLng = (start[1] + end[1]) / 2;

        const getDestination = (lat, lng, brng, dist) => {
            const angDist = dist / 6371; 
            const radLat = toRad(lat);
            const radLng = toRad(lng);
            const newLat = Math.asin(Math.sin(radLat) * Math.cos(angDist) + 
                                     Math.cos(radLat) * Math.sin(angDist) * Math.cos(brng));
            const newLng = radLng + Math.atan2(Math.sin(brng) * Math.sin(angDist) * Math.cos(radLat),
                                               Math.cos(angDist) - Math.sin(radLat) * Math.sin(newLat));
            return [toDeg(newLat), toDeg(newLng)];
        };

        const waypoint1 = getDestination(midLat, midLng, perpBearing1, offsetDist);
        const waypoint2 = getDestination(midLat, midLng, perpBearing2, offsetDist);

        const routeConfigs = [
            { waypoints: [L.latLng(start), L.latLng(end)] }, 
            { waypoints: [L.latLng(start), L.latLng(waypoint1), L.latLng(end)] }, 
            { waypoints: [L.latLng(start), L.latLng(waypoint2), L.latLng(end)] } 
        ];

        routeConfigs.forEach((config, index) => {
            const timeoutId = setTimeout(() => {
                const control = L.Routing.control({
                    waypoints: config.waypoints,
                    lineOptions: {
                        styles: [{ color: routeColors[index], weight: 6, opacity: 0.7 }],
                        addWaypoints: false
                    },
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'driving'
                    }),
                    createMarker: () => null,
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: index === 0,
                    showAlternatives: false,
                    containerClassName: 'display-none'
                });

                control.on('routesfound', (e) => {
                    if (index === 0) {
                        const r = e.routes[0];
                        setRouteMetrics({
                            distance: (r.summary.totalDistance / 1000).toFixed(2) + ' km',
                            time: Math.round(r.summary.totalTime / 60) + ' min'
                        });
                    }
                });

                try {
                    control.addTo(currentMap);
                    routeControlsRef.current.push(control);
                } catch(e) { console.log('Map update error', e); }
            }, index * 500);
            
            animationTimeoutsRef.current.push(timeoutId);
        });
    }, [map, userLoc]);

    // --- 5. Handle Hospital Select ---
    const handleHospitalSelect = useCallback((h, mapInstance) => {
        setSelectedHospital(h);
        calculateRoutes(h, mapInstance || map);
    }, [calculateRoutes, map]);

    // --- 6. Render Hospital Markers ---
    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        hospitalMarkersRef.current.forEach(marker => map.removeLayer(marker));
        hospitalMarkersRef.current = [];

        // Add new markers
        hospitals.forEach(h => {
            const marker = L.marker(h.coords, { icon: hospitalIcon })
                .addTo(map)
                .bindPopup(`<b>${h.name}</b><br/><span style="font-size:10px">Click to route</span>`);
            
            marker.on('click', () => {
                handleHospitalSelect(h, map);
            });

            hospitalMarkersRef.current.push(marker);
        });
    }, [hospitals, map, handleHospitalSelect]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
            
            {/* Header */}
            <div style={{ 
                padding: '15px 20px', 
                background: 'white', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
                zIndex: 100, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px' 
            }}>
                <button onClick={onBack} style={{ padding: '8px 15px', border: '1px solid #ddd', background: 'white', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>
                    ⬅ Back
                </button>
                <h2 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-heartbeat" style={{ color: '#e74c3c' }}></i> 
                    Live Hospital Finder
                </h2>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Sidebar */}
                <div style={{ 
                    width: '350px', 
                    background: '#f8f9fa', 
                    padding: '20px', 
                    overflowY: 'auto', 
                    borderRight: '1px solid #ddd',
                    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                    zIndex: 90
                }}>
                    {isLocating && <div style={{ color: '#3498db' }}>📍 Acquiring GPS...</div>}
                    {isFetchingHospitals && <div style={{ color: '#e67e22' }}>📡 Scanning for hospitals within 20km...</div>}
                    {errorMsg && <div style={{ color: '#e74c3c', marginBottom: '10px' }}>⚠️ {errorMsg}</div>}

                    {!selectedHospital ? (
                        <>
                            <p style={{ color: '#7f8c8d' }}>Found {hospitals.length} hospitals nearby:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {hospitals.map((h, i) => {
                                    const dist = userLoc ? calculateDistance(userLoc[0], userLoc[1], h.coords[0], h.coords[1]).toFixed(2) : '?';
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => handleHospitalSelect(h, null)}
                                            style={{
                                                background: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'transform 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ fontWeight: '600', color: '#2c3e50' }}>{h.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '5px' }}>📍 {dist} km away</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div>
                            <button 
                                onClick={() => {
                                    setSelectedHospital(null);
                                    routeControlsRef.current.forEach(c => {
                                        try { map.removeControl(c); } catch(e){}
                                    });
                                    routeControlsRef.current = [];
                                    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
                                    animationTimeoutsRef.current = [];
                                }}
                                style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#2c3e50' }}
                            >
                                Cancel Selection
                            </button>
                            
                            <h3 style={{ color: '#e74c3c', marginTop: 0 }}>{selectedHospital.name}</h3>
                            
                            <div style={{ marginTop: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#7f8c8d' }}>Distance:</span>
                                    <span style={{ fontWeight: 'bold' }}>{routeMetrics.distance}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#7f8c8d' }}>Est. Time:</span>
                                    <span style={{ fontWeight: 'bold' }}>{routeMetrics.time}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ marginBottom: '10px' }}>Legend</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '20px', height: '4px', background: '#00cc00' }}></div><span style={{ fontSize: '0.9rem' }}>Shortest Route</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '20px', height: '4px', background: '#0000ff' }}></div><span style={{ fontSize: '0.9rem' }}>Alternative 1</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '20px', height: '4px', background: '#ff0000' }}></div><span style={{ fontSize: '0.9rem' }}>Alternative 2</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div ref={mapRef} style={{ flex: 1, zIndex: 0 }} />
            </div>

            <style>{`
                .leaflet-routing-container { display: none !important; }
                .leaflet-control-container .leaflet-routing-container-hide { display: none; }
            `}</style>
        </div>
    );
};

export default NearbyHospitals;