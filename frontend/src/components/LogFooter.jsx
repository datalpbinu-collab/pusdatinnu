import React from 'react';

const LogFooter = ({ logs }) => {
  return (
    <footer className="h-10 bg-[#020617] border-t border-white/5 flex items-center px-4 overflow-hidden shrink-0 z-[2000]">
      {/* Label Terminal */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-4 h-full">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">Ops_Log:</span>
      </div>

      {/* Konten Log Berjalan secara Horizontal agar tidak makan tempat */}
      <div className="flex-1 px-4 overflow-hidden whitespace-nowrap relative flex items-center h-full">
        <div className="flex gap-8 animate-marquee-slow">
          {logs.length > 0 ? logs.map((log, i) => (
            <span key={i} className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log}
            </span>
          )) : (
            <span className="text-[9px] font-mono text-slate-700 italic tracking-widest uppercase">
              System Secure • Handshake established • Awaiting tactical packets...
            </span>
          )}
        </div>
      </div>

      {/* Status Koneksi */}
      <div className="pl-4 border-l border-white/10 h-full flex items-center gap-4">
         <span className="text-[8px] font-bold text-slate-500 uppercase">Port: 5000</span>
         <span className="text-[8px] font-black text-green-900 bg-green-500/10 px-2 py-0.5 rounded">Active</span>
      </div>
    </footer>
  );
};

export default LogFooter;