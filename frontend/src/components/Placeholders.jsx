import React from 'react';

// Komponen standar untuk bagian yang belum diisi detailnya
const Placeholder = ({ name }) => (
  <div className="p-8 text-center bg-white rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#006432] mx-auto mb-4">
      <i className="fas fa-tools text-xl"></i>
    </div>
    <h2 className="text-xl font-black text-[#006432] uppercase italic tracking-tighter">{name}</h2>
    <p className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-widest">Komponen sedang dalam tahap sinkronisasi...</p>
  </div>
);

// Komponen-komponen yang dipanggil oleh App.jsx
export const MapHUD = () => <Placeholder name="Command Center (Map HUD)" />;
export const MissionManager = () => <Placeholder name="Mission Manager" />;
export const InventoryView = () => <Placeholder name="Strategic Assets Hub" />;
export const Wallboard = () => <Placeholder name="Strategic Monitoring Wall" />;

// Footer hitam di bagian bawah (Log System)
export const LogFooter = () => (
  <div className="h-10 bg-[#020617] border-t border-white/5 flex items-center px-4 overflow-hidden shrink-0 z-[2000] text-slate-500 text-[9px] uppercase tracking-widest">
    <span className="flex items-center gap-2">
      <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
      System Secure • Handshake established • Pusdatin NU Jateng
    </span>
  </div>
);

// Komponen tambahan untuk alur kerja bencana
export const LogisticsHub = () => <Placeholder name="Logistics Request Hub" />;
export const Assessment = () => <Placeholder name="Detailed Assessment" />;
export const InstructionView = () => <Placeholder name="Instruction View" />;
export const ActionView = () => <Placeholder name="Action View" />;