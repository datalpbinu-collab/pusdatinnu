const express = require('express')
const router = express.Router()

const reportController = require('../controllers/reportController')

router.get('/', reportController.getReports)

router.post('/', reportController.createReport)

module.exports = router