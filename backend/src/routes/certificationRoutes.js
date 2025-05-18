/**
 * Certification Routes
 * 
 * Handles API routes for project certification
 */

const express = require('express');
const router = express.Router();
const { certifyProject } = require('../controllers/certificationController');

// POST /api/certification - Certify a project and calculate tokens
router.post('/', certifyProject);

module.exports = router;