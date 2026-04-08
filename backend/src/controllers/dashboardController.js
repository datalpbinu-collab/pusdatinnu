const pool = require('../config/database')

exports.summary = async (req, res) => {

  const incidents = await pool.query(
    `SELECT COUNT(*) FROM incidents`
  )

  const reports = await pool.query(
    `SELECT COUNT(*) FROM reports`
  )

  const volunteers = await pool.query(
    `SELECT COUNT(*) FROM volunteers`
  )

  res.json({
    total_incidents: incidents.rows[0].count,
    total_reports: reports.rows[0].count,
    total_volunteers: volunteers.rows[0].count
  })
}