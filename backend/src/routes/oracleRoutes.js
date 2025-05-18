/**
 * Oracle Routes
 * 
 * Defines API routes for token price discovery
 */

const express = require('express');
const router = express.Router();
const TokenizationService = require('../services/xrpl/tokenizationService');

// Initialize service
const tokenService = new TokenizationService();

// GET /api/oracle/price - Get current token price
router.get('/price', async (req, res) => {
  try {
    // Call tokenization service to get price from oracle
    const priceResult = await tokenService.getTokenPrice();
    return res.status(200).json(priceResult);
  } catch (error) {
    console.error('Error fetching oracle price:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get token price: ${error.message}`
    });
  }
});

// GET /api/oracle/xrpl - Get XRPL connection info
router.get('/xrpl', async (req, res) => {
  return res.status(200).json({
    success: true,
    network: process.env.XRPL_RPC_ENDPOINT || "wss://s.altnet.rippletest.net:51233",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;