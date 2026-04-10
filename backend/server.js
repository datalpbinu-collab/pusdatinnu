const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 1. PENGATURAN CORS (Izinkan Cloudflare Anda)
app.use(cors({
  origin: ["https://nuriskjateng.pages.dev", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

// 2. SOCKET.IO (Untuk Broadcast Darurat Real-time)
const io = new Server(server, {
  cors: { origin: "https://nuriskjateng.pages.dev" },
  transports: ['websocket']
});

// --- DATA TEMPORARY (Essence: Incidents & Volunteers) ---
let incidents = [];
let dutyApplications = [];

// 3. ROUTER UTAMA
const router = express.Router();

// Endpoint Login (Login.jsx)
router.post('/login', (req, res) => {
  console.log("Login attempt:", req.body.username);
  res.json({ 
    success: true, 
    user: { username: req.body.username, role: 'PWNU', region: 'Jawa Tengah' },
    token: 'token_pusdatin_2025'
  });
});

// Endpoint Register (VolunteerRegister.jsx & Register.jsx)
router.post('/register', (req, res) => {
  res.json({ success: true, message: "Akun berhasil dibuat" });
});

router.post('/auth/register', (req, res) => {
  res.json({ success: true, message: "Personil personil terdaftar" });
});

// Endpoint Inventory & Volunteers (VolunteerForm.jsx)
router.post('/inventory/volunteers', (req, res) => {
  res.json({ success: true, message: "Data personil masuk database" });
});

// Endpoint Misi & Incident (RelawanTactical.jsx)
router.get('/incidents', (req, res) => {
  res.json(incidents);
});

router.post('/volunteers/apply', (req, res) => {
  dutyApplications.push(req.body);
  res.json({ success: true, message: "Kesediaan tugas dikirim" });
});

// --- FIXER: SOLUSI MASALAH 404 & DOUBLE /API ---
// Menangani pemanggilan: .../api/login
app.use('/api', router);

// Menangani pemanggilan yang salah: .../api/api/register
app.use('/api/api', router);

// Menangani pemanggilan tanpa prefix (fallback)
app.use('/', router);


// 4. SOCKET LOGIC
io.on('connection', (socket) => {
  console.log('User connected to Command Center');
  
  socket.on('report_incident', (data) => {
    incidents.push(data);
    io.emit('emergency_broadcast', data);
  });
});

// 5. PORT WAJIB HUGGING FACE
const PORT = process.env.PORT || 7860;
server.listen(PORT, () => {
  console.log(`Command Center Backend Aktif di Port ${PORT}`);
});