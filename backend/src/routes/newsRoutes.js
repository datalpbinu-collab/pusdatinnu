const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// API Ambil Berita Hasil Scraper AI
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM intel_news ORDER BY created_at DESC LIMIT 15"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;