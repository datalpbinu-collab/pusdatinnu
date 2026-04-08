import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from './services/api';
import axios from 'axios';

// --- NATIVE HP INTEGRATION (CAPACITOR OFFICIAL) ---
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network'; 
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';

// --- HUB SELURUH KOMPONEN SISTEM ---
import MapHUD from './components/CommandCenter'; 
import MissionManager from './components/CompleteView'; 
import InventoryView from './components/InventoryView';
import PublicReport from './components/PublicReport';
import VolunteerRegister from './components/VolunteerRegister';
import RelawanTactical from './components/RelawanTactical'; 
import PublicDashboard from './components/PublicDashboard';
import Login from './components/Login';
import Wallboard from './components/Wallboard';
import LogFooter from './components/LogFooter';
import LogisticsHub from './components/LogisticsHub';
import Assessment from './components/Assessment';
import InstructionView from './components/InstructionView';
import ActionView from './components/ActionView';

const socket = io('http://localhost:5000', { reconnection: true });

function App() {
  // --- STATE AUTH & SESSION ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // --- STATE NAVIGATION ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navStack, setNavStack] = useState(['dashboard']);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // --- STATE DATA & SYNC ---
  const [incidents, setIncidents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [weather, setWeather] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isMobile] = useState(window.innerWidth < 768);

  // Ref untuk navigasi (Mencegah stale closure pada listener hardware)
  const stateRef = useRef({ activeTab, navStack, selectedIncident, isLoggedIn });
  useEffect(() => { 
    stateRef.current = { activeTab, navStack, selectedIncident, isLoggedIn }; 
  }, [activeTab, navStack, selectedIncident, isLoggedIn]);

  // --- 1. STORAGE UTILITY ---
  const storage = {
    set: async (key, val) => await Preferences.set({ key, value: JSON.stringify(val) }),
    get: async (key) => {
      const res = await Preferences.get({ key });
      return res.value ? JSON.parse(res.value) : null;
    },
    remove: async (key) => await Preferences.remove({ key })
  };

  // --- 2. ENGINE: DATA & OFFLINE SYNC ---
  const fetchData = useCallback(async () => {
    try {
      const [resInc, resInv] = await Promise.all([
        api.get('/api/incidents'), 
        api.get('/api/inventory')
      ]);
      setIncidents(resInc.data);
      setInventory(resInv.data);
      await storage.set('cache_incidents', resInc.data);
      await storage.set('cache_inventory', resInv.data);
    } catch (err) {
      const cInc = await storage.get('cache_incidents');
      const cInv = await storage.get('cache_inventory');
      if (cInc) setIncidents(cInc);
      if (cInv) setInventory(cInv);
    }
  }, []);

  const processSyncQueue = useCallback(async () => {
    const queue = await storage.get('sync_queue') || [];
    if (queue.length === 0 || !navigator.onLine) return;

    const remaining = [];
    for (const item of queue) {
      try {
        await api.post(item.endpoint, item.data);
      } catch (e) {
        remaining.push(item);
      }
    }
    setSyncQueue(remaining);
    await storage.set('sync_queue', remaining);
    if (remaining.length === 0) fetchData();
  }, [fetchData]);

  const handleDataSubmit = async (endpoint, data) => {
    if (!isOnline) {
      const queue = await storage.get('sync_queue') || [];
      const updated = [...queue, { endpoint, data, ts: Date.now() }];
      setSyncQueue(updated);
      await storage.set('sync_queue', updated);
      Haptics.impact({ style: ImpactStyle.Medium });
      alert("⚠️ OFFLINE: Data disimpan di HP & akan dikirim saat sinyal aktif kembali.");
      goBack();
    } else {
      try {
        await api.post(endpoint, data);
        fetchData();
        goBack();
      } catch (e) { alert("Error mengirim data."); }
    }
  };

  // --- 3. ENGINE: NAVIGASI LANJUTAN (STUCK DASHBOARD) ---
  const navigateTo = (tab) => {
    if (tab === activeTab) return;
    setNavStack(prev => [...prev, tab]);
    setActiveTab(tab);
    setSelectedIncident(null);
    if (isMobile) Haptics.impact({ style: ImpactStyle.Light });
  };

  const goBack = useCallback(async () => {
    const { activeTab, navStack, selectedIncident, isLoggedIn } = stateRef.current;
    
    if (!isLoggedIn) return;

    // 1. Tutup Overlay
    if (selectedIncident) {
      setSelectedIncident(null);
      return;
    }

    // 2. Jika di halaman sub, kembali ke Dashboard
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      setNavStack(['dashboard']);
      if (isMobile) Haptics.impact({ style: ImpactStyle.Medium });
    } else {
      // 3. Konfirmasi keluar jika di Home
      const confirmExit = window.confirm("Keluar dari aplikasi NU Peduli?");
      if (confirmExit) CapApp.exitApp();
    }
  }, [isMobile]);

  // --- 4. ENGINE: NATIVE SENSORS & WEATHER ---
  const updateWeather = async (lat, lon) => {
    try {
      const API_KEY = 'YOUR_OPENWEATHER_KEY'; 
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      setWeather(res.data);
    } catch (e) { console.log("Weather error"); }
  };

  const initNative = async () => {
    try {
      await Geolocation.requestPermissions();
      await Camera.requestPermissions();
      await LocalNotifications.requestPermissions();

      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#006432' });

      Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10000 }, (pos) => {
        if (pos) {
          setCurrentCoords(pos.coords);
          updateWeather(pos.coords.latitude, pos.coords.longitude);
        }
      });

      Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
        if (status.connected) processSyncQueue();
      });

      CapApp.addListener('backButton', goBack);
    } catch (e) { console.log("Native Features Skipped"); }
  };

  // --- 5. LIFECYCLE ---
  useEffect(() => {
    const boot = async () => {
      const uData = await storage.get('userData');
      const logged = await storage.get('isLoggedIn');
      const queue = await storage.get('sync_queue');
      
      if (logged && uData) {
        setIsLoggedIn(true);
        setUserData(uData);
      }
      if (queue) setSyncQueue(queue);

      initNative();
      fetchData();
    };
    boot();

    socket.on('emergency_broadcast', async (data) => {
      await LocalNotifications.schedule({
        notifications: [{
          id: data.incident_id || 1,
          title: `🚨 DARURAT: ${data.title}`,
          body: data.summary,
          channelId: 'critical_alerts'
        }]
      });
      Haptics.impact({ style: ImpactStyle.Heavy });
    });

    return () => { socket.off('emergency_broadcast'); };
  }, [fetchData, processSyncQueue, goBack]);

  // --- 6. AUTH ENGINE (OFFLINE LOGIN FIX) ---
  const handleLogin = async (credentials) => {
    try {
      // Coba Online
      const res = await api.post('/api/login', credentials);
      // Jika Berhasil -> Simpan ke memori untuk offline nanti
      await storage.set('userData', res.data.user);
      await storage.set('isLoggedIn', true);
      await storage.set('last_creds', credentials); // Simpan kredensial login
      
      setUserData(res.data.user);
      setIsLoggedIn(true);
      fetchData();
    } catch (err) {
      // Coba Offline
      const cachedUser = await storage.get('userData');
      const lastCreds = await storage.get('last_creds');

      if (cachedUser && lastCreds && lastCreds.email === credentials.email && lastCreds.password === credentials.password) {
        setIsLoggedIn(true);
        setUserData(cachedUser);
        alert("✅ Mode Offline: Login Berhasil menggunakan data cache HP.");
      } else {
        alert("❌ Login Gagal: Butuh internet untuk login pertama kali atau data tidak cocok.");
      }
    }
  };

  const handleLogout = async () => {
    await storage.remove('userData');
    await storage.remove('isLoggedIn');
    window.location.reload();
  };

  // --- RENDERING ---
  if (!isLoggedIn) return <Login onLogin={handleLogin} />;
  
  // View khusus Relawan (Tetap dipertahankan)
  if (userData?.role === 'RELAWAN') {
    return <RelawanTactical user={userData} coords={currentCoords} onOfflineSubmit={handleDataSubmit} onLogout={handleLogout} />;
  }

  const filteredData = incidents.filter(inc => 
    userData.role === 'PWNU' || userData.role === 'SUPER_ADMIN' || inc.region === userData.region
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden relative safe-area-inset">
      
      {/* HEADER (STUCK TOP) */}
      <header className="h-14 md:h-16 bg-[#006432] border-b-2 border-[#c5a059] flex items-center px-4 md:px-8 justify-between shrink-0 shadow-2xl z-[2000]">
        <div className="flex items-center gap-3">
          <img src="https://pwnu-jateng.org/uploads/infoumum/20250825111304-2025-08-25infoumum111252.png" className="h-8 md:h-10" alt="logo" />
          <div className="flex flex-col">
            <h1 className="font-black text-[10px] md:text-sm text-white uppercase italic tracking-tighter">PWNU JATENG COMMAND CENTER</h1>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`}></span>
              <span className="text-[7px] text-white/60 font-bold uppercase tracking-widest leading-none">
                {weather ? `${weather.main.temp}°C - ${weather.weather[0].main}` : 'Sensors Syncing...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncQueue.length > 0 && (
             <div className="bg-orange-500 text-white text-[8px] px-2 py-1 rounded-full animate-bounce font-bold">
               {syncQueue.length} SYNC
             </div>
          )}
          <button onClick={handleLogout} className="text-white/40 hover:text-white p-2"><i className="fas fa-power-off"></i></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        
        {/* SIDEBAR (Desktop Only) */}
        {!isMobile && (
          <aside className="w-[85px] bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 shrink-0 z-40 shadow-sm">
            <NavBtn icon="home" label="Home" active={activeTab === 'dashboard'} onClick={() => navigateTo('dashboard')} />
            <NavBtn icon="crosshairs" label="HUD" active={activeTab === 'command'} onClick={() => navigateTo('command')} />
            <NavBtn icon="table" label="Missions" active={activeTab === 'manager'} onClick={() => navigateTo('manager')} />
            <NavBtn icon="boxes" label="Assets" active={activeTab === 'assets'} onClick={() => navigateTo('assets')} />
            <NavBtn icon="truck-loading" label="Logistik" active={activeTab === 'logistics'} onClick={() => navigateTo('logistics')} />
            <NavBtn icon="desktop" label="Wall" active={activeTab === 'wallboard'} onClick={() => navigateTo('wallboard')} />
          </aside>
        )}

        {/* WORKSPACE (Scrollable) */}
        <main className="flex-1 relative bg-white overflow-hidden shadow-inner">
          <div className="h-full w-full overflow-y-auto pb-20 md:pb-0 custom-scrollbar">
            
            {activeTab === 'dashboard' && <DashboardHome incidents={filteredData} onNavigate={navigateTo} isOnline={isOnline} />}
            {activeTab === 'command' && <MapHUD incidents={filteredData} onRefresh={fetchData} onAction={setActiveTab} onSelect={setSelectedIncident} />}
            {activeTab === 'manager' && <MissionManager incidents={filteredData} onRefresh={fetchData} onAction={setActiveTab} onSelect={setSelectedIncident} />}
            {activeTab === 'assets' && <InventoryView inventory={inventory} onRefresh={fetchData} />}
            {activeTab === 'logistics' && <LogisticsHub user={userData} />}
            {activeTab === 'wallboard' && <Wallboard incidents={filteredData} />}

            {/* FULL SCREEN OVERLAYS */}
            {activeTab === 'assess' && selectedIncident && (
              <OverlayWrapper title="Asesmen Bencana" onBack={goBack}>
                <Assessment incident={selectedIncident} onBack={goBack} onSyncSubmit={handleDataSubmit} />
              </OverlayWrapper>
            )}
            {activeTab === 'instruksi' && selectedIncident && (
              <OverlayWrapper title="Instruksi Operasi" onBack={goBack}>
                <InstructionView incident={selectedIncident} onComplete={goBack} onSyncSubmit={handleDataSubmit} />
              </OverlayWrapper>
            )}
            {activeTab === 'action' && selectedIncident && (
              <OverlayWrapper title="Monitoring Taktis" onBack={goBack}>
                <ActionView incident={selectedIncident} onComplete={goBack} onSyncSubmit={handleDataSubmit} />
              </OverlayWrapper>
            )}
          </div>
        </main>

        {/* BOTTOM NAV (STUCK/FIXED) */}
        {isMobile && (
          <nav className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-2 shrink-0 z-[2500] pb-safe shadow-2xl">
            <MobileNavBtn icon="home" label="Home" active={activeTab === 'dashboard'} onClick={() => navigateTo('dashboard')} />
            <MobileNavBtn icon="crosshairs" label="HUD" active={activeTab === 'command'} onClick={() => navigateTo('command')} />
            <MobileNavBtn icon="table" label="Missions" active={activeTab === 'manager'} onClick={() => navigateTo('manager')} />
            <MobileNavBtn icon="boxes" label="Assets" active={activeTab === 'assets'} onClick={() => navigateTo('assets')} />
            <MobileNavBtn icon="truck-loading" label="Logistics" active={activeTab === 'logistics'} onClick={() => navigateTo('logistics')} />
          </nav>
        )}
      </div>

      {!isMobile && <LogFooter logs={[]} />}
    </div>
  );
}

// --- ATOMS (STYLING PROFESIONAL) ---

function OverlayWrapper({ children, title, onBack }) {
  return (
    <div className="absolute inset-0 z-[3000] bg-white animate-in flex flex-col">
       <div className="h-14 border-b bg-slate-50 flex items-center justify-between px-4 shrink-0">
          <button onClick={onBack} className="text-[#006432] font-black text-xs uppercase flex items-center gap-2"><i className="fas fa-arrow-left"></i> KEMBALI</button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <div className="w-16"></div>
       </div>
       <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function DashboardHome({ incidents, onNavigate, isOnline }) {
  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      {!isOnline && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
          <i className="fas fa-plane-slash text-red-600"></i>
          <span className="text-xs font-bold text-red-800 uppercase">MODE OFFLINE - DATA CACHE DIAKTIFKAN</span>
        </div>
      )}
      <div className="flex justify-between items-end border-b-2 border-green-50 pb-4">
        <div>
          <h2 className="text-3xl font-black text-[#006432] uppercase italic leading-none">COMMAND CENTER</h2>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Wilayah Jawa Tengah</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIBox label="Total Kejadian" value={incidents.length} color="text-slate-800" />
        <KPIBox label="Relawan Aktif" value="1,240" color="text-green-600" />
        <KPIBox label="Logistik" value="OK" color="text-blue-600" />
        <KPIBox label="Status Sinyal" value={isOnline ? "ON" : "OFF"} color={isOnline ? "text-green-600" : "text-red-500"} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickBtn label="Peta HUD" icon="crosshairs" onClick={() => onNavigate('command')} />
        <QuickBtn label="Misi & Tugas" icon="table" onClick={() => onNavigate('manager')} />
        <QuickBtn label="Data Aset" icon="boxes" onClick={() => onNavigate('assets')} />
        <QuickBtn label="Logistics Hub" icon="truck-loading" onClick={() => onNavigate('logistics')} />
      </div>
    </div>
  );
}

function KPIBox({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-[30px] shadow-lg border border-slate-50 flex flex-col items-center">
      <p className={`text-3xl font-black ${color} italic`}>{value}</p>
      <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">{label}</p>
    </div>
  );
}

function QuickBtn({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white p-6 rounded-[30px] shadow-md border border-slate-50 flex flex-col items-center gap-3 hover:bg-green-50 active:scale-95 transition-all">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl text-[#006432]"><i className={`fas fa-${icon}`}></i></div>
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{label}</span>
    </button>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`group flex flex-col items-center gap-1.5 cursor-pointer w-full ${active ? 'text-[#006432]' : 'text-slate-300'}`}>
      <div className={`p-4 rounded-[26px] ${active ? 'bg-green-50 shadow-lg scale-110 border border-green-100' : ''}`}><i className={`fas fa-${icon} text-lg`}></i></div>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{label}</span>
    </div>
  );
}

function MobileNavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 ${active ? 'text-[#006432] scale-110' : 'text-slate-300'}`}>
      <i className={`fas fa-${icon} text-xl`}></i>
      <span className="text-[7px] font-black uppercase">{label}</span>
    </button>
  );
}

export default App;