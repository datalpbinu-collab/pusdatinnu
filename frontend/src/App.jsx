import React, { useState, useEffect, useCallback } from 'react';
import api from './services/api';
import { Preferences } from '@capacitor/preferences';

// Import Komponen (Pastikan file-file ini ada di folder components)
import PublicDashboard from './components/PublicDashboard';
import Login from './components/Login';
import RelawanTactical from './components/RelawanTactical';
import PublicReport from './components/PublicReport';
import VolunteerRegister from './components/VolunteerRegister';
import { MapHUD, MissionManager, InventoryView, Wallboard, LogFooter } from './components/Placeholders';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [incidents, setIncidents] = useState([]);

  // 1. Cek Sesi Login saat Aplikasi Dibuka
  useEffect(() => {
    const checkSession = async () => {
      const { value: logged } = await Preferences.get({ key: 'isLoggedIn' });
      const { value: user } = await Preferences.get({ key: 'userData' });
      if (logged === 'true' && user) {
        setIsLoggedIn(true);
        setUserData(JSON.parse(user));
      }
    };
    checkSession();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/incidents/public');
      setIncidents(res.data);
    } catch (e) { console.error("Koneksi API Gagal"); }
  };

  const handleLoginSuccess = async (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    setShowLogin(false);
    await Preferences.set({ key: 'isLoggedIn', value: 'true' });
    await Preferences.set({ key: 'userData', value: JSON.stringify(user) });
  };

  const handleLogout = async () => {
    await Preferences.clear();
    window.location.reload();
  };

  // 2. Routing Halaman Publik
  const path = window.location.pathname;
  if (path === '/lapor') return <PublicReport />;
  if (path === '/gabung') return <VolunteerRegister />;

  // 3. Tampilan Jika Belum Login (Landing Page)
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-white">
        <PublicDashboard incidents={incidents} onOpenLogin={() => setShowLogin(true)} />
        
        {/* Tombol Login Floating */}
        <button 
          onClick={() => setShowLogin(true)}
          className="fixed bottom-20 right-6 z-[9999] bg-[#006432] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"
        >
          <i className="fas fa-user-shield text-xl"></i>
        </button>

        {showLogin && (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onGoToRegister={() => window.location.pathname = '/gabung'}
            onClose={() => setShowLogin(false)}
          />
        )}
      </div>
    );
  }

  // 4. LOGIKA ROLE SETELAH LOGIN
  // Jika Role adalah RELAWAN
  if (userData?.role === 'RELAWAN') {
    return <RelawanTactical user={userData} onLogout={handleLogout} />;
  }

  // Jika Role adalah PWNU atau PCNU (Dashboard Admin)
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* Header Admin */}
      <header className="h-14 bg-[#006432] flex items-center px-4 justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="https://pwnu-jateng.org/uploads/infoumum/20250825111304-2025-08-25infoumum111252.png" className="h-8" alt="logo" />
          <div className="text-white">
            <h1 className="text-[10px] font-black uppercase leading-none">Pusdatin NU Jateng</h1>
            <p className="text-[8px] font-bold opacity-70 uppercase">Admin: {userData?.role} - {userData?.region || 'Pusat'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-white/50 hover:text-white"><i className="fas fa-power-off"></i></button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Admin */}
        <aside className="w-20 bg-white border-r flex flex-col items-center py-6 gap-8 shrink-0">
          <NavIcon icon="home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavIcon icon="crosshairs" active={activeTab === 'command'} onClick={() => setActiveTab('command')} />
          <NavIcon icon="boxes" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
        </aside>

        {/* Workspace Admin */}
        <main className="flex-1 overflow-y-auto p-6">
           {activeTab === 'dashboard' && (
             <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-2xl shadow-sm border">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Misi Aktif</p>
                  <p className="text-3xl font-black text-[#006432]">{incidents.length}</p>
                </div>
                {/* Tambahkan statistik lain di sini */}
             </div>
           )}
           {activeTab === 'command' && <MapHUD />}
           {activeTab === 'assets' && <InventoryView />}
        </main>
      </div>
      <LogFooter />
    </div>
  );
}

// Sub-komponen Navigasi Admin
const NavIcon = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-green-50 text-[#006432] shadow-inner' : 'text-slate-300'}`}>
    <i className={`fas fa-${icon} text-lg`}></i>
  </button>
);

export default App;