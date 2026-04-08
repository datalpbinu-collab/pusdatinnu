const pool = require('../config/database')

exports.createReport = async (req, res) => {
  try {

    const {
      reporter_name,
      reporter_phone,
      disaster_type,
      description,
      latitude,
      longitude
    } = req.body

    const result = await pool.query(
      `INSERT INTO reports
      (reporter_name, reporter_phone, disaster_type, description, latitude, longitude)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        reporter_name,
        reporter_phone,
        disaster_type,
        description,
        latitude,
        longitude
      ]
    )

    res.json(result.rows[0])

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.getReports = async (req, res) => {

  const result = await pool.query(
    `SELECT * FROM reports
     ORDER BY created_at DESC`
  )

  res.json(result.rows)
}

const validateWithAI = (report, sensors) => {
    // Cari sensor terdekat dengan lokasi laporan
    const relatedSensor = sensors.find(s => s.location === report.city_district);
    
    if (relatedSensor && relatedSensor.status === 'SIAGA 1' && report.disaster_type === 'Banjir') {
        return { valid: true, confidence: "98%", note: "AI Verified: Data Sinkron dengan Sensor EWS" };
    }
    return { valid: false, confidence: "45%", note: "AI Pending: Butuh Verifikasi Manual" };
};