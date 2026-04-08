// backend/src/controllers/volunteerController.js
exports.getNearby = async (req, res) => {
    const { lat, lng, expertise } = req.query;
    try {
        const result = await pool.query(
            `SELECT id, full_name, expertise, status_tugas,
             (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) AS distance
             FROM volunteers 
             WHERE status_tugas = 'standby' AND expertise::text LIKE $3
             ORDER BY distance ASC`,
            [lat, lng, `%${expertise}%`]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Tambahkan di backend/src/controllers/volunteerController.js

exports.assignTask = async (req, res) => {
    const { volunteer_id, incident_id, distance } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update status relawan menjadi 'sedang_bertugas'
        await client.query(
            "UPDATE volunteers SET status_tugas = 'sedang_bertugas' WHERE id = $1",
            [volunteer_id]
        );

        // 2. Masukkan ke tabel incident_resources sebagai bukti penugasan
        await client.query(
            `INSERT INTO incident_resources (incident_id, volunteer_id, quantity_deployed, note) 
             VALUES ($1, $2, 1, $3)`,
            [incident_id, volunteer_id, `Ditugaskan via Radar Zonasi (Jarak: ${distance} KM)`]
        );

        await client.query('COMMIT');

        // 3. Kirim notifikasi real-time via Socket.io
        const io = req.app.get('socketio');
        io.emit('status_updated', { 
            id: incident_id, 
            status: 'commanded', 
            note: `Personil ID-${volunteer_id} dikerahkan ke lokasi.` 
        });

        res.json({ success: true, message: "Relawan berhasil ditugaskan!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// backend/src/controllers/volunteerController.js

// Ambil tugas aktif untuk 1 relawan
exports.getMyTask = async (req, res) => {
    const { id } = req.params; // ID Relawan
    try {
        const result = await pool.query(
            `SELECT r.*, i.title, i.disaster_type, i.latitude as inc_lat, i.longitude as inc_lng 
             FROM incident_resources r
             JOIN incidents i ON r.incident_id = i.id
             WHERE r.volunteer_id = $1 
             ORDER BY r.dispatched_at DESC LIMIT 1`,
            [id]
        );
        res.json(result.rows[0] || { message: "Tidak ada tugas aktif" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSmartRecommendation = async (req, res) => {
    const { lat, lng, disaster_type } = req.query;
    try {
        const result = await pool.query(
            `SELECT id, full_name, expertise, 
             -- Hitung skor kecocokan (Skill + Distance)
             ( (CASE WHEN expertise::text LIKE $1 THEN 50 ELSE 0 END) + 
               (CASE WHEN blood_type = 'O' THEN 10 ELSE 0 END) - 
               ((6371 * acos(cos(radians($2)) * cos(radians(latitude)) * cos(radians(longitude) - radians($3)) + sin(radians($2)) * sin(radians(latitude)))) * 2) 
             ) as match_score,
             (6371 * acos(cos(radians($2)) * cos(radians(latitude)) * cos(radians(longitude) - radians($3)) + sin(radians($2)) * sin(radians(latitude)))) AS distance
             FROM volunteers 
             WHERE status_tugas = 'standby'
             ORDER BY match_score DESC LIMIT 5`,
            [`%${disaster_type}%`, lat, lng]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// backend/src/controllers/volunteerController.js

// 1. Relawan Mengajukan Diri & Jam Kesediaan
exports.applyForDuty = async (req, res) => {
    const { volunteer_id, incident_id, available_from, available_until, note } = req.body;
    try {
        await pool.query(
            `INSERT INTO volunteer_deployments (volunteer_id, incident_id, available_from, available_until, note) 
             VALUES ($1, $2, $3, $4, $5)`,
            [volunteer_id, incident_id, available_from, available_until, note]
        );
        res.json({ success: true, message: "Aplikasi dikirim ke PCNU." });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. Approval Berjenjang (PCNU & PWNU)
exports.approveDeployment = async (req, res) => {
    const { deployment_id, role, status } = req.body; // role: PCNU/PWNU, status: approved/rejected
    
    try {
        let nextStatus = (role === 'PCNU') ? 'approved_pcnu' : 'approved_pwnu';
        if (status === 'rejected') nextStatus = 'rejected';

        await pool.query(
            "UPDATE volunteer_deployments SET status = $1, updated_at = NOW() WHERE id = $2",
            [nextStatus, deployment_id]
        );

        // Jika sudah approved_pwnu, otomatis jadi on_duty
        if (nextStatus === 'approved_pwnu') {
            await pool.query("UPDATE volunteer_deployments SET status = 'on_duty' WHERE id = $1", [deployment_id]);
        }

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 3. AI Check Skill Shortage & Push Notif
exports.checkSkillGap = async (req, res) => {
    const { incident_id } = req.params;
    try {
        // Cari kebutuhan yang belum terpenuhi
        const gaps = await pool.query(
            "SELECT * FROM incident_skill_requirements WHERE incident_id = $1 AND status = 'open'",
            [incident_id]
        );

        if (gaps.rows.length > 0) {
            const io = req.app.get('socketio');
            gaps.rows.forEach(gap => {
                io.emit('skill_needed_broadcast', {
                    expertise: gap.expertise_required,
                    message: `DIBUTUHKAN SEGERA: ${gap.quantity_needed} personil ahli ${gap.expertise_required} di lokasi bencana.`
                });
            });
        }
        res.json(gaps.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};