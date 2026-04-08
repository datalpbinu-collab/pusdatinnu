const pool = require('../config/database');

// PCNU Mengajukan Permintaan
exports.createRequest = async (req, res) => {
    const { incident_id, inventory_id, item_name, quantity, region } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO logistics_requests (incident_id, inventory_id, item_name, quantity_requested, requester_region, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
            [incident_id, inventory_id, item_name, quantity, region]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Mengambil Semua Permintaan
exports.getRequests = async (req, res) => {
    const { role, region } = req.query;
    try {
        let query = `
            SELECT r.*, i.title as incident_title 
            FROM logistics_requests r 
            JOIN incidents i ON r.incident_id = i.id
        `;
        let params = [];

        if (role === 'PCNU') {
            query += " WHERE r.requester_region = $1";
            params.push(region);
        }

        const result = await pool.query(query + " ORDER BY r.created_at DESC", params);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// PWNU Memberikan Persetujuan (Approval)
exports.approveRequest = async (req, res) => {
    const { id } = req.params;
    const { status, admin_note } = req.body; 
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updatedReq = await client.query(
            "UPDATE logistics_requests SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
            [status, admin_note, id]
        );
        if (status === 'approved') {
            const request = updatedReq.rows[0];
            await client.query(
                "UPDATE inventory SET available_quantity = available_quantity - $1 WHERE id = $2",
                [request.quantity_requested, request.inventory_id]
            );
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
};