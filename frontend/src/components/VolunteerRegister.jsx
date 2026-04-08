import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VolunteerRegister = () => {
  const [loc, setLoc] = useState({ lat: null, lng: null });
  const [form, setForm] = useState({ full_name: '', phone: '', expertise: [] });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!loc.lat) return alert("GPS Wajib Aktif!");
    await api.post('/api/inventory/volunteers', { ...form, ...loc });
    alert("Berhasil! Anda masuk dalam radar zonasi Pusdatin.");
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border-t-8 border-nu-green">
        <h2 className="text-xl font-black text-nu-green uppercase italic mb-2">Registrasi Relawan</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">Aktifkan GPS untuk Masuk Sistem Zonasi</p>
        
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full p-4 bg-slate-50 rounded-2xl text-sm" placeholder="Nama Lengkap" required onChange={e => setForm({...form, full_name: e.target.value})} />
          <input className="w-full p-4 bg-slate-50 rounded-2xl text-sm" placeholder="No WA" required onChange={e => setForm({...form, phone: e.target.value})} />
          
          <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-100 flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${loc.lat ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-black text-green-700 uppercase">
                {loc.lat ? 'Zonasi GPS Aktif' : 'Mencari Lokasi...'}
             </span>
          </div>

          <button type="submit" disabled={!loc.lat} className="w-full bg-nu-green text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest">Daftar Sekarang</button>
        </form>
      </div>
    </div>
  );
};
export default VolunteerRegister;