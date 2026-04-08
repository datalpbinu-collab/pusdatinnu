const pool = require('../config/database');

exports.getNewsFeed = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM intel_news WHERE severity = 'Urgent' ORDER BY created_at DESC LIMIT 15"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};