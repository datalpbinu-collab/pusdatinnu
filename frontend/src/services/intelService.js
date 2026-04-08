import axios from 'axios';

// API Otoritas
const BMKG_QUAKE_URL = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json";
const USGS_QUAKE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";

export const getEarthquakes = async () => {
    try {
        const res = await axios.get(USGS_QUAKE_URL);
        return res.data.features; // Data Gempa Dunia M > 4.5
    } catch (e) { return []; }
};

// Simulasi Data Sensor Lokal (IoT Water Level Jateng)
export const getLocalSensors = () => {
    return [
        { id: 'S01', name: 'Bendung Wilalung (Kudus)', level: 450, status: 'Siaga 2', trend: 'Rising' },
        { id: 'S02', name: 'Polder Tawang (Semarang)', level: 120, status: 'Normal', trend: 'Stable' },
        { id: 'S03', name: 'Sungai Wulan (Demak)', level: 680, status: 'Siaga 1', trend: 'Rising' }
    ];
};