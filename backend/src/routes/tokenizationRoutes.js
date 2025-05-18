/**
 * Tokenization Routes
 * 
 * Defines API routes for MP Token issuance and management
 */

const express = require('express');
const router = express.Router();
const tokenizationController = require('../controllers/tokenizationController');

// POST /api/tokenization/issue - Create a new token issuance
router.post('/issue', tokenizationController.createTokenIssuance);

// POST /api/tokenization/authorize - Authorize a holder for a token
router.post('/authorize', tokenizationController.authorizeTokenHolder);

// POST /api/tokenization/mint - Mint tokens to a holder
router.post('/mint', tokenizationController.mintTokens);

// GET /api/tokenization/holdings/:address - Get token holdings for an account
router.get('/holdings/:address', tokenizationController.getTokenHoldings);

// GET /api/tokenization/holdings/:address/:issuanceID - Get specific token holdings
router.get('/holdings/:address/:issuanceID', tokenizationController.getTokenHoldings);

module.exports = router;