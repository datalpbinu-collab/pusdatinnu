import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PublicReport = () => {
  const [loc, setLoc] = useState({ lat: null, lng: null });
  const [form, setForm] = useState({
    reporter_name: '',
    whatsapp_number: '',
    disaster_type: 'Banjir',
    description: '',
    photo: null
  });

  // Ambil GPS otomatis saat halaman dibuka
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const handleFile = (e) => {
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => setForm({ ...form, photo: reader.result });
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!loc.lat) return alert("Mohon aktifkan GPS Anda!");
    try {
      await api.post('/api/incidents', {
        title: `Laporan Warga: ${form.disaster_type}`,
        disaster_type: form.disaster_type,
        latitude: loc.lat,
        longitude: loc.lng,
        status: 'reported'
      });
      alert("Laporan Terkirim! Tim NU Peduli akan segera melakukan verifikasi.");
      window.location.reload();
    } catch (err) { alert("Gagal mengirim laporan"); }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border-t-[10px] border-nu-green">
        <div className="p-8 text-center">
          <img src="https://upload.wikimedia.org/wikipedia/id/thumb/a/a2/Logo_Nahdlatul_Ulama.svg/1200px-Logo_Nahdlatul_Ulama.svg.png" className="h-16 mx-auto mb-4" />
          <h2 className="text-xl font-black text-nu-green uppercase tracking-tighter">NU Peduli Jateng</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Laporan Darurat Warga</p>
        </div>

        <form onSubmit={submitReport} className="p-8 pt-0 space-y-5">
          <input className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none shadow-inner" placeholder="Nama Lengkap" required 
            onChange={e => setForm({...form, reporter_name: e.target.value})} />
          
          <input className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none shadow-inner" placeholder="Nomor WhatsApp (08...)" required 
            onChange={e => setForm({...form, whatsapp_number: e.target.value})} />

          <select className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none shadow-inner font-bold text-nu-green"
            onChange={e => setForm({...form, disaster_type: e.target.value})}>
            <option>Banjir</option><option>Longsor</option><option>Angin Puting Beliung</option><option>Gempa Bumi</option>
          </select>

          <textarea className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none shadow-inner" rows="3" placeholder="Gambarkan situasi kejadian..." required
            onChange={e => setForm({...form, description: e.target.value})} />

          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" id="cam" />
            <label htmlFor="cam" className="cursor-pointer flex flex-col items-center">
              <i className="fas fa-camera text-2xl text-nu-gold mb-2"></i>
              <span className="text-[10px] font-black text-slate-400 uppercase">Ambil Foto Kejadian</span>
            </label>
            {form.photo && <img src={form.photo} className="mt-4 rounded-xl shadow-md h-32 mx-auto" />}
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl">
            <div className={`w-3 h-3 rounded-full ${loc.lat ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <span className="text-[10px] font-bold text-green-700 uppercase">{loc.lat ? 'GPS Locked' : 'Searching GPS Signal...'}</span>
          </div>

          <button type="submit" disabled={!loc.lat} className="w-full bg-nu-green text-white font-black py-4 rounded-2xl shadow-xl hover:bg-green-800 transition-all uppercase tracking-widest disabled:bg-slate-200">
            Kirim Laporan Warga
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicReport;