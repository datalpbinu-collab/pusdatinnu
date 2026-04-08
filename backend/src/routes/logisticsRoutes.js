const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logistics_controller'); // Perhatikan underscore jika Anda menggunakan nama itu

router.get('/', logisticsController.getRequests);
router.post('/', logisticsController.createRequest);
router.patch('/:id/approve', logisticsController.approveRequest);

module.exports = router;