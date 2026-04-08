const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// --- DAFTAR PINTU (ROUTES) ---
router.get('/', incidentController.getIncidents);
router.post('/', incidentController.createIncident);
router.get('/public', incidentController.getPublicData);

router.patch('/:id/status', incidentController.updateStatus);
router.patch('/:id/assessment', incidentController.updateAssessment);

router.post('/instructions', incidentController.createInstruction);
router.post('/actions', incidentController.createAction);
router.post('/assign-resources', incidentController.assignResources);

router.get('/:id/full-report', incidentController.getFullReport);

module.exports = router;