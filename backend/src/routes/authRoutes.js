const express = require('express');
const router = express.Router();
// Memanggil file baru (auth_controller.js)
const authController = require('../controllers/auth_controller');

/**
 * @route   POST /api/auth/register
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 */
router.post('/login', authController.login);

module.exports = router;