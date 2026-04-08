import React, { useEffect, useState } from 'react';
import api from '../services/api';

const VolunteerModule = () => {
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    api.get('/api/map/command').then(res => setVolunteers(res.data.volunteers));
  }, []);

  return (
    <div className="p-8 bg-[#f8fafc] h-full overflow-y-auto font-sans">
      <h2 className="text-xl font-black text-nu-green uppercase italic mb-6 border-b-2 border-green-50 pb-2">
        Volunteer Force Management
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {volunteers.map(v => (
          <div key={v.id} className="bg-white p-5 rounded-[25px] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-nu-green transition-all">
            <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${v.status_tugas === 'standby' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {v.full_name.charAt(0)}
               </div>
               <div>
                  <h4 className="font-black text-slate-800 uppercase text-sm">{v.full_name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{v.regency} | {v.expertise?.join(', ')}</p>
               </div>
            </div>
            
            <div className="text-right">
               <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${v.status_tugas === 'standby' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-orange-500 text-white animate-pulse'}`}>
                  {v.status_tugas.replace('_', ' ')}
               </span>
               <p className="text-[8px] text-slate-300 mt-2 italic uppercase">Last GPS Ping: Just Now</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolunteerModule;