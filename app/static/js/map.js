let map;
let victimMarker;
let responderMarker;
let routePolyline;
let updateInterval;
let isTrackingPaused = false;

// Initialize map
function initMap() {
    console.log('Initializing real-time tracking map...');
    
    const defaultLocation = { lat: 20.5937, lng: 78.9629 }; // India center
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: EMERGENCY_ID ? 15 : 10,
        center: defaultLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
    });

    // Set up tracking based on emergency ID
    if (EMERGENCY_ID) {
        // Specific emergency tracking
        loadEmergencyLocations(EMERGENCY_ID);
        startLiveUpdates(EMERGENCY_ID);
        updateConnectionStatus('connected');
    } else {
        // General map view for responders
        loadAllActiveEmergencies();
        updateConnectionStatus('connected');
    }

    // Set up control buttons
    setupControls();
}

// Set up control buttons
function setupControls() {
    document.getElementById('center-btn')?.addEventListener('click', () => {
        if (victimMarker) {
            map.setCenter(victimMarker.getPosition());
            map.setZoom(16);
        }
    });

    document.getElementById('toggle-tracking')?.addEventListener('click', () => {
        toggleTracking();
    });
}

// Toggle tracking on/off
function toggleTracking() {
    isTrackingPaused = !isTrackingPaused;
    const button = document.getElementById('toggle-tracking');
    
    if (isTrackingPaused) {
        if (updateInterval) clearInterval(updateInterval);
        button.textContent = '▶️ Resume Updates';
        updateConnectionStatus('disconnected');
    } else {
        if (EMERGENCY_ID) {
            startLiveUpdates(EMERGENCY_ID);
        }
        button.textContent = '⏸️ Pause Updates';
        updateConnectionStatus('connected');
    }
}

// Update connection status
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = status === 'connected' ? '🟢 Connected' : '🔴 Disconnected';
        statusElement.className = status;
    }
}

// Load emergency locations
async function loadEmergencyLocations(emergencyId) {
    try {
        const response = await fetch(`/map/${emergencyId}/location`);
        const data = await response.json();
        
        if (data.victim_location) {
            updateVictimMarker(data.victim_location);
            updateLocationInfo('victim', data.victim_location);
        }
        
        if (data.responder_location) {
            updateResponderMarker(data.responder_location);
            updateLocationInfo('responder', data.responder_location);
            drawRoute();
            updateDistanceInfo(data.victim_location, data.responder_location);
        }
        
        updateLastUpdateTime();
        updateConnectionStatus('connected');
    } catch (error) {
        console.error('Failed to load locations:', error);
        updateConnectionStatus('disconnected');
        document.getElementById('error-display').style.display = 'block';
        document.getElementById('error-display').innerHTML = 'Failed to load locations: ' + error.message;
    }
}

// Load all active emergencies (for general map view)
async function loadAllActiveEmergencies() {
    try {
        const response = await fetch('/map/active');
        const emergencies = await response.json();
        
        emergencies.forEach(emergency => {
            const marker = new google.maps.Marker({
                position: emergency.location,
                map: map,
                title: `${emergency.type} - ${emergency.victim_name}`,
                icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="info-window">
                        <h4>🚨 ${emergency.type}</h4>
                        <p><strong>Victim:</strong> ${emergency.victim_name}</p>
                        <p><strong>Time:</strong> ${new Date(emergency.created_at).toLocaleTimeString()}</p>
                        <button onclick="acceptEmergency(${emergency.id})" class="btn btn-primary btn-sm">Accept</button>
                    </div>
                `
            });
            
            marker.addListener('click', () => infoWindow.open(map, marker));
        });
        
        updateLastUpdateTime();
    } catch (error) {
        console.error('Failed to load active emergencies:', error);
    }
}

// Update location info panel
function updateLocationInfo(type, location) {
    const infoElement = document.getElementById(`${type}-info`);
    if (infoElement) {
        const time = new Date().toLocaleTimeString();
        infoElement.innerHTML = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (Updated: ${time})`;
    }
}

// Update distance info
function updateDistanceInfo(victimLoc, responderLoc) {
    const distanceElement = document.getElementById('distance-info');
    if (distanceElement && victimLoc && responderLoc) {
        const distance = calculateDistance(
            victimLoc.lat, victimLoc.lng,
            responderLoc.lat, responderLoc.lng
        );
        distanceElement.innerHTML = `Distance: ${distance.toFixed(2)} km (${(distance * 0.621371).toFixed(2)} miles)`;
    }
}

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Update victim marker
function updateVictimMarker(location) {
    if (!victimMarker) {
        victimMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: 'Victim Location',
            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new google.maps.Size(40, 40) }
        });
    } else {
        victimMarker.setPosition(location);
    }
    
    // Center map on victim if first load
    if (!responderMarker) {
        map.setCenter(location);
    }
}

// Update responder marker
function updateResponderMarker(location) {
    if (!responderMarker) {
        responderMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: 'Responder Location',
            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', scaledSize: new google.maps.Size(35, 35) }
        });
    } else {
        responderMarker.setPosition(location);
    }
}

// Draw route between responder and victim
function drawRoute() {
    if (!victimMarker || !responderMarker) return;
    
    const path = [
        victimMarker.getPosition(),
        responderMarker.getPosition()
    ];
    
    if (routePolyline) {
        routePolyline.setPath(path);
    } else {
        routePolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: map
        });
    }
}

// Update last update time
function updateLastUpdateTime() {
    const timeElement = document.getElementById('last-update');
    if (timeElement) {
        timeElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
}

// Accept emergency (for responders)
async function acceptEmergency(emergencyId) {
    try {
        const response = await fetch(`/responder/accept/${emergencyId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.href = `/map/${emergencyId}`;
        }
    } catch (error) {
        console.error('Failed to accept emergency:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// Initialize when Google Maps is ready
if (typeof google !== 'undefined') {
    window.initMap = initMap;
} else {
    console.error('Google Maps not loaded');
    document.getElementById('error-display').style.display = 'block';
    document.getElementById('error-display').innerHTML = 'Google Maps failed to load. Please check your API key.';
}