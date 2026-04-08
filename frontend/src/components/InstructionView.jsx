import React, { useState } from 'react';
import api from '../services/api';

const InstructionView = ({ incident, onComplete }) => {
  const [form, setForm] = useState({
    pj_nama: 'Ketua PWNU Jawa Tengah',
    pic_lapangan: '',
    tim_anggota: '',
    armada_detail: '',
    peralatan_detail: ''
  });

  const submit = async () => {
    await api.post('/api/incidents/instructions', { ...form, incident_id: incident.id });
    alert("Surat Perintah Diterbitkan!"); onComplete();
  };

  return (
    <div className="p-10 bg-slate-100 h-full overflow-y-auto">
      <div className="bg-white p-12 max-w-2xl mx-auto shadow-2xl border-t-8 border-nu-green">
         <h3 className="text-center font-black text-nu-green uppercase mb-10">Konsep Surat Perintah Tugas</h3>
         <div className="space-y-6">
            <input className="w-full p-4 bg-slate-50 border-none rounded-xl" placeholder="PIC Lapangan" onChange={e=>setForm({...form, pic_lapangan:e.target.value})} />
            <textarea className="w-full p-4 bg-slate-50 border-none rounded-xl" placeholder="Nama Tim" onChange={e=>setForm({...form, tim_anggota:e.target.value})} />
            <textarea className="w-full p-4 bg-slate-50 border-none rounded-xl" placeholder="Armada" onChange={e=>setForm({...form, armada_detail:e.target.value})} />
            <textarea className="w-full p-4 bg-slate-50 border-none rounded-xl" placeholder="Alat" onChange={e=>setForm({...form, peralatan_detail:e.target.value})} />
            <button onClick={submit} className="w-full bg-nu-gold py-4 rounded-xl font-bold uppercase">Terbitkan & Kirim Instruksi</button>
         </div>
      </div>
    </div>
  );
};
export default InstructionView;