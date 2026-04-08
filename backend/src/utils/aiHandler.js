const pool = require('../config/database');

exports.processNewsToIncident = async (newsItem) => {
    const PROXIMITY = 15; // 15 KM
    try {
        // Cek Duplikasi
        const existing = await pool.query(
            "SELECT * FROM incidents WHERE disaster_type = $1 AND status != 'completed' AND created_at > NOW() - INTERVAL '24 hours'",
            [newsItem.category]
        );

        let isDuplicate = false;
        if (existing.rows.length > 0) isDuplicate = true; // Logika sederhana untuk demo

        if (!isDuplicate) {
            await pool.query(
                `INSERT INTO incidents (title, disaster_type, latitude, longitude, region, status, is_ai_generated, source_url) 
                 VALUES ($1, $2, $3, $4, $5, 'verified', TRUE, $6)`,
                [newsItem.title, newsItem.category, newsItem.lat, newsItem.lng, newsItem.region, newsItem.url]
            );
            console.log(`[AI] Berhasil mendaftarkan kejadian baru: ${newsItem.title}`);
        }
    } catch (e) { console.error("AI Handler Error:", e.message); }
};