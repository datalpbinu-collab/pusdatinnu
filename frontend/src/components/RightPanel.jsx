import React, { useState } from 'react';
import api from '../services/api';

const RightPanel = ({ selected, colors, onAction, onUpdate }) => {
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  if (!selected) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 bg-slate-50/50 italic">
      <i className="fas fa-satellite-dish text-6xl mb-4 opacity-20"></i>
      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Tactical Selection</p>
    </div>
  );

  // --- FUNGSI BYPASS KE COMPLETE (QUICK RESOLVE) ---
  const handleQuickResolve = () => {
    const confirmMsg = selected.priority_score > 500 
      ? "Peringatan: Bencana ini memiliki skor prioritas TINGGI. Tetap nyatakan selesai tanpa aksi lanjutan?"
      : "Nyatakan kejadian ini selesai/kondusif tanpa aksi lanjutan?";
      
    if (window.confirm(confirmMsg)) {
      onUpdate(selected.id, 'completed'); // Langsung update ke status Hitam (Complete)
    }
  };

  const findHelpers = async () => {
    setIsScanning(true);
    try {
      const res = await api.get(`/api/volunteers/nearby?lat=${selected.latitude}&lng=${selected.longitude}&expertise=SAR`);
      setNearbyVolunteers(res.data);
    } catch (err) { console.error("Radar Failure"); }
    finally { setIsScanning(false); }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-white overflow-y-auto font-sans border-l border-slate-100 shadow-2xl">
      
      {/* HEADER DETAIL */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
           <span className="text-[9px] bg-nu-gold/20 text-nu-green px-3 py-1 rounded-full font-black border border-nu-gold/30">
             {selected.incident_code || 'TAC-PENDING'}
           </span>
           {selected.is_ai_generated && (
             <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-black uppercase">
               <i className="fas fa-robot mr-1"></i> AI Synced
             </span>
           )}
        </div>
        <h3 className="text-2xl font-black text-nu-green uppercase italic leading-none tracking-tighter mb-1">{selected.title}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase">{selected.disaster_type} • {selected.region}</p>
      </div>

      {/* --- SEKSI PRIORITAS & QUICK ACTION --- */}
      <div className="mb-8 bg-slate-50 rounded-[35px] p-6 border border-slate-100 shadow-inner">
         <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Severity Matrix</h4>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white ${selected.priority_score > 1000 ? 'bg-red-600' : 'bg-nu-green'}`}>
                {selected.priority_level || 'LOW'}
            </span>
         </div>
         
         <div className="flex flex-col items-center mb-6">
            <p className={`text-5xl font-black italic tracking-tighter ${selected.priority_score > 1000 ? 'text-red-700' : 'text-slate-800'}`}>
                {selected.priority_score || 0} <small className="text-xs font-bold text-slate-400 uppercase">Pts</small>
            </p>
         </div>

         {/* TOMBOL QUICK RESOLVE (BYPASS SYSTEM) */}
         <button 
            onClick={handleQuickResolve}
            className="w-full bg-slate-800 hover:bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all flex items-center justify-center gap-2"
         >
            <i className="fas fa-check-double text-nu-gold"></i>
            Close Incident (No Action Needed)
         </button>
         <p className="text-[8px] text-slate-400 mt-3 text-center italic">Gunakan tombol di atas jika kejadian bersifat minor atau situasi sudah terkendali di lokasi.</p>
      </div>

      {/* --- SEKSI OPERATIONAL WORKFLOW --- */}
      <div className="space-y-3 mb-8">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 block mb-2">Standard Operation Cycle</label>
        <StepButton number="1" label="Verifikasi" status="verified" current={selected} onClick={() => onUpdate(selected.id, 'verified')} />
        <StepButton number="2" label="Assessment" status="assessment" current={selected} onClick={() => onAction('assess')} />
        <StepButton number="3" label="Instruksi" status="commanded" current={selected} onClick={() => onAction('instruksi')} />
        <StepButton number="4" label="Monitor" status="responded" current={selected} onClick={() => onAction('action')} />
      </div>

      {/* --- SEKSI RADAR ZONASI --- */}
      <div className="bg-[#020617] p-5 rounded-[40px] border border-white/5 shadow-2xl mb-6 relative overflow-hidden">
        <button 
          onClick={findHelpers} 
          disabled={isScanning}
          className="w-full bg-[#006432] hover:bg-green-700 text-white py-4 rounded-[20px] text-[10px] font-black uppercase mb-4 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <i className={`fas ${isScanning ? 'fa-spinner fa-spin' : 'fa-radar'} text-nu-gold`}></i> 
          {isScanning ? 'Syncing...' : 'Scan Nearby Assets'}
        </button>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
           {nearbyVolunteers.map(v => (
             <div key={v.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group">
               <div className="leading-tight">
                 <p className="text-[10px] font-black text-green-400 uppercase">{v.full_name}</p>
                 <p className="text-[9px] text-slate-500 font-bold italic">{parseFloat(v.distance).toFixed(2)} KM</p>
               </div>
               <button className="bg-nu-gold text-green-950 px-3 py-1 rounded-xl text-[8px] font-black uppercase transition-all hover:scale-105">Tugaskan</button>
             </div>
           ))}
        </div>
      </div>

      {/* FOOTER PDF */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <button className="w-full bg-[#c5a059] text-green-950 font-black py-4 rounded-3xl text-[11px] uppercase shadow-xl hover:translate-y-[-2px] transition-all">
          <i className="fas fa-file-pdf mr-2"></i> Download Integrated SPJ
        </button>
      </div>
    </div>
  );
};

// --- SUB KOMPONEN TOMBOL WORKFLOW ---
const StepButton = ({ number, label, status, current, onClick }) => {
  const steps = ['reported', 'verified', 'assessment', 'commanded', 'responded', 'completed'];
  const currentIndex = steps.indexOf(current.status);
  const targetIndex = steps.indexOf(status);
  const isDone = currentIndex >= targetIndex;
  const isActive = current.status === status;

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-[25px] cursor-pointer transition-all border-2 
      ${isActive ? 'border-nu-green bg-green-50 shadow-lg' : isDone ? 'border-slate-50 bg-slate-50 opacity-90' : 'border-slate-50 opacity-40'}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] 
      ${isDone ? 'bg-nu-green text-white shadow-xl' : 'bg-slate-200 text-slate-400'}`}>
        {isDone ? <i className="fas fa-check text-[9px]"></i> : number}
      </div>
      <div className="flex flex-col">
        <span className={`text-[11px] font-black uppercase tracking-tight ${isDone ? 'text-nu-green' : 'text-slate-300'}`}>{label}</span>
        {isActive && <span className="text-[7px] text-nu-green font-black animate-pulse uppercase tracking-widest leading-none mt-1">Operational</span>}
      </div>
    </div>
  );
};

export default RightPanel;