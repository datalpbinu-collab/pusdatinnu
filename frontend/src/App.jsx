import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import api from './services/api';
import axios from 'axios';

// --- NATIVE HP INTEGRATION ---
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network'; 
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';

// --- HUB KOMPONEN ASLI (SESUAI FOLDER ANDA) ---
import MapHUD from './components/CommandCenter'; 
import MissionManager from './components/CompleteView'; 
import InventoryView from './components/InventoryView';
import Wallboard from './components/Wallboard';
import LogFooter from './components/LogFooter';
import LogisticsHub from './components/LogisticsHub';
import Assessment from './components/Assessment';
import InstructionView from './components/InstructionView';
import ActionView from './components/ActionView';
import PublicReport from './components/PublicReport';
import VolunteerRegister from './components/VolunteerRegister';
import RelawanTactical from './components/RelawanTactical'; 
import PublicDashboard from './components/PublicDashboard';
import Login from './components/Login';

// --- KONFIGURASI ENGINE ---
const BASE_URL = 'https://nupeduli-pusdatin-nu-backend.hf.space';
const socket = io(BASE_URL, { 
  reconnection: true, 
  reconnectionAttempts: Infinity,
  transports: ['websocket'], 
  upgrade: false, 
  forceNew: true
});

function App() {
  // 1. SEMUA HOOKS (STATE) WAJIB DI ATAS
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navStack, setNavStack] = useState(['dashboard']);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [weather, setWeather] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const stateRef = useRef({ activeTab, navStack, selectedIncident, isLoggedIn, syncQueue });
  
  // 2. SEMUA HOOKS (MEMO/CALLBACK) WAJIB DI ATAS
  const storage = useMemo(() => ({
    set: async (key, val) => await Preferences.set({ key, value: JSON.stringify(val) }),
    get: async (key) => {
      const res = await Preferences.get({ key });
      return res.value ? JSON.parse(res.value) : null;
    },
    remove: async (key) => await Preferences.remove({ key }),
    clear: async () => await Preferences.clear()
  }), []);

  // FIX ERROR #310: Pindahkan filteredData ke sini (Sebelum return apa pun)
  const filteredData = useMemo(() => {
    if (!Array.isArray(incidents)) return []; 
    // Jika belum login, tampilkan semua data untuk Dashboard Publik
    if (!isLoggedIn) return incidents; 
    // Jika sudah login, filter berdasarkan Role (PCNU/PWNU) sesuai PRD
    return incidents.filter((inc) => 
      userData?.role === 'PWNU' || userData?.role === 'SUPER_ADMIN' || inc.region === userData?.region
    );
  }, [incidents, userData, isLoggedIn]);

  const fetchData = useCallback(async () => {
    try {
      const [resInc, resInv] = await Promise.all([
        api.get('incidents'), 
        api.get('inventory')
      ]);
      setIncidents(Array.isArray(resInc.data) ? resInc.data : []);
      setInventory(Array.isArray(resInv.data) ? resInv.data : []);
      await storage.set('cache_incidents', resInc.data || []);
    } catch (err) {
      const cInc = await storage.get('cache_incidents');
      setIncidents(cInc || []);
    }
  }, [storage]);

  const handleDataSubmit = async (endpoint, data) => {
    const cleanEndpoint = endpoint.replace('/api/', '');
    try {
      await api.post(cleanEndpoint, data);
      fetchData();
      goBack();
    } catch (e) { alert("Gagal mengirim data."); }
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    if (isMobile) Haptics.impact({ style: ImpactStyle.Light });
  };

  const goBack = useCallback(async () => {
    const { selectedIncident, activeTab } = stateRef.current;
    if (selectedIncident) { setSelectedIncident(null); return; }
    if (activeTab !== 'dashboard') { setActiveTab('dashboard'); }
    else { CapApp.exitApp(); }
  }, [isMobile]);

  // 3. SEMUA HOOKS (EFFECTS)
  useEffect(() => { 
    stateRef.current = { activeTab, navStack, selectedIncident, isLoggedIn, syncQueue }; 
  }, [activeTab, navStack, selectedIncident, isLoggedIn, syncQueue]);

  useEffect(() => {
    const bootstrap = async () => {
      const uData = await storage.get('userData');
      if (uData) { setIsLoggedIn(true); setUserData(uData); }
      fetchData();
      initNativeFeatures();
    };
    bootstrap();
    socket.on('emergency_broadcast', () => fetchData());
    return () => socket.off('emergency_broadcast');
  }, [fetchData]);

  const initNativeFeatures = async () => {
    try {
      await Geolocation.requestPermissions();
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#006432' });
      CapApp.addListener('backButton', goBack);
    } catch (e) { console.log("Native API Skip"); }
  };

  const handleLoginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    setShowLogin(false);
    fetchData();
  };

  const handleLogout = async () => {
    await storage.clear();
    window.location.reload();
  };

  // 4. LOGIKA ROUTING (SETELAH SEMUA HOOKS SELESAI DIPANGGIL)
  const path = window.location.pathname;
  if (path === '/lapor') return <PublicReport />;
  if (path === '/gabung') return <VolunteerRegister />;
  
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen relative bg-white overflow-hidden">
        <PublicDashboard incidents={incidents} onOpenLogin={() => setShowLogin(true)} />
        <button onClick={() => setShowLogin(true)} className="fixed bottom-10 right-10 z-[9999] bg-[#006432] text-white p-5 rounded-full shadow-2xl animate-bounce border-4 border-white"><i className="fas fa-user-shield text-xl"></i></button>
        {showLogin && <Login onLoginSuccess={handleLoginSuccess} onGoToRegister={() => window.location.pathname = '/gabung'} onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  if (userData?.role === 'RELAWAN' || path === '/v') {
    return <RelawanTactical user={userData} coords={currentCoords} onOfflineSubmit={handleDataSubmit} onLogout={handleLogout} />;
  }

  // 5. RENDER UTAMA ADMIN
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden relative safe-area-inset">
      <header className="h-14 md:h-16 bg-[#006432] border-b-2 border-[#c5a059] flex items-center px-4 md:px-8 justify-between shrink-0 shadow-2xl z-[5000]">
        <div className="flex items-center gap-3">
          <img src="https://pwnu-jateng.org/uploads/infoumum/20250825111304-2025-08-25infoumum111252.png" className="h-8 md:h-10" alt="logo" />
          <h1 className="font-black text-[10px] md:text-sm text-white uppercase italic tracking-tighter">PWNU JATENG COMMAND CENTER</h1>
        </div>
        <button onClick={handleLogout} className="text-white/40 p-2"><i className="fas fa-power-off"></i></button>
      </header>

      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        {!isMobile && (
          <aside className="w-[85px] bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 shrink-0 z-40">
            <NavBtn icon="home" label="Home" active={activeTab === 'dashboard'} onClick={() => navigateTo('dashboard')} />
            <NavBtn icon="crosshairs" label="HUD" active={activeTab === 'command'} onClick={() => navigateTo('command')} />
            <NavBtn icon="table" label="Missions" active={activeTab === 'manager'} onClick={() => navigateTo('manager')} />
            <NavBtn icon="boxes" label="Assets" active={activeTab === 'assets'} onClick={() => navigateTo('assets')} />
            <NavBtn icon="truck-loading" label="Logistik" active={activeTab === 'logistics'} onClick={() => navigateTo('logistics')} />
            <NavBtn icon="desktop" label="Wall" active={activeTab === 'wallboard'} onClick={() => navigateTo('wallboard')} />
          </aside>
        )}

        <main className="flex-1 relative bg-white overflow-hidden shadow-inner">
          <div className="h-full w-full overflow-y-auto custom-scrollbar">
            <div className="pb-24 pt-4 px-4 md:px-8">
              {activeTab === 'dashboard' && <DashboardHome incidents={filteredData} onNavigate={navigateTo} isOnline={isOnline} />}
              {activeTab === 'command' && <MapHUD incidents={filteredData} onRefresh={fetchData} onAction={setActiveTab} onSelect={setSelectedIncident} />}
              {activeTab === 'manager' && <MissionManager incidents={filteredData} onRefresh={fetchData} onAction={setActiveTab} onSelect={setSelectedIncident} />}
              {activeTab === 'assets' && <InventoryView inventory={inventory} onRefresh={fetchData} />}
              {activeTab === 'logistics' && <LogisticsHub user={userData} />}
              {activeTab === 'wallboard' && <Wallboard incidents={filteredData} />}
            </div>

            {activeTab === 'assess' && selectedIncident && <OverlayWrapper title="Asesmen" onBack={goBack}><Assessment incident={selectedIncident} onBack={goBack} onSyncSubmit={handleDataSubmit} /></OverlayWrapper>}
            {activeTab === 'instruksi' && selectedIncident && <OverlayWrapper title="Instruksi" onBack={goBack}><InstructionView incident={selectedIncident} onComplete={goBack} onSyncSubmit={handleDataSubmit} /></OverlayWrapper>}
            {activeTab === 'action' && selectedIncident && <OverlayWrapper title="Monitoring" onBack={goBack}><ActionView incident={selectedIncident} onComplete={goBack} onSyncSubmit={handleDataSubmit} /></OverlayWrapper>}
          </div>
        </main>
      </div>
      {!isMobile && <LogFooter />}
    </div>
  );
}

// SUB-KOMPONEN UI
function NavBtn({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`group flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'text-[#006432]' : 'text-slate-300'}`}>
      <div className={`p-4 rounded-[26px] ${active ? 'bg-green-50 shadow-lg' : ''}`}><i className={`fas fa-${icon} text-lg`}></i></div>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}

function DashboardHome({ incidents, onNavigate, isOnline }) {
  const activeCount = Array.isArray(incidents) ? incidents.filter(i => i.status !== 'completed').length : 0;
  return (
    <div className="space-y-8 animate-fade-in">
       <div className="border-b-2 border-green-50 pb-4">
          <h2 className="text-3xl font-black text-[#006432] uppercase italic tracking-tighter">Strategic Dashboard</h2>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPIBox label="Total Kejadian" value={incidents?.length || 0} color="text-slate-800" icon="clipboard-list" />
          <KPIBox label="Misi Aktif" value={activeCount} color="text-blue-600" icon="fire-extinguisher" />
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <QuickBtn label="Peta HUD" icon="crosshairs" onClick={() => onNavigate('command')} />
          <QuickBtn label="Missions" icon="table" onClick={() => onNavigate('manager')} />
       </div>
    </div>
  );
}

function KPIBox({ label, value, color, icon }) {
  return (
    <div className="bg-white p-6 rounded-[35px] shadow-lg border border-slate-50 flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center bg-slate-50"><i className={`fas fa-${icon} ${color}`}></i></div>
      <p className={`text-3xl font-black ${color} italic`}>{value}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{label}</p>
    </div>
  );
}

function QuickBtn({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white p-6 rounded-[35px] shadow-md border border-slate-50 flex flex-col items-center gap-3 active:scale-95 transition-all group">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl text-[#006432] group-hover:bg-[#006432] group-hover:text-white transition-all">
         <i className={`fas fa-${icon}`}></i>
      </div>
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{label}</span>
    </button>
  );
}

function OverlayWrapper({ children, title, onBack }) {
  return (
    <div className="fixed inset-0 z-[6000] bg-white flex flex-col pt-safe">
       <div className="h-14 border-b bg-slate-50 flex items-center justify-between px-4">
          <button onClick={onBack} className="text-[#006432] font-black text-xs uppercase flex items-center gap-2">
            <i className="fas fa-arrow-left"></i> KEMBALI
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase">{title}</span>
          <div className="w-16"></div>
       </div>
       <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

export default App;