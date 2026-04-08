const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// --- FUNGSI DAFTAR (REGISTER) ---
exports.register = async (req, res) => {
    const { full_name, region, username, password, role, secret_key } = req.body;

    try {
        // Validasi Kode Rahasia untuk Admin
        if (role === 'PWNU' && secret_key !== process.env.SECRET_KEY_PWNU) {
            return res.status(403).json({ success: false, error: "Otoritas Ditolak: Kode PWNU Salah!" });
        }
        if (role === 'PCNU' && secret_key !== process.env.SECRET_KEY_PCNU) {
            return res.status(403).json({ success: false, error: "Otoritas Ditolak: Kode PCNU Salah!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const lowerUsername = username.toLowerCase();

        const result = await pool.query(
            `INSERT INTO users (full_name, region, username, password, role) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, username, role`,
            [full_name, region, lowerUsername, hashedPassword, role]
        );

        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ success: false, error: "Username sudah ada atau database error" });
    }
};

// --- FUNGSI MASUK (LOGIN) ---
exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: "Input tidak lengkap" });

    const lowerUsername = username.toLowerCase();

    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [lowerUsername]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: "Akun tidak ditemukan" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Password salah" });
        }

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                full_name: user.full_name, 
                role: user.role, 
                region: user.region 
            } 
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ success: false, error: "Terjadi kesalahan server" });
    }
};