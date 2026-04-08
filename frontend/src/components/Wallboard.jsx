import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Wallboard = ({ incidents }) => {
  // Data dummy untuk grafik tren
  const data = [
    { name: 'Banjir', total: incidents.filter(i => i.disaster_type === 'Banjir').length },
    { name: 'Longsor', total: incidents.filter(i => i.disaster_type === 'Longsor').length },
    { name: 'Angin', total: incidents.filter(i => i.disaster_type === 'Angin Puting Beliung').length },
  ];

  return (
    <div className="h-full bg-[#020617] p-8 text-white font-mono overflow-hidden flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-8">
        <h2 className="text-2xl font-black italic tracking-widest text-nu-gold">STRATEGIC MONITORING WALL</h2>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase">System Status</p>
          <p className="text-green-500 font-bold animate-pulse">OPTIMAL / ENCRYPTED</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 flex-1">
        {/* Kolom 1: Statistik Kecepatan Respon */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase">Incident Frequency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#475569" fontSize={10} />
              <Bar dataKey="total" fill="#006432" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Kolom 2: Critical Flash News */}
        <div className="col-span-2 bg-red-950/20 p-6 rounded-3xl border border-red-900/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fas fa-biohazard text-9xl"></i>
          </div>
          <h3 className="text-xs font-bold text-red-500 mb-4 uppercase">Critical Alerts</h3>
          <div className="space-y-4">
            {incidents.filter(i => i.status === 'reported').map(i => (
              <div key={i.id} className="flex gap-4 items-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 animate-pulse">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
                <div>
                  <p className="text-sm font-black uppercase tracking-tighter">{i.title}</p>
                  <p className="text-[10px] text-red-400 font-bold">Laporan warga belum diverifikasi!</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee Footer (Teks Berjalan) */}
      <div className="mt-8 bg-nu-green/20 p-3 border-y border-nu-green/30 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block text-nu-gold font-bold text-xs uppercase tracking-[0.5em]">
          +++ PUSDATIN NU PEDULI JAWA TENGAH : MENGABDI UNTUK KEMANUSIAAN +++ KOORDINASI NASIONAL AKTIF +++ ZONASI GPS RELAWAN TERKUNCI +++
        </div>
      </div>
    </div>
  );
};

export default Wallboard;