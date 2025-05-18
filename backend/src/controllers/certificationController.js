/**
 * Certification Controller
 * 
 * Handles project certification with token minting calculation
 */

const path = require('path');
const fs = require('fs').promises;
const { certify_project } = require('./LLMCertification');

/**
 * Certify a project and calculate token minting amount
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const certifyProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData || !projectData.companyName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project data. Company name is required.'
      });
    }

    // Prepare certification data
    const certificationData = {
      company_name: projectData.companyName,
      proponent: projectData.companyName,
      description: projectData.description || '',
      sdg_claims: (projectData.sdgClaims || []).map(claim => ({
        sdg_id: claim.sdgId,
        justification: claim.justification
      }))
    };

    console.log('Certifying project:', JSON.stringify(certificationData, null, 2));

    // Call the certification function
    const result = await certify_project(certificationData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Certification failed'
      });
    }

    // Transform the certification data into the expected format
    const transformedResults = transformCertificationResult(result, projectData);

    return res.status(200).json(transformedResults);
  } catch (error) {
    console.error('Certification error:', error);
    return res.status(500).json({
      success: false,
      message: `Certification failed: ${error.message}`
    });
  }
};

/**
 * Transform certification result to match the frontend expected format
 * 
 * @param {Object} certificationResult - Raw certification result
 * @param {Object} projectData - Original project data
 * @returns {Object} Transformed result
 */
function transformCertificationResult(certificationResult, projectData) {
  const { data } = certificationResult;

  if (!data) {
    return {
      success: false,
      message: 'Invalid certification result'
    };
  }

  // Extract SDG verification details
  const sdgResults = (data.SDG_Verifications || []).map(item => ({
    sdgId: parseInt(item.sdg.replace('SDG', '').trim(), 10) || 0,
    verificationScore: item.score * 10, // Scale to 0-100
    confidenceLevel: getConfidenceLevel(item.score),
    evidenceFound: item.score > 0,
    evidenceSummary: item.justification || '',
    sources: data.Credible_Sources || []
  }));

  // Calculate total score (average of all SDG scores)
  const totalScore = sdgResults.length > 0
    ? Math.round(sdgResults.reduce((sum, r) => sum + r.verificationScore, 0) / sdgResults.length)
    : 0;

  return {
    projectId: `cert_${Date.now().toString(36)}`,
    companyName: projectData.companyName,
    totalScore,
    verificationDate: new Date().toISOString(),
    results: sdgResults,
    tokenAmount: data['Tokens to Mint'] || 0,
    geometricMeanScore: data['Geometric Mean Score'] || 0,
    emissionReductions: data['Estimated Annual Emission Reductions'] || 0,
    industry: data.Industry || '',
    credibleSources: data.Credible_Sources || []
  };
}

/**
 * Get confidence level based on score
 * 
 * @param {number} score - Score (0-10)
 * @returns {string} Confidence level
 */
function getConfidenceLevel(score) {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

module.exports = {
  certifyProject
};