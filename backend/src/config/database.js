const { Pool } = require('pg');
require('dotenv').config(); // Pastikan ini di baris paling atas

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), // Paksa menjadi string agar tidak error
  database: process.env.DB_NAME
});

// Tambahkan ini untuk mengecek apakah koneksi berhasil
pool.on('connect', () => {
  console.log('Database Connected Successfully');
});

module.exports = pool;