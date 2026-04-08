import React from 'react';

const IntelligencePanel = () => {
  return (
    <div className="w-72 bg-gradient-to-br from-white/90 to-slate-50/40 backdrop-blur-md p-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 pointer-events-auto animate-in slide-in-from-left duration-700">
      <div className="flex items-center gap-2 mb-4 border-b border-nu-green/10 pb-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
        <h2 className="text-[10px] font-black text-nu-green uppercase tracking-widest leading-none">Intelligence Feed</h2>
      </div>
      
      <div className="space-y-4">
        <SensorItem name="S. Wulan (Demak)" level="710" status="SIAGA 1" color="text-red-600" />
        <SensorItem name="S. Juwana (Pati)" level="450" status="NORMAL" color="text-green-600" />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
         <p className="text-[8px] font-bold text-slate-400 uppercase italic">Seismik Regional: Aman</p>
      </div>
    </div>
  );
};

const SensorItem = ({ name, level, status, color }) => (
  <div className="flex justify-between items-end">
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{name}</p>
      <p className="text-xl font-black text-slate-800 leading-none">{level} <small className="text-[10px] font-bold">cm</small></p>
    </div>
    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 ${color}`}>{status}</span>
  </div>
);

export default IntelligencePanel;