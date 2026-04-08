const pool = require('../config/database');

// Rumus Skoring AI sesuai PRD (Weighting System)
const analyzeSeverity = (text) => {
    let score = 0;
    const t = text.toLowerCase();

    // Bobot Dampak Manusia
    if (t.includes('meninggal') || t.includes('tewas')) score += 100;
    if (t.includes('hilang')) score += 80;
    if (t.includes('luka') || t.includes('sakit')) score += 40;
    if (t.includes('mengungsi') || t.includes('pengungsi')) score += 30;
    if (t.includes('terdampak')) score += 10;

    // Bobot Fisik & Vital
    if (t.includes('rusak berat') || t.includes('ambruk') || t.includes('hancur')) score += 50;
    if (t.includes('rusak sedang')) score += 30;
    if (t.includes('putus') || t.includes('lumpuh')) score += 60; // Jalan/Jembatan

    let level = 'LOW';
    if (score > 1000) level = 'CRITICAL';
    else if (score > 500) level = 'HIGH';
    else if (score > 200) level = 'MEDIUM';

    return { score, level };
};

// Fungsi hitung jarak geospasial
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Logika Anti-Tumpang Tindih (Deduplikasi)
exports.processDeduplication = async (news) => {
    try {
        const existing = await pool.query(
            "SELECT * FROM incidents WHERE status != 'completed' AND disaster_type = $1 AND created_at > NOW() - INTERVAL '24 hours'",
            [news.category]
        );

        let targetId = null;
        for (let inc of existing.rows) {
            const distance = calculateDistance(news.lat, news.lng, parseFloat(inc.latitude), parseFloat(inc.longitude));
            if (distance <= 15) { // Radius 15km dianggap bencana yang sama
                targetId = inc.id;
                break;
            }
        }

        if (targetId) {
            // Jika DUPLIKAT: Update waktu saja
            await pool.query("UPDATE incidents SET updated_at = NOW() WHERE id = $1", [targetId]);
            return { action: 'merged', id: targetId };
        } else {
            // Jika DATA BARU: Hitung Skor dan Simpan
            const ai = analyzeSeverity(news.title);
            const result = await pool.query(
                `INSERT INTO incidents (title, disaster_type, latitude, longitude, region, status, priority_score, priority_level, is_ai_generated, source_url) 
                 VALUES ($1, $2, $3, $4, $5, 'verified', $6, $7, TRUE, $8) RETURNING id`,
                [news.title, news.category, news.lat, news.lng, news.region, ai.score, ai.level, news.url]
            );
            return { action: 'created', id: result.rows[0].id };
        }
    } catch (e) {
        console.error("Deduplicator Error:", e.message);
        return { action: 'error' };
    }
};