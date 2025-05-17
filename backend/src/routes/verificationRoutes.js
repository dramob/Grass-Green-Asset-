/**
 * Verification Routes
 * 
 * Defines API routes for SDG verification
 * This is a placeholder for the actual implementation
 */

const express = require('express')
const router = express.Router()
const verificationController = require('../controllers/verificationController')

// POST /api/verification - Verify SDG claims
router.post('/', verificationController.verifyClaims)

// GET /api/verification/:id - Get verification result by ID
router.get('/:id', verificationController.getVerificationResult)

module.exports = router