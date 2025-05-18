/**
 * Project Controller
 * 
 * Handles project submission, listing, and purchasing
 */

const ProjectRepository = require('../services/storage/project_repository');
const TokenizationService = require('../services/xrpl/tokenizationService');
const xrpl = require('xrpl');

// Initialize services
const projectRepo = new ProjectRepository();
const tokenService = new TokenizationService();

/**
 * Submit a new green asset project
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData.companyName || !projectData.projectName || !projectData.sdgClaims || !projectData.description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required project data. Company name, project name, SDG claims, and description are required.'
      });
    }
    
    // Check if there are SDG claims
    const activeSdgClaims = projectData.sdgClaims.filter(claim => claim.checked);
    if (activeSdgClaims.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one SDG claim must be selected'
      });
    }
    
    // Format the project data for storage
    const project = {
      companyName: projectData.companyName,
      projectName: projectData.projectName,
      description: projectData.description,
      sdgClaims: projectData.sdgClaims,
      status: 'pending_verification', // Initial status before verification
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save the project
    const savedProject = await projectRepo.saveProject(project);
    
    // Return the project details
    return res.status(201).json({
      success: true,
      message: 'Project submitted successfully, pending verification',
      projectId: savedProject.id,
      project: savedProject
    });
  } catch (error) {
    console.error('Error submitting project:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to submit project: ${error.message}`
    });
  }
};

/**
 * Get all projects with optional filters
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjects = async (req, res) => {
  try {
    const { status, companyName, hasTokens } = req.query;
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (companyName) filters.companyName = companyName;
    if (hasTokens === 'true') filters.hasTokens = true;
    
    // Get projects
    const projects = await projectRepo.getAllProjects(filters);
    
    return res.status(200).json({
      success: true,
      count: projects.length,
      projects: projects
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve projects: ${error.message}`
    });
  }
};

/**
 * Get a project by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // Get the project
    const project = await projectRepo.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found`
      });
    }
    
    return res.status(200).json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error(`Error getting project ${req.params.projectId}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve project: ${error.message}`
    });
  }
};

/**
 * Verify a project and create tokens
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { walletSeed, verificationResults, tokenAmount } = req.body;
    
    if (!projectId || !walletSeed || !verificationResults || !tokenAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data. Project ID, wallet seed, verification results, and token amount are required.'
      });
    }
    
    // Get the project
    const project = await projectRepo.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found`
      });
    }
    
    // Create issuer wallet from seed
    const issuerWallet = xrpl.Wallet.fromSeed(walletSeed);
    
    // Update project with verification results
    project.verificationResults = verificationResults;
    project.status = 'verified';
    project.updatedAt = new Date().toISOString();
    
    // Prepare token data for issuance
    const tokenData = {
      name: project.projectName,
      description: project.description,
      company: project.companyName,
      projectId: project.id,
      sdgs: project.sdgClaims.filter(c => c.checked).map(c => c.sdgId),
      verificationScore: verificationResults.totalScore || 0,
      maximumAmount: tokenAmount.toString(),
      tokenPrice: verificationResults.tokenPrice || 1
    };
    
    // Create token issuance
    const tokenResult = await tokenService.createGreenAssetToken(tokenData, issuerWallet);
    
    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        message: tokenResult.error || 'Token creation failed'
      });
    }
    
    // Update project with token information
    project.tokenInfo = {
      issuanceId: tokenResult.issuanceID,
      issuerAddress: tokenResult.issuerWallet,
      totalSupply: tokenResult.totalSupply,
      availableSupply: tokenResult.availableSupply,
      tokenPrice: tokenResult.tokenPrice,
      createdAt: new Date().toISOString()
    };
    
    // Save updated project
    const savedProject = await projectRepo.saveProject(project);
    
    return res.status(200).json({
      success: true,
      message: 'Project verified and tokens created successfully',
      project: savedProject,
      tokenInfo: project.tokenInfo
    });
  } catch (error) {
    console.error(`Error verifying project ${req.params.projectId}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to verify project: ${error.message}`
    });
  }
};

/**
 * Purchase tokens from a project
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const purchaseTokens = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { buyerSeed, issuerSeed, amount } = req.body;
    
    if (!projectId || !buyerSeed || !issuerSeed || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data. Project ID, buyer wallet seed, issuer wallet seed, and amount are required.'
      });
    }
    
    // Get the project
    const project = await projectRepo.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found`
      });
    }
    
    // Check if the project has tokens
    if (!project.tokenInfo || !project.tokenInfo.issuanceId) {
      return res.status(400).json({
        success: false,
        message: 'This project does not have tokens available for purchase'
      });
    }
    
    // Check if there are enough tokens available
    if (project.tokenInfo.availableSupply < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tokens available. Requested: ${amount}, Available: ${project.tokenInfo.availableSupply}`
      });
    }
    
    // Get current token price from oracle
    try {
      // Fetch price from the Oracle API
      const oracleUrl = process.env.ORACLE_API_URL || 'http://localhost:3000/api/oracle/price';
      const oraclePriceResponse = await fetch(oracleUrl);
      const oracleData = await oraclePriceResponse.json();
      
      // Check if we got a valid price
      if (!oracleData.success || !oracleData.price_xrp) {
        console.warn('Failed to get oracle price, using default token price');
      } else {
        // Store the current price with the transaction
        const currentPriceInfo = {
          price_xrp: oracleData.price_xrp,
          price_usd: oracleData.price_usd,
          xrp_usd_rate: oracleData.xrp_usd_rate,
          timestamp: oracleData.timestamp
        };
        
        // Update the project's token price information
        if (!project.tokenInfo.priceHistory) {
          project.tokenInfo.priceHistory = [];
        }
        
        // Add to price history
        project.tokenInfo.priceHistory.push(currentPriceInfo);
        
        // Keep only last 10 prices in project record
        if (project.tokenInfo.priceHistory.length > 10) {
          project.tokenInfo.priceHistory = project.tokenInfo.priceHistory.slice(-10);
        }
        
        // Update current price
        project.tokenInfo.currentPrice = currentPriceInfo;
        await projectRepo.saveProject(project);
        
        console.log(`Token price from oracle: ${oracleData.price_xrp} XRP (${oracleData.price_usd} USD)`);
      }
    } catch (priceError) {
      console.warn('Error fetching oracle price:', priceError.message);
      // Continue with purchase using default price
    }
    
    // Create wallets from seeds
    const buyerWallet = xrpl.Wallet.fromSeed(buyerSeed);
    const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);
    
    // Execute the purchase
    const purchaseResult = await tokenService.purchaseTokens(
      buyerWallet,
      project.tokenInfo.issuanceId,
      issuerWallet,
      amount
    );
    
    if (!purchaseResult.success) {
      return res.status(400).json({
        success: false,
        message: purchaseResult.error || 'Token purchase failed'
      });
    }
    
    // Update available supply
    await projectRepo.updateTokenSupply(projectId, -amount);
    
    // Get updated project with token price info
    const updatedProject = await projectRepo.getProjectById(projectId);
    
    // Include price information in the response
    let priceInfo = null;
    if (updatedProject.tokenInfo.currentPrice) {
      priceInfo = {
        pricePerTokenXrp: updatedProject.tokenInfo.currentPrice.price_xrp,
        pricePerTokenUsd: updatedProject.tokenInfo.currentPrice.price_usd,
        totalPriceXrp: updatedProject.tokenInfo.currentPrice.price_xrp * amount,
        totalPriceUsd: updatedProject.tokenInfo.currentPrice.price_usd * amount
      };
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tokens purchased successfully',
      amount: amount,
      remainingSupply: updatedProject.tokenInfo.availableSupply,
      priceInfo: priceInfo,
      purchaseDetails: purchaseResult
    });
  } catch (error) {
    console.error(`Error purchasing tokens for project ${req.params.projectId}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to purchase tokens: ${error.message}`
    });
  }
};

module.exports = {
  submitProject,
  getProjects,
  getProjectById,
  verifyProject,
  purchaseTokens
};