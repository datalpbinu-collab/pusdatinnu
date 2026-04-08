import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const InventoryView = ({ inventory = [], onRefresh }) => {
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] h-full overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-8 border-b-2 border-green-50 pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-nu-green uppercase italic tracking-tighter leading-none">Strategic Assets Hub</h2>
        <button onClick={() => setShowVolunteerForm(true)} className="bg-nu-gold text-green-950 px-6 py-2 rounded-full font-black text-xs shadow-lg">+ DATA RELAWAN (SOP)</button>
      </div>

      {/* 1. MAP SEBARAN ASET (HIGH-END) */}
      <div className="h-64 md:h-80 w-full bg-white rounded-[40px] shadow-2xl border-[10px] border-white overflow-hidden mb-10 relative">
         <MapContainer center={[-7.15, 110.14]} zoom={7} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {/* Logic: Menampilkan Marker khusus Aset / Gudang / Ambulans */}
         </MapContainer>
         <div className="absolute top-4 right-4 z-[1000] bg-white/80 p-3 rounded-2xl text-[8px] font-bold uppercase tracking-widest shadow-lg italic">Tactical Resource Map</div>
      </div>

      {/* 2. GRID KARTU ASET (BENTO STYLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventory.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[35px] border border-slate-50 shadow-lg flex flex-col justify-between hover:scale-105 transition-all group">
            <div className="flex justify-between items-start mb-4">
               <div className="min-w-0">
                  <span className="text-[8px] font-black text-nu-green bg-green-50 px-2 py-0.5 rounded uppercase tracking-tighter">{item.type}</span>
                  <h4 className="text-slate-800 font-black text-sm uppercase italic mt-1 truncate leading-none">{item.name}</h4>
               </div>
               <div className="shrink-0 text-right">
                  <span className="text-2xl font-black text-nu-green leading-none">{item.available_quantity}</span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-tighter">/{item.quantity}</span>
               </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner mt-4">
              <div className="h-full bg-nu-green transition-all duration-1000 shadow-sm" style={{ width: `${(item.available_quantity / item.quantity) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default InventoryView;