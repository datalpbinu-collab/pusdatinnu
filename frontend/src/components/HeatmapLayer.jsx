import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ incidents }) => {
  const map = useMap();

  useEffect(() => {
    if (!incidents || incidents.length === 0) return;

    // JEDA 1 DETIK: Menunggu MapContainer siap 100%
    const timer = setTimeout(() => {
      try {
        // Paksa peta hitung ulang ukuran agar tidak blank
        map.invalidateSize();

        // Filter data koordinat yang valid
        const points = incidents
          .filter(i => i.latitude && i.longitude)
          .map(i => [
            parseFloat(i.latitude), 
            parseFloat(i.longitude), 
            0.8 // Intensitas
          ]);

        if (points.length > 0) {
          const heatLayer = L.heatLayer(points, {
            radius: 35,
            blur: 20,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1: 'red' }
          });

          heatLayer.addTo(map);

          return () => {
            if (map && heatLayer) map.removeLayer(heatLayer);
          };
        }
      } catch (err) {
        console.warn("Heatmap postponed: Waiting for container height.");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [incidents, map]);

  return null;
};

export default HeatmapLayer;