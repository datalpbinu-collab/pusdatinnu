const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Ambil semua data inventory
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/', async (req, res) => {
    const { name, type, quantity, available_quantity, unit } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO inventory (name, type, quantity, available_quantity, unit) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, type, quantity, available_quantity, unit]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tambahkan di backend/src/routes/inventoryRoutes.js
router.post('/volunteers', async (req, res) => {
    const { 
        full_name, phone, birth_date, gender, blood_type, 
        regency, district, village, detail_address, 
        is_domicile_same, domicile_address, latitude, longitude,
        medical_history, expertise, experience 
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO volunteers 
            (full_name, phone, birth_date, gender, blood_type, regency, district, village, detail_address, is_domicile_same, domicile_address, latitude, longitude, medical_history, expertise, experience) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [full_name, phone, birth_date, gender, blood_type, regency, district, village, detail_address, is_domicile_same, domicile_address, latitude, longitude, medical_history, JSON.stringify(expertise), experience]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;