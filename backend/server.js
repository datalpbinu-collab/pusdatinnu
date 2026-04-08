require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose'); // Tambahan untuk koneksi Database
const app = require('./src/app');
const { Server } = require('socket.io');
const cron = require('node-cron');
const { runScraper } = require('./src/utils/scraper');

const PORT = process.env.PORT || 5000;

// --- 1. KONEKSI DATABASE ONLINE (MONGODB ATLAS) ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pusdatin_nu:nu1926@cluster0.kyok2h3.mongodb.net/pusdatin_nu_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DATABASE ONLINE: Terhubung ke MongoDB Atlas Cloud"))
  .catch(err => {
    console.error("❌ GAGAL KONEKSI DATABASE:", err.message);
    process.exit(1); // Hentikan server jika database gagal
  });

// --- 2. SETUP SERVER HTTP & SOCKET.IO ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Wajib "*" agar APK di HP relawan bisa terhubung secara online
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Memastikan kestabilan koneksi di jaringan seluler
});

// Logic Socket.io (Tetap dipertahankan)
io.on('connection', (socket) => {
  console.log('📡 User Connected: ' + socket.id);

  socket.on('disconnect', () => {
    console.log('📡 User Disconnected');
  });
});

// Simpan io di app agar bisa diakses dari controller/routes
app.set('socketio', io);

// --- 3. FITUR SCRAPER & CRON JOB (Tetap dipertahankan) ---
// Jalankan tiap 5 menit secara otomatis
cron.schedule('*/5 * * * *', () => {
    console.log('🕒 Running auto-scraper (every 5 minutes)...');
    runScraper();
});

// --- 4. MENJALANKAN SERVER ---
server.listen(PORT, () => {
  console.log(`🚀 Server NU Peduli Online pada port ${PORT}`);
  console.log(`📡 Socket.io siap menerima koneksi dari APK`);
});

// Handle error sistem yang tak terduga agar server tidak mati total
process.on('unhandledRejection', (err) => {
    console.log('⚠️ Error Sistem:', err.message);
    // server.close(() => process.exit(1)); // Opsional: tutup server jika error parah
});