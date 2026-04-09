import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const OWM_KEY = "311da565f6bbe61c1896ea46b2f8c353";

const PublicDashboard = ({ incidents, onOpenLogin }) => {
  const [activeView, setActiveView] = useState('home');
  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [data, setData] = useState(incidents || []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resW = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=-6.99&lon=110.42&appid=${OWM_KEY}&units=metric&lang=id`);
        setWeather(resW.data);
        const [resInc, resNews] = await Promise.all([
          axios.get('https://nupeduli-pusdatin-nu-backend.hf.space/api/incidents/public'),
          axios.get('https://nupeduli-pusdatin-nu-backend.hf.space/api/news').catch(() => ({ data: [] }))
        ]);
        setData(resInc.data);
        setNews(resNews.data);
      } catch (e) { console.log("Sync error"); }
    };
    fetchData();
  }, [incidents]);

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <header className="h-12 border-b flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src="https://pwnu-jateng.org/uploads/infoumum/20250825111304-2025-08-25infoumum111252.png" className="h-6" alt="logo" />
          <h1 className="text-[10px] font-black text-[#006432] uppercase tracking-widest">NU PEDULI MONITORING</h1>
        </div>
        <i className="far fa-user-circle text-slate-300 text-lg cursor-pointer" onClick={onOpenLogin}></i>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {activeView === 'home' ? (
          <div className="p-4 space-y-6">
            <div className="flex justify-around items-center py-4">
              <KPIItem label="MISI" value={data.length} icon="fire" color="text-red-500" />
              <KPIItem label="RELAWAN" value={142} icon="users" color="text-green-600" />
              <KPIItem label="ASET" value={24} icon="box" color="text-yellow-600" />
              <KPIItem label="WILAYAH" value={35} icon="map-marker-alt" color="text-blue-600" />
            </div>

            <div className="h-[300px] border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <MapContainer center={[-7.15, 110.14]} zoom={8} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" />
                {data.map((inc, i) => (
                  <CircleMarker key={i} center={[parseFloat(inc.latitude) || 0, parseFloat(inc.longitude) || 0]} radius={8} pathOptions={{ fillColor: 'red', color: 'white', weight: 2, fillOpacity: 0.8 }}>
                    <Popup><div className="text-[10px] font-bold">{inc.title}</div></Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase mb-2">Kondisi Cuaca Jateng</h3>
                  {weather && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-[#006432]">{Math.round(weather.main.temp)}°C</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{weather.weather[0].description}</p>
                      </div>
                      <i className="fas fa-cloud-sun text-3xl text-yellow-500"></i>
                    </div>
                  )}
               </div>
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase mb-2">Mission Progress Feed</h3>
                  <div className="space-y-2">
                    {data.slice(0, 2).map((inc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{inc.title}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1">Berita & Gap Analisis</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {news.slice(0, 3).map((n, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg text-[10px] font-bold text-slate-600">{n.title}</div>
                    ))}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Logistik Terpenuhi</p>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 w-[65%]"></div></div>
                    <p className="text-[8px] font-bold text-right mt-1 text-orange-600">65% Terdistribusi</p>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-8">
             <h2 className="text-xl font-black text-[#006432] uppercase italic">NGO Institutional Hub</h2>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border rounded-2xl bg-slate-50">
                   <i className="fas fa-user-check text-2xl text-green-600 mb-2"></i>
                   <p className="text-lg font-black">1,240</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">Relawan</p>
                </div>
                <div className="p-6 border rounded-2xl bg-slate-50">
                   <i className="fas fa-truck-moving text-2xl text-yellow-600 mb-2"></i>
                   <p className="text-lg font-black">24</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">Armada</p>
                </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t flex items-center justify-around px-4 z-[5000]">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1 ${activeView === 'home' ? 'text-[#006432]' : 'text-slate-300'}`}>
          <i className="fas fa-home text-sm"></i>
          <span className="text-[7px] font-black uppercase">DASH</span>
        </button>
        <button onClick={() => window.location.href='/lapor'} className="relative -top-4 bg-red-600 text-white w-12 h-12 rounded-full shadow-lg border-4 border-white flex items-center justify-center"><i className="fas fa-bullhorn text-lg"></i></button>
        <button onClick={() => setActiveView('resources')} className={`flex flex-col items-center gap-1 ${activeView === 'resources' ? 'text-[#006432]' : 'text-slate-300'}`}>
          <i className="fas fa-boxes text-sm"></i>
          <span className="text-[7px] font-black uppercase">RESOURCE</span>
        </button>
      </nav>
    </div>
  );
};

const KPIItem = ({ label, value, icon, color }) => (
  <div className="flex flex-col items-center">
    <i className={`fas fa-${icon} ${color} text-xs mb-1`}></i>
    <p className="text-lg font-black text-slate-800 leading-none">{value}</p>
    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
  </div>
);

export default PublicDashboard;