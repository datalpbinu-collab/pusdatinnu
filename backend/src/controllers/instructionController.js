const pool = require('../config/database');

exports.createInstruction = async (req, res) => {
    const { incident_id, pj_nama, pic_lapangan, tim_anggota, armada_detail, peralatan_detail } = req.body;
    const nomor_sp = `SP/NU-JTG/${new Date().getFullYear()}/${incident_id}`;

    try {
        const result = await pool.query(
            `INSERT INTO incident_instructions (incident_id, nomor_sp, pj_nama, pic_lapangan, tim_anggota, armada_detail, peralatan_detail)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [incident_id, nomor_sp, pj_nama, pic_lapangan, tim_anggota, armada_detail, peralatan_detail]
        );

        // Update status bencana menjadi 'commanded'
        await pool.query("UPDATE incidents SET status = 'commanded' WHERE id = $1", [incident_id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};