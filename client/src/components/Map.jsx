import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// MapUpdater component to handle center and zoom changes
function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

const Map = ({ center, zoom, markers }) => {
    const mapRef = useRef(null);

    return (
        <MapContainer 
            ref={mapRef}
            center={center} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
        >
            <MapUpdater center={center} zoom={zoom} />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {markers.map((marker) => (
                <Marker 
                    key={`${marker.id}-${marker.Latitude}-${marker.Longitude}`}
                    position={[
                        parseFloat(marker.Latitude),
                        parseFloat(marker.Longitude)
                    ]}
                >
                    <Popup>
                        <strong>{marker.Destination}</strong>
                        <br />
                        {marker.Country}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default Map; 