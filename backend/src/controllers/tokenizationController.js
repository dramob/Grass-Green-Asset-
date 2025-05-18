/**
 * Tokenization Controller
 * 
 * Handles MP Token issuance and minting for green assets
 */

const xrpl = require('xrpl');
const TokenizationService = require('../services/xrpl/tokenizationService');

// Initialize tokenization service
const tokenService = new TokenizationService();

/**
 * Create a new MP Token issuance for a green asset
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTokenIssuance = async (req, res) => {
  try {
    const { projectData, walletSeed } = req.body;
    
    if (!projectData || !walletSeed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Project data and wallet seed are required.'
      });
    }

    // Create wallet from seed
    const issuerWallet = xrpl.Wallet.fromSeed(walletSeed);
    
    // Prepare token data
    const tokenData = {
      name: projectData.companyName,
      description: projectData.description || '',
      company: projectData.companyName,
      sdgs: projectData.results.map(r => r.sdgId),
      verificationScore: projectData.totalScore,
      maximumAmount: projectData.tokenAmount.toString(),
      assetScale: 0,
      transferFee: 0
    };

    // Create token
    const result = await tokenService.createGreenAssetToken(tokenData, issuerWallet);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Token creation failed'
      });
    }

    return res.status(200).json({
      success: true,
      projectId: projectData.projectId,
      issuanceID: result.issuanceID,
      issuerAddress: result.issuerWallet,
      tokenAmount: projectData.tokenAmount,
      name: tokenData.name,
      description: tokenData.description,
      verificationScore: tokenData.verificationScore
    });
  } catch (error) {
    console.error('Tokenization error:', error);
    return res.status(500).json({
      success: false,
      message: `Tokenization failed: ${error.message}`
    });
  }
};

/**
 * Authorize a holder for an MPT
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const authorizeTokenHolder = async (req, res) => {
  try {
    const { issuerSeed, holderAddress, issuanceID } = req.body;
    
    if (!issuerSeed || !holderAddress || !issuanceID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Issuer seed, holder address, and issuance ID are required.'
      });
    }

    // Create wallet from seed
    const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);
    
    // Authorize holder
    await tokenService.authorizeHolder(issuerWallet, holderAddress, issuanceID);
    
    return res.status(200).json({
      success: true,
      message: 'Holder authorized successfully',
      holderAddress,
      issuanceID
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: `Authorization failed: ${error.message}`
    });
  }
};

/**
 * Mint tokens to a holder
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const mintTokens = async (req, res) => {
  try {
    const { issuerSeed, holderAddress, issuanceID, amount } = req.body;
    
    if (!issuerSeed || !holderAddress || !issuanceID || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Issuer seed, holder address, issuance ID, and amount are required.'
      });
    }

    // Create wallet from seed
    const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);
    
    // Mint tokens
    const result = await tokenService.mintToHolder(issuerWallet, holderAddress, issuanceID, amount);
    
    return res.status(200).json({
      success: true,
      message: 'Tokens minted successfully',
      holderAddress,
      issuanceID,
      amount,
      txHash: result?.result?.hash || 'unknown'
    });
  } catch (error) {
    console.error('Minting error:', error);
    return res.status(500).json({
      success: false,
      message: `Minting failed: ${error.message}`
    });
  }
};

/**
 * Get token holdings for an account
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTokenHoldings = async (req, res) => {
  try {
    const { address, issuanceID } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Account address is required.'
      });
    }

    // Get holdings
    const result = await tokenService.getHoldings(address, issuanceID);
    
    return res.status(200).json({
      success: true,
      address,
      holdings: result?.result?.node || {}
    });
  } catch (error) {
    console.error('Get holdings error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get holdings: ${error.message}`
    });
  }
};

module.exports = {
  createTokenIssuance,
  authorizeTokenHolder,
  mintTokens,
  getTokenHoldings
};