import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const OWM_KEY = "311da565f6bbe61c1896ea46b2f8c353";

const PublicDashboard = ({ incidents, onOpenLogin }) => {
  const [data, setData] = useState(incidents || []);
  const [inventory, setInventory] = useState([]);
  const [activeView, setActiveView] = useState('home');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [resInc, resInv] = await Promise.all([
          axios.get('https://nupeduli-pusdatin-nu-backend.hf.space/api/incidents/public'),
          axios.get('https://nupeduli-pusdatin-nu-backend.hf.space/api/inventory')
        ]);
        setData(resInc.data);
        setInventory(resInv.data);
      } catch (e) { console.error("Strategic Hub Error"); }
    };
    fetchAllData();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      <header className="h-14 bg-white border-b shrink-0 flex items-center px-6 justify-between z-[2000] shadow-sm">
        <div className="flex items-center gap-3">
          <img src="https://pwnu-jateng.org/uploads/infoumum/20250825111304-2025-08-25infoumum111252.png" className="h-8" alt="logo" />
          <h1 className="text-sm font-black text-[#006432] uppercase tracking-tighter italic">NU Peduli Monitoring</h1>
        </div>
        <i className="far fa-user-circle text-xl text-slate-300 cursor-pointer hover:text-[#006432] transition-all" onClick={onOpenLogin}></i>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar pb-32 pt-4 px-4 md:px-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
           <KPIBox label="Misi" value={data.length} color="text-red-600" icon="fire-extinguisher" />
           <KPIBox label="Relawan" value={142} color="text-green-600" icon="user-shield" />
           <KPIBox label="Aset" value="24" color="text-[#c5a059]" icon="box-open" />
           <KPIBox label="Wilayah" value="35" color="text-blue-600" icon="map-marked-alt" />
        </div>

        <div className="h-[400px] md:h-[500px] bento-card border-[12px] border-white relative overflow-hidden">
          <MapContainer center={[-7.15, 110.14]} zoom={8} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
            {data.map((inc) => {
              const lat = parseFloat(inc.latitude);
              const lng = parseFloat(inc.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <CircleMarker key={inc.id || inc._id} center={[lat, lng]} radius={12} pathOptions={{ fillColor: '#ef4444', color: 'white', weight: 3, fillOpacity: 0.8 }}>
                  <Popup>
                    <div className="p-2">
                       <h4 className="font-black text-[#006432] uppercase text-xs border-b pb-1 mb-1">{inc.title}</h4>
                       <p className="text-[10px] text-slate-600 italic">"{inc.kondisi_mutakhir || "Assessment aktif."}"</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t flex items-center justify-around z-[3000] shadow-xl">
        <NavIcon icon="home" label="Dash" active={activeView === 'home'} onClick={() => setActiveView('home')} />
        <div className="relative -top-5">
           <button onClick={() => window.location.href='/lapor'} className="w-16 h-16 bg-red-600 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-white active:scale-90 transition-all">
             <i className="fas fa-bullhorn text-xl"></i>
           </button>
        </div>
        <NavIcon icon="boxes" label="Resource" active={activeView === 'resources'} onClick={() => setActiveView('resources')} />
      </nav>
    </div>
  );
};

const KPIBox = ({ label, value, color, icon }) => (
  <div className="bento-card p-5 flex flex-col items-center justify-center group">
    <div className={`w-10 h-10 rounded-2xl mb-2 flex items-center justify-center bg-slate-50 group-hover:bg-[#006432]/10 transition-colors`}>
      <i className={`fas fa-${icon} ${color} text-xs`}></i>
    </div>
    <p className={`text-2xl font-black ${color} tracking-tighter leading-none`}>{value}</p>
    <p className="text-[9px] font-black text-slate-400 uppercase mt-2 leading-none tracking-widest">{label}</p>
  </div>
);

const NavIcon = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-[#006432]' : 'text-slate-300'}`}>
    <i className={`fas fa-${icon} text-lg`}></i>
    <span className="text-[8px] font-black uppercase tracking-widest leading-none">{label}</span>
  </button>
);

export default PublicDashboard;