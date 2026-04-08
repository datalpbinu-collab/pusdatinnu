import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LogisticsHub = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [form, setForm] = useState({ incident_id: '', inventory_id: '', qty: 0 });

  const isPWNU = user.role === 'PWNU' || user.role === 'SUPER_ADMIN';

  const loadAll = async () => {
    const [resReq, resInv, resInc] = await Promise.all([
      api.get(`/api/logistics?role=${user.role}&region=${user.region}`),
      api.get('/api/inventory'),
      api.get('/api/incidents')
    ]);
    setRequests(resReq.data);
    setInventory(resInv.data);
    setActiveIncidents(resInc.data.filter(i => i.status !== 'completed'));
  };

  useEffect(() => { loadAll(); }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === parseInt(form.inventory_id));
    await api.post('/api/logistics', {
      ...form,
      item_name: item.name,
      quantity: form.qty,
      region: user.region
    });
    alert("Permintaan Terkirim ke Pusat!");
    setShowRequestForm(false);
    loadAll();
  };

  const handleApproval = async (id, status) => {
    const admin_note = prompt("Berikan alasan/catatan:");
    await api.patch(`/api/logistics/${id}/approve`, { status, admin_note });
    alert("Status Permintaan Diperbarui!");
    loadAll();
  };

  return (
    <div className="p-8 bg-[#f8fafc] h-full overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-8 border-b-2 border-green-50 pb-4">
        <h2 className="text-2xl font-black text-nu-green uppercase italic tracking-tighter">Logistics Request Hub</h2>
        {!isPWNU && (
          <button onClick={() => setShowRequestForm(true)} className="bg-nu-green text-white px-6 py-2 rounded-full font-bold text-xs shadow-lg">+ MINTA BANTUAN</button>
        )}
      </div>

      {/* FORM REQUEST (Hanya untuk PCNU) */}
      {showRequestForm && (
        <form onSubmit={handleRequest} className="mb-10 bg-white p-8 rounded-[40px] shadow-2xl border grid grid-cols-4 gap-4 animate-in zoom-in duration-300">
          <select className="p-3 bg-slate-50 rounded-xl text-xs font-bold" required onChange={e=>setForm({...form, incident_id: e.target.value})}>
             <option value="">Pilih Kejadian Bencana</option>
             {activeIncidents.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
          <select className="p-3 bg-slate-50 rounded-xl text-xs font-bold" required onChange={e=>setForm({...form, inventory_id: e.target.value})}>
             <option value="">Pilih Barang</option>
             {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.available_quantity})</option>)}
          </select>
          <input type="number" className="p-3 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Jumlah" required onChange={e=>setForm({...form, qty: e.target.value})} />
          <button type="submit" className="bg-nu-gold text-green-950 font-black rounded-xl text-xs uppercase">Kirim Pengajuan</button>
        </form>
      )}

      {/* TABEL REQUEST */}
      <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
            <tr>
              <th className="p-5">Asal Cabang</th>
              <th className="p-5">Barang & Jumlah</th>
              <th className="p-5">Untuk Kejadian</th>
              <th className="p-5">Status</th>
              {isPWNU && <th className="p-5 text-center">Otoritas</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-t border-slate-50 text-sm">
                <td className="p-5 font-bold text-nu-green">{r.requester_region}</td>
                <td className="p-5 font-black">{r.item_name} <span className="text-slate-400 font-normal">x {r.quantity_requested}</span></td>
                <td className="p-5 italic text-slate-500">{r.incident_title}</td>
                <td className="p-5">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.status}
                   </span>
                </td>
                {isPWNU && r.status === 'pending' && (
                  <td className="p-5 text-center flex justify-center gap-2">
                     <button onClick={() => handleApproval(r.id, 'approved')} className="bg-nu-green text-white p-2 rounded-lg text-[10px] font-bold uppercase">Approve</button>
                     <button onClick={() => handleApproval(r.id, 'rejected')} className="bg-red-600 text-white p-2 rounded-lg text-[10px] font-bold uppercase">Reject</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogisticsHub;