import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Assessment = ({ incident, onBack }) => {
  // State Dropdown Wilayah
  const [listKab, setListKab] = useState([]);
  const [listKec, setListKec] = useState([]);
  const [listDesa, setListDesa] = useState([]);

  // Form State (Semua Field dari pwnu_assess.html)
  const [data, setData] = useState({
    // I. Identitas & Lokasi
    disaster_type: incident.disaster_type || '',
    region: incident.region || '',
    kecamatan: incident.kecamatan || '',
    desa: incident.desa || '',
    alamat_spesifik: incident.alamat_spesifik || '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: "12:00",
    latitude: incident.latitude || 0,
    longitude: incident.longitude || 0,

    // II. Narasi
    kondisi_mutakhir: incident.kondisi_mutakhir || '',
    upaya_penanganan: incident.upaya_penanganan || '',
    sebaran_dampak: incident.sebaran_dampak || '',

    // III. Kebutuhan (Essay)
    kebutuhan: incident.kebutuhan || { dana: '', relawan: '', logistik: '', peralatan: '', medis: '' },

    // IV. Dampak Manusia (Jiwa)
    dampak_manusia: incident.dampak_manusia || { meninggal: 0, hilang: 0, sakit: 0, mengungsi: 0, terdampak: 0 },

    // V. Kerusakan Fisik (Unit)
    dampak_rumah: incident.dampak_rumah || { berat: 0, sedang: 0, ringan: 0 },
    dampak_fasum: incident.dampak_fasum || { faskes: 0, ibadah: 0, sekolah: 0, kantor: 0, pasar: 0 },

    // VI. Sarana Vital & Lingkungan
    dampak_vital: incident.dampak_vital || { air: 0, listrik: 0, telkom: 0, irigasi: 0, jalan: 0, spbu: 0 },
    dampak_lingkungan: incident.dampak_lingkungan || { sawah: 0, ternak: 0 }
  });

  // Load API Wilayah
  useEffect(() => {
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/33.json`).then(r => r.json()).then(setListKab);
  }, []);

  const changeKab = (id, name) => {
    setData({...data, region: name});
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`).then(r => r.json()).then(setListKec);
  };

  const changeKec = (id, name) => {
    setData({...data, kecamatan: name});
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`).then(r => r.json()).then(setListDesa);
  };

  const handleSave = async () => {
    try {
      await api.patch(`/api/incidents/${incident.id}/assessment`, data);
      alert("Assessment Berhasil Diperbarui!");
      onBack();
    } catch (e) { alert("Gagal Simpan. Cek koneksi backend."); }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] font-sans">
      {/* HEADER STICKY */}
      <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
        <button onClick={onBack} className="text-nu-green font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-chevron-left"></i> Batal
        </button>
        <h2 className="font-black text-nu-green uppercase italic tracking-tighter">Detailed Assessment PWNU Jateng</h2>
        <button onClick={handleSave} className="bg-nu-green text-white px-8 py-2 rounded-full font-black text-xs shadow-lg hover:bg-green-800 transition-all uppercase tracking-widest">
          Update Data Mutakhir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-40">
        
        {/* SEKSI I: LOKASI & WAKTU */}
        <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <SectionTitle icon="map-marked-alt" title="I. Identitas, Lokasi & Waktu" />
          <div className="grid grid-cols-3 gap-6 mb-6">
            <SelectField label="Kabupaten" options={listKab} onChange={(id, name) => changeKab(id, name)} />
            <SelectField label="Kecamatan" options={listKec} onChange={(id, name) => changeKec(id, name)} />
            <SelectField label="Desa / Kelurahan" options={listDesa} onChange={(id, name) => setData({...data, desa: name})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
             <InputField label="Alamat Spesifik (RT/RW/Dukuh)" placeholder="Contoh: RT 02 RW 01 Dusun Krajan" value={data.alamat_spesifik} onChange={v => setData({...data, alamat_spesifik: v})} />
             <div className="grid grid-cols-2 gap-4">
                <InputField label="Tanggal Kejadian" type="date" value={data.event_date} onChange={v => setData({...data, event_date: v})} />
                <InputField label="Waktu" type="time" value={data.event_time} onChange={v => setData({...data, event_time: v})} />
             </div>
          </div>
        </section>

        {/* SEKSI II: NARASI */}
        <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <SectionTitle icon="edit" title="II. Narasi Laporan" />
          <TextAreaField label="Kondisi Mutakhir" placeholder="Update situasi terkini..." value={data.kondisi_mutakhir} onChange={v => setData({...data, kondisi_mutakhir: v})} />
          <TextAreaField label="Upaya Penanganan" placeholder="Langkah yang sudah diambil..." value={data.upaya_penanganan} onChange={v => setData({...data, upaya_penanganan: v})} />
          <TextAreaField label="Sebaran Dampak" placeholder="Luasan wilayah terdampak..." value={data.sebaran_dampak} onChange={v => setData({...data, sebaran_dampak: v})} />
        </section>

        {/* SEKSI III: KEBUTUHAN */}
        <section className="bg-green-50 p-8 rounded-[40px] border border-green-100 shadow-sm">
           <SectionTitle icon="shopping-basket" title="III. Kebutuhan Mendesak (Essay)" color="text-green-800" />
           <div className="grid grid-cols-3 gap-6">
              <InputField label="Dana" value={data.kebutuhan.dana} onChange={v => setData({...data, kebutuhan: {...data.kebutuhan, dana: v}})} />
              <InputField label="Relawan" value={data.kebutuhan.relawan} onChange={v => setData({...data, kebutuhan: {...data.kebutuhan, relawan: v}})} />
              <InputField label="Logistik" value={data.kebutuhan.logistik} onChange={v => setData({...data, kebutuhan: {...data.kebutuhan, logistik: v}})} />
           </div>
        </section>

        {/* SEKSI IV: DAMPAK JIWA */}
        <section className="bg-red-50 p-8 rounded-[40px] border border-red-100 shadow-sm">
          <SectionTitle icon="users" title="IV. Dampak Manusia (Jiwa)" color="text-red-700" />
          <div className="grid grid-cols-5 gap-4">
            {Object.keys(data.dampak_manusia).map(k => (
              <NumberInput key={k} label={k} value={data.dampak_manusia[k]} onChange={v => setData({...data, dampak_manusia: {...data.dampak_manusia, [k]: v}})} />
            ))}
          </div>
        </section>

        {/* SEKSI V: KERUSAKAN FISIK */}
        <section className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 shadow-sm space-y-8">
          <div>
            <SectionTitle icon="home" title="V. Kerusakan Rumah (Unit)" color="text-orange-700" />
            <div className="grid grid-cols-3 gap-6">
              {Object.keys(data.dampak_rumah).map(k => (
                <NumberInput key={k} label={`Rusak ${k}`} value={data.dampak_rumah[k]} onChange={v => setData({...data, dampak_rumah: {...data.dampak_rumah, [k]: v}})} />
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-orange-200">
            <SectionTitle icon="building" title="Fasilitas Umum" color="text-orange-700" />
            <div className="grid grid-cols-5 gap-4">
              {Object.keys(data.dampak_fasum).map(k => (
                <NumberInput key={k} label={k} value={data.dampak_fasum[k]} onChange={v => setData({...data, dampak_fasum: {...data.dampak_fasum, [k]: v}})} />
              ))}
            </div>
          </div>
        </section>

        {/* SEKSI VI: SARANA VITAL */}
        <section className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 shadow-sm">
           <SectionTitle icon="faucet" title="VI. Sarana Vital & Lingkungan" color="text-blue-800" />
           <div className="grid grid-cols-6 gap-4 mb-8">
              {Object.keys(data.dampak_vital).map(k => (
                <NumberInput key={k} label={k} value={data.dampak_vital[k]} onChange={v => setData({...data, dampak_vital: {...data.dampak_vital, [k]: v}})} />
              ))}
           </div>
           <div className="grid grid-cols-2 gap-6 pt-6 border-t border-blue-200">
              <NumberInput label="Sawah (Ha)" value={data.dampak_lingkungan.sawah} onChange={v => setData({...data, dampak_lingkungan: {...data.dampak_lingkungan, sawah: v}})} />
              <NumberInput label="Ternak (Ekor)" value={data.dampak_lingkungan.ternak} onChange={v => setData({...data, dampak_lingkungan: {...data.dampak_lingkungan, ternak: v}})} />
           </div>
        </section>

      </div>
    </div>
  );
};

// UI REUSABLE HELPERS
const SectionTitle = ({ icon, title, color = "text-nu-green" }) => (
  <div className={`flex items-center gap-3 mb-6 ${color}`}>
    <div className="w-10 h-10 rounded-2xl bg-current bg-opacity-10 flex items-center justify-center">
      <i className={`fas fa-${icon} text-lg`}></i>
    </div>
    <h3 className="font-black uppercase text-xs tracking-[0.2em]">{title}</h3>
  </div>
);

const InputField = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="flex flex-col gap-1 flex-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">{label}</label>
    <input type={type} className="p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-nu-green transition-all" 
      placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const SelectField = ({ label, options, onChange }) => (
  <div className="flex flex-col gap-1 flex-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">{label}</label>
    <select className="p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner" 
      onChange={e => onChange(e.target.value, e.target.options[e.target.selectedIndex].text)}>
      <option value="">Pilih {label}</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">{label}</label>
    <textarea className="p-5 bg-slate-50 border-none rounded-[30px] text-sm font-medium shadow-inner" 
      rows="3" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const NumberInput = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-slate-400 uppercase text-center mb-1">{label}</label>
    <input type="number" className="p-4 bg-white border border-slate-100 rounded-[20px] text-center font-black text-xl shadow-sm focus:ring-2 ring-nu-green" 
      value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} />
  </div>
);

export default Assessment;