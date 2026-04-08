import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const CompleteView = ({ incidents = [], onRefresh, onAction, onSelect }) => {
  // --- STATE CORE ---
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- STATE TACTICAL & INSTRUCTION ---
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [waitingList, setWaitingList] = useState([]); 
  const [isScanning, setIsScanning] = useState(false);
  const [showInstructionForm, setShowInstructionForm] = useState(false);
  
  // State Form Instruksi Sesuai Permintaan
  const [instForm, setInstForm] = useState({
    pj_nama: 'Ketua PWNU Jawa Tengah',
    koordinator: '',
    petugas: [], // Array nama relawan terpilih
    armada: '',
    peralatan: '',
    lama_tugas: ''
  });

  const steps = ['reported', 'verified', 'assessment', 'commanded', 'responded', 'completed'];
  const kabJateng = ["Semarang", "Demak", "Kudus", "Pati", "Jepara", "Rembang", "Blora", "Grobogan", "Boyolali", "Solo", "Sukoharjo", "Wonogiri", "Karanganyar", "Sragen", "Klaten", "Magelang", "Temanggung", "Wonosobo", "Purworejo", "Kebumen", "Cilacap", "Banyumas", "Purbalingga", "Banjarnegara", "Batang", "Pekalongan", "Pemalang", "Tegal", "Brebes", "Kendal", "Salatiga"];

  // --- ENGINE: FILTERING & SORTING ---
  const filtered = incidents.filter(i => {
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchRegion = filterRegion === 'all' || i.region === filterRegion;
    const matchSearch = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchRegion && matchSearch;
  }).sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  // --- HANDLER: BUKA BARIS (SYNC DATA) ---
  const handleToggleRow = async (incident) => {
    if (expandedId === incident.id) {
      setExpandedId(null);
      setShowInstructionForm(false);
    } else {
      setExpandedId(incident.id);
      onSelect(incident);
      setIsScanning(true);
      try {
        const resRadar = await api.get(`/api/incidents/volunteers/nearby?lat=${incident.latitude}&lng=${incident.longitude}`);
        setNearbyVolunteers(resRadar.data || []);
        
        const resWait = await api.get(`/api/volunteers/deployments/${incident.id}`);
        setWaitingList(resWait.data || []);
      } catch (e) { console.error("Sync Error"); }
      finally { setIsScanning(false); }
    }
  };

  // --- HANDLER: SUBMIT INSTRUKSI (SP) ---
  const submitInstruction = async (incidentId) => {
    if (!instForm.koordinator || instForm.petugas.length === 0) {
      return alert("Pilih Koordinator dan Petugas dari daftar relawan!");
    }
    try {
      await api.post('/api/incidents/instructions', {
        incident_id: incidentId,
        pj_nama: instForm.pj_nama,
        pic_lapangan: instForm.koordinator,
        tim_anggota: instForm.petugas.join(', '),
        armada_detail: instForm.armada,
        peralatan_detail: instForm.peralatan,
        duration: instForm.lama_tugas
      });
      alert("✓ SURAT PERINTAH BERHASIL DITERBITKAN!");
      setShowInstructionForm(false);
      onRefresh();
    } catch (e) { alert("Gagal menerbitkan instruksi."); }
  };

  const generatePDF = async (id) => {
    try {
      const res = await api.get(`/api/incidents/${id}/full-report`);
      const { incident } = res.data;
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold").setFontSize(16).text("LAPORAN TERPADU NU PEDULI JATENG", 105, 15, {align:'center'});
      autoTable(doc, { startY: 25, body: [['KODE', incident.incident_code],['BENCANA', incident.title],['STATUS', incident.status.toUpperCase()]] });
      doc.save(`SPJ_${incident.incident_code}.pdf`);
    } catch (e) { alert("PDF Error"); }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] h-full overflow-y-auto font-sans custom-scrollbar">
      
      {/* HEADER & FILTER TETAP KONSISTEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-green-50 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-black text-nu-green uppercase italic tracking-tighter leading-none">Mission Control Manager</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Professional Deployment System</p>
        </div>
        <div className="flex gap-4">
           <select className="p-3 bg-white border rounded-2xl text-xs font-black text-nu-green shadow-sm outline-none" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
             <option value="all">SEMUA CABANG</option>
             {kabJateng.sort().map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
           </select>
        </div>
      </div>

      {/* LIST MISSION */}
      <div className="space-y-5 pb-40">
        {filtered.map(i => (
          <div key={i.id} className={`bg-white rounded-[45px] border transition-all duration-500 overflow-hidden ${expandedId === i.id ? 'shadow-2xl border-nu-green ring-8 ring-green-50' : 'shadow-md border-slate-100 hover:shadow-lg'}`}>
            
            <div className="p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer gap-6" onClick={() => handleToggleRow(i)}>
              <div className="flex gap-6 items-center flex-1">
                 <div className={`w-14 h-14 rounded-[22px] flex flex-col items-center justify-center shadow-xl ${i.priority_score > 500 ? 'bg-red-600 shadow-red-200' : 'bg-nu-green shadow-green-200'} text-white`}>
                    <span className="text-[7px] font-black uppercase">PTS</span>
                    <span className="text-xl font-black italic">{i.priority_score || 0}</span>
                 </div>
                 <div className="leading-tight min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 uppercase italic text-md md:text-lg tracking-tighter truncate">{i.title}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest"><i className="fas fa-clock mr-1"></i> {new Date(i.created_at).toLocaleString()}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${i.status === 'completed' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white animate-pulse'}`}>{i.status}</span>
                 <i className={`fas fa-chevron-down transition-transform ${expandedId === i.id ? 'rotate-180 text-nu-green' : 'text-slate-300'}`}></i>
              </div>
            </div>

            {/* EXPANDED WORKSPACE */}
            {expandedId === i.id && (
              <div className="p-8 bg-white border-t border-slate-50 animate-in slide-in-from-top duration-500">
                 
                 {/* JIKA TOMBOL INSTRUKSI DIKLIK, TAMPILKAN FORM KHUSUS INI */}
                 {showInstructionForm ? (
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 shadow-inner animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-200">
                           <h3 className="text-xl font-black text-nu-green uppercase italic tracking-tighter">Drafting Surat Perintah Tugas</h3>
                           <button onClick={() => setShowInstructionForm(false)} className="text-slate-400 font-bold text-xs uppercase hover:text-red-500 transition-all">✕ Batalkan Form</button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                           <div className="space-y-4">
                              <Input label="Penanggung Jawab" value={instForm.pj_nama} onChange={v => setInstForm({...instForm, pj_nama: v})} />
                              
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Koordinator (Pilih dari Relawan Terverifikasi)</label>
                                 <select className="w-full p-4 bg-white border rounded-2xl font-bold text-nu-green shadow-sm" onChange={e => setInstForm({...instForm, koordinator: e.target.value})}>
                                    <option value="">-- Pilih Koordinator --</option>
                                    {waitingList.filter(v => v.status.includes('approved')).map(v => <option key={v.id} value={v.full_name}>{v.full_name} ({v.expertise})</option>)}
                                 </select>
                              </div>

                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Anggota Tim (Petugas)</label>
                                 <div className="max-h-40 overflow-y-auto bg-white p-4 rounded-2xl border space-y-2">
                                    {waitingList.length > 0 ? waitingList.map(v => (
                                       <label key={v.id} className="flex items-center gap-3 cursor-pointer group">
                                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-nu-green focus:ring-nu-green" 
                                            onChange={(e) => {
                                              const newPetugas = e.target.checked ? [...instForm.petugas, v.full_name] : instForm.petugas.filter(p => p !== v.full_name);
                                              setInstForm({...instForm, petugas: newPetugas});
                                            }}
                                          />
                                          <span className="text-xs font-bold text-slate-600 group-hover:text-nu-green transition-all">{v.full_name} <small className="text-slate-400 ml-2 font-normal italic">({v.expertise} - {v.region})</small></span>
                                       </label>
                                    )) : <p className="text-slate-300 italic text-[10px]">Belum ada relawan yang terverifikasi untuk misi ini.</p>}
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <Input label="Lama Tugas (Estimasi Jam/Hari)" placeholder="Misal: 3 Hari Operasional" onChange={v => setInstForm({...instForm, lama_tugas: v})} />
                              <TextArea label="Aset Armada yang Digunakan" placeholder="Misal: 2 Unit Ambulans, 1 Mobil Ops" onChange={v => setInstForm({...instForm, armada: v})} />
                              <TextArea label="Peralatan Teknis" placeholder="Misal: Tenda, Genset, Alat Vertical Rescue" onChange={v => setInstForm({...instForm, peralatan: v})} />
                           </div>
                        </div>

                        <button onClick={() => submitInstruction(i.id)} className="w-full bg-[#006432] text-white font-black py-5 rounded-[25px] shadow-xl hover:bg-green-800 transition-all uppercase tracking-widest mt-8 flex items-center justify-center gap-3">
                           <i className="fas fa-signature text-nu-gold"></i> Terbitkan & Kirim Instruksi Resmi
                        </button>
                    </div>
                 ) : (
                    /* TAMPILAN NORMAL WORKSPACE */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       {/* A. AI INTEL */}
                       <div className="space-y-6">
                          <div className="bg-[#020617] p-6 rounded-[35px] border border-slate-800 shadow-2xl relative overflow-hidden text-green-400 font-mono">
                             <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest">AI Strategic Briefing</span>
                             </div>
                             <p className="text-[11px] text-slate-300 leading-relaxed italic">"{i.master_summary || i.kondisi_mutakhir || 'Analyzing geospatial data...'}"</p>
                          </div>
                          <div className="bg-nu-green/5 p-6 rounded-[35px] border border-nu-green/10">
                             <h4 className="text-[10px] font-black text-nu-green uppercase mb-4 flex items-center gap-2 tracking-[0.2em] font-sans"><i className="fas fa-brain"></i> Strategy SOP</h4>
                             <div className="space-y-3 font-sans">
                                <CheckItem label="Assessment Detail" checked={!!i.kecamatan} />
                                <CheckItem label="Instruksi SP Terbit" checked={['commanded','responded','completed'].includes(i.status)} />
                                <CheckItem label="Integrated SPJ Final" checked={i.status === 'completed'} />
                             </div>
                          </div>
                       </div>

                       {/* B. OPERATIONAL CONTROLLER */}
                       <div className="bg-slate-50 p-6 rounded-[40px] border border-slate-100 shadow-inner flex flex-col gap-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-2 text-center italic">Life Cycle Controller</h4>
                          <LifecycleBtn num="1" label="Verify" active={i.status==='reported'} done={i.status!=='reported'} onClick={()=>handleFlowUpdate(i, 'verified')} />
                          <LifecycleBtn num="2" label="Assess" active={i.status==='verified'} done={['assessment','commanded','responded','completed'].includes(i.status)} onClick={()=>onAction('assess')} />
                          <LifecycleBtn num="3" label="Command" active={i.status==='assessment'} done={['commanded','responded','completed'].includes(i.status)} onClick={()=>setShowInstructionForm(true)} />
                          <LifecycleBtn num="4" label="Action" active={i.status==='commanded'} done={['responded','completed'].includes(i.status)} onClick={()=>onAction('action')} />
                          <button onClick={()=>handleFlowUpdate(i, 'completed')} className="mt-4 bg-slate-900 text-white py-4 rounded-[25px] font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-all"><i className="fas fa-archive text-nu-gold"></i> Archive Incident</button>
                       </div>

                       {/* C. MOBILIZATION QUEUE */}
                       <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-inner flex flex-col gap-4 overflow-hidden h-[480px]">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Personnel Mobilization Queue</h4>
                          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                             {waitingList.map(v => (
                               <div key={v.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group">
                                  <div className="flex justify-between items-start">
                                     <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{v.full_name}</p>
                                     <span className="text-[7px] bg-nu-gold/20 text-nu-green px-2 py-0.5 rounded font-black uppercase">{v.status}</span>
                                  </div>
                                  <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">{v.region} • {v.expertise}</p>
                                  <div className="flex gap-2 mt-4">
                                     <button onClick={() => handleApproveDeployment(v.id, 'PCNU', 'approved_pcnu')} className="flex-1 bg-white border border-nu-green text-nu-green py-2 rounded-xl text-[8px] font-black uppercase hover:bg-nu-green hover:text-white transition-all shadow-sm">Verify Personnel</button>
                                  </div>
                               </div>
                             ))}
                             {waitingList.length === 0 && <p className="text-center text-slate-300 text-[9px] py-20 uppercase tracking-widest italic leading-relaxed">Awaiting applicants from tactical field force...</p>}
                          </div>
                       </div>
                    </div>
                 )}

                 <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <button onClick={()=>generatePDF(i.id)} className="bg-red-600 text-white px-10 py-3.5 rounded-[22px] font-black text-[11px] uppercase shadow-xl hover:bg-red-700 transition-all flex items-center gap-3 active:scale-95 shadow-red-200 italic"><i className="fas fa-file-pdf"></i> Generate Integrated SITREP / SPJ</button>
                    <button onClick={() => { setExpandedId(null); setShowInstructionForm(false); }} className="text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest italic underline decoration-slate-200 transition-all">➔ Tutup Workspace</button>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- REUSABLE ATOMS ---

const Input = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 ring-nu-green outline-none" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <textarea className="p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm focus:ring-2 ring-nu-green outline-none h-24" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  </div>
);

const CheckItem = ({ label, checked }) => (
  <div className="flex items-center gap-3">
    <div className={`w-4 h-4 rounded-lg flex items-center justify-center border-2 transition-all duration-700 ${checked ? 'bg-nu-green border-nu-green text-white shadow-lg shadow-green-200' : 'bg-white border-slate-200'}`}>
      {checked && <i className="fas fa-check text-[7px]"></i>}
    </div>
    <span className={`text-[10px] font-bold tracking-tight transition-all duration-700 ${checked ? 'text-nu-green italic' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);

const LifecycleBtn = ({ num, label, active, done, onClick }) => {
  const isDone = done;
  return (
    <div onClick={onClick} className={`flex items-center gap-4 p-4 rounded-[25px] cursor-pointer border-2 transition-all shadow-sm ${active ? 'bg-[#006432] border-[#006432] text-white shadow-xl scale-[1.02]' : isDone ? 'bg-green-50 border-green-100 opacity-90' : 'bg-white border-slate-50 opacity-40'}`}>
       <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] ${isDone ? 'bg-white text-[#006432]' : active ? 'bg-[#c5a059] text-[#006432]' : 'bg-slate-200 text-slate-400'}`}>
          {isDone ? <i className="fas fa-check"></i> : num}
       </div>
       <div className="flex flex-col leading-none">
          <span className={`text-[11px] font-black uppercase ${active ? 'text-white' : isDone ? 'text-nu-green' : 'text-slate-300'}`}>{label}</span>
          {active && <span className="text-[7px] text-nu-gold font-black animate-pulse uppercase mt-1 italic tracking-widest leading-none">Operational Target</span>}
       </div>
    </div>
  );
};

export default CompleteView;