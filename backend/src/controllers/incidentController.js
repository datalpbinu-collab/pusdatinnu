const pool = require('../config/database');

// --- HELPER: RUMUS SKORING AI (Weighting System) ---
const calculateAIScore = (data) => {
    const d = data.dampak_manusia || {};
    const h = data.dampak_rumah || {};
    const f = data.dampak_fasum || {};
    const v = data.dampak_vital || {};
    const l = data.dampak_lingkungan || {};

    const score = 
        (parseInt(d.meninggal) || 0) * 100 + (parseInt(d.hilang) || 0) * 80 +
        (parseInt(d.sakit) || 0) * 40 + (parseInt(d.mengungsi) || 0) * 30 + (parseInt(d.terdampak) || 0) * 10 +
        (parseInt(h.berat) || 0) * 50 + (parseInt(h.sedang) || 0) * 30 + (parseInt(h.ringan) || 0) * 10 +
        (parseInt(f.faskes) || 0) * 60 + (parseInt(f.ibadah) || 0) * 20 + (parseInt(f.sekolah) || 0) * 25 +
        (parseInt(v.air_bersih) || 0) * 70 + (parseInt(v.listrik) || 0) * 50 + (parseInt(v.telkom) || 0) * 30 +
        (parseInt(v.irigasi) || 0) * 20 + (parseInt(v.jalan) || 0) * 60 + (parseInt(v.spbu) || 0) * 25 +
        (parseInt(l.sawah) || 0) * 5 + (parseInt(l.ternak) || 0) * 2;

    let level = 'LOW';
    if (score > 1000) level = 'CRITICAL';
    else if (score > 500) level = 'HIGH';
    else if (score > 200) level = 'MEDIUM';

    return { score, level };
};

// 1. Ambil Semua (Urut Prioritas)
exports.getIncidents = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, to_char(created_at, 'DD Mon YYYY, HH24:MI') as formatted_date 
            FROM incidents ORDER BY priority_score DESC, created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. Buat Kejadian Baru
exports.createIncident = async (req, res) => {
    const { title, disaster_type, latitude, longitude, status, region } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO incidents (title, disaster_type, latitude, longitude, status, region) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, disaster_type, latitude, longitude, status || 'reported', region]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 3. Update Status & Log
exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, note, updated_by } = req.body;
    try {
        await pool.query('UPDATE incidents SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
        await pool.query(
            `INSERT INTO incident_logs (incident_id, previous_status, new_status, note, updated_by)
             VALUES ($1, (SELECT status FROM incidents WHERE id=$1), $2, $3, $4)`,
            [id, status, note, updated_by]
        );
        const io = req.app.get('socketio');
        if (io) {
            // Trigger notifikasi tier silent untuk update status biasa
            io.emit('emergency_broadcast', {
                tier: 'SILENT',
                incident_id: id,
                title: 'Update Status',
                message: `Incident #${id} kini berstatus ${status}`,
                summary: note
            });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. Update Assessment (AI Scoring & Tiered Notification Trigger)
exports.updateAssessment = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const { score, level } = calculateAIScore(data);
    try {
        const result = await pool.query(
            `UPDATE incidents SET 
                kecamatan=$1, desa=$2, alamat_spesifik=$3, kondisi_mutakhir=$4, 
                dampak_manusia=$5, dampak_rumah=$6, dampak_fasum=$7, dampak_vital=$8, dampak_lingkungan=$9,
                priority_score=$10, priority_level=$11, status='assessment', updated_at=NOW() 
             WHERE id=$12 RETURNING *`,
            [data.kecamatan, data.desa, data.alamat_spesifik, data.kondisi_mutakhir, 
             JSON.stringify(data.dampak_manusia), JSON.stringify(data.dampak_rumah), 
             JSON.stringify(data.dampak_fasum), JSON.stringify(data.dampak_vital), 
             JSON.stringify(data.dampak_lingkungan), score, level, id]
        );

        const updatedIncident = result.rows[0];

        // LOGIKA PENENTUAN TIER NOTIFIKASI OTOMATIS BERDASARKAN AI
        const io = req.app.get('socketio');
        if (io) {
            let notificationTier = 'SILENT';
            if (score > 1000 || level === 'CRITICAL') notificationTier = 'CRITICAL';
            else if (score > 500 || level === 'HIGH') notificationTier = 'WARNING';

            io.emit('emergency_broadcast', {
                tier: notificationTier,
                incident_id: id,
                title: updatedIncident.title,
                region: updatedIncident.region,
                score: score,
                severity: level,
                summary: `Skor AI: ${score}. Butuh penanganan segera di ${updatedIncident.region}.`
            });
        }

        res.json(updatedIncident);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. Buat Instruksi (SP)
exports.createInstruction = async (req, res) => {
    const { incident_id, pj_nama, pic_lapangan, tim_anggota, armada_detail, peralatan_detail } = req.body;
    const nomor_sp = `SP/NU-JTG/${new Date().getFullYear()}/${incident_id}`;
    try {
        const result = await pool.query(
            `INSERT INTO incident_instructions (incident_id, nomor_sp, pj_nama, pic_lapangan, tim_anggota, armada_detail, peralatan_detail) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (incident_id) DO UPDATE SET pj_nama=$3, pic_lapangan=$4, tim_anggota=$5, armada_detail=$6, peralatan_detail=$7`,
            [incident_id, nomor_sp, pj_nama, pic_lapangan, tim_anggota, armada_detail, peralatan_detail]
        );
        await pool.query("UPDATE incidents SET status = 'commanded' WHERE id = $1", [incident_id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 6. Buat Aksi (Respon)
exports.createAction = async (req, res) => {
    const { incident_id, kluster, nama_kegiatan, jumlah_paket, penerima_manfaat } = req.body;
    try {
        await pool.query(
            `INSERT INTO incident_actions (incident_id, kluster, nama_kegiatan, jumlah_paket, penerima_manfaat) 
             VALUES ($1, $2, $3, $4, $5)`,
            [incident_id, kluster, nama_kegiatan, jumlah_paket, penerima_manfaat]
        );
        await pool.query("UPDATE incidents SET status = 'responded' WHERE id = $1", [incident_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 7. Laporan Terpadu (PDF)
exports.getFullReport = async (req, res) => {
    const { id } = req.params;
    try {
        const incident = await pool.query("SELECT * FROM incidents WHERE id = $1", [id]);
        const instruction = await pool.query("SELECT * FROM incident_instructions WHERE incident_id = $1", [id]);
        const actions = await pool.query("SELECT * FROM incident_actions WHERE incident_id = $1 ORDER BY created_at ASC", [id]);
        res.json({ incident: incident.rows[0], instruction: instruction.rows[0], actions: actions.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 8. Data Publik
exports.getPublicData = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM incidents WHERE status != 'reported' ORDER BY priority_score DESC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 9. Assign Resource Manual
exports.assignResources = async (req, res) => {
    const { incident_id, volunteer_id } = req.body;
    try {
        await pool.query("UPDATE volunteers SET status_tugas = 'sedang_bertugas' WHERE id = $1", [volunteer_id]);
        await pool.query("INSERT INTO incident_resources (incident_id, volunteer_id) VALUES ($1, $2)", [incident_id, volunteer_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};