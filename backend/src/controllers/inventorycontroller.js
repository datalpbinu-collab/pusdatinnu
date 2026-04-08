const pool = require('../config/database');

exports.getInventory = async (req, res) => {
    const { type } = req.query; // filter berdasarkan equipment/fleet/building
    try {
        const result = await pool.query(
            'SELECT * FROM inventory WHERE type = $1 OR $1 IS NULL',
            [type]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addInventory = async (req, res) => {
    const { name, type, quantity, unit, lat, lng } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO inventory (name, type, quantity, available_quantity, unit, location_lat, location_lng)
             VALUES ($1, $2, $3, $3, $4, $5, $6) RETURNING *`,
            [name, type, quantity, unit, lat, lng]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};