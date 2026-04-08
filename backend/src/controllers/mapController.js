const pool = require('../config/database')

exports.commandMap = async (req, res) => {

  const incidents = await pool.query(`
    SELECT id,title,disaster_type,latitude,longitude,status
    FROM incidents
  `)

  const volunteers = await pool.query(`
    SELECT v.id,v.name,l.latitude,l.longitude
    FROM volunteers v
    JOIN volunteer_locations l
    ON v.id=l.volunteer_id
  `)

  const warehouses = await pool.query(`
    SELECT * FROM warehouses
  `)

  const posts = await pool.query(`
    SELECT * FROM command_posts
  `)

  res.json({
    incidents: incidents.rows,
    volunteers: volunteers.rows,
    warehouses: warehouses.rows,
    posts: posts.rows
  })
}