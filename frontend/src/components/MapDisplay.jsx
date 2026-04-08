import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './HeatmapLayer';

function MapRefresher() {
  const map = useMap();
  useEffect(() => { 
    setTimeout(() => { map.invalidateSize(); }, 500); 
  }, [map]);
  return null;
}

const MapDisplay = ({ incidents = [], resources = { volunteers: [] }, statusColors = {}, onSelect }) => {
  const [radarTime, setRadarTime] = useState(null);

  // MENGAMBIL TIMESTAMP TERBARU DARI RAINVIEWER (Update tiap 10 menit)
  useEffect(() => {
    const fetchRadarTime = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        if (data.radar && data.radar.past.length > 0) {
          // Ambil waktu radar paling mutakhir
          const latest = data.radar.past[data.radar.past.length - 1].time;
          setRadarTime(latest);
        }
      } catch (e) {
        console.error("Gagal memuat data RainViewer");
      }
    };

    fetchRadarTime();
    const interval = setInterval(fetchRadarTime, 600000); // Sinkronisasi ulang tiap 10 menit
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer center={[-7.15, 110.14]} zoom={8} className="h-full w-full" zoomControl={false}>
      <MapRefresher />
      
      <LayersControl position="topright">
        {/* --- PILIHAN PETA DASAR --- */}
        <LayersControl.BaseLayer checked name="Peta Strategis (Light)">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Citra Satelit">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay name="🔥 Analisis Zona Rawan (Heatmap)">
           <HeatmapLayer incidents={incidents} />
        </LayersControl.Overlay>

        {/* --- OVERLAY RADAR HUJAN (RAINVIEWER - NO KEY REQUIRED) --- */}
        {radarTime && (
          <LayersControl.Overlay checked name="🌧️ Radar Hujan (Live)">
            <TileLayer 
              url={`https://tilecache.rainviewer.com/v2/radar/${radarTime}/256/{z}/{x}/{y}/2/1_1.png`} 
              opacity={0.6}
              zIndex={1000}
            />
          </LayersControl.Overlay>
        )}

        {/* --- OVERLAY INFRASTRUKTUR (OPSIONAL) --- */}
        <LayersControl.Overlay name="🛣️ Lalu Lintas (OpenStreetMap)">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.3} />
        </LayersControl.Overlay>
      </LayersControl>

      {/* --- VISUALISASI GARIS KOMANDO --- */}
      {incidents.filter(inc => ['commanded', 'responded'].includes(inc.status)).map(inc => {
        const assignedVolunteers = resources.volunteers?.filter(v => v.status_tugas === 'sedang_bertugas') || [];
        return assignedVolunteers.map(v => (
          <Polyline 
            key={`link-${v.id}`}
            positions={[[v.latitude, v.longitude], [inc.latitude, inc.longitude]]}
            pathOptions={{ color: '#c5a059', weight: 1, dashArray: '5, 10', opacity: 0.5 }}
          />
        ));
      })}

      {/* --- MARKER BENCANA --- */}
      {incidents.map(inc => (
        <CircleMarker 
          key={`inc-${inc.id}`}
          center={[inc.latitude, inc.longitude]}
          radius={12}
          pathOptions={{ fillColor: statusColors[inc.status] || '#94a3b8', color: 'white', weight: 3, fillOpacity: 0.9 }}
          eventHandlers={{ click: () => onSelect(inc) }}
        >
          <Popup><b className="uppercase">{inc.title}</b></Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default MapDisplay;