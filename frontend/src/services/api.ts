/**
 * API service for interacting with the backend
 */

import { SDGClaim, ProjectVerification } from '../types/sdg'

// API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Helper for handling API response
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(
      errorData?.message || `API error: ${response.status} ${response.statusText}`
    )
  }
  return response.json()
}

/**
 * API service for verification endpoints
 */
export const verificationApi = {
  /**
   * Verify SDG claims for a project
   */
  verifySDGClaims: async (
    companyName: string,
    projectName: string,
    sdgClaims: SDGClaim[]
  ): Promise<ProjectVerification> => {
    try {
      // Use mock data when API isn't available or VITE_ENABLE_MOCK_DATA is true
      if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        console.log('Using mock data for verification')
        return generateMockVerificationData(companyName, projectName, sdgClaims)
      }

      const response = await fetch(`${API_BASE_URL}/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          projectName,
          sdgClaims: sdgClaims.map(claim => ({
            sdgId: claim.sdgId,
            checked: claim.checked,
            justification: claim.justification
          }))
        })
      })
      
      const data = await handleResponse(response)
      return data.data || data
    } catch (error) {
      console.error('Error verifying SDG claims:', error)
      // Fallback to mock data on error
      return generateMockVerificationData(companyName, projectName, sdgClaims)
    }
  },

  /**
   * Get verification result by ID
   */
  getVerificationResult: async (projectId: string): Promise<ProjectVerification> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/${projectId}`)
      const data = await handleResponse(response)
      return data.data || data
    } catch (error) {
      console.error('Error fetching verification result:', error)
      throw error
    }
  }
}

/**
 * Generate mock verification data for development/testing
 */
function generateMockVerificationData(
  companyName: string,
  projectName: string,
  sdgClaims: SDGClaim[]
): ProjectVerification {
  const activeClaims = sdgClaims.filter(claim => claim.checked)
  
  const results = activeClaims.map(claim => {
    // Generate a random score between 60 and 95
    const score = Math.floor(Math.random() * 36) + 60
    
    return {
      sdgId: claim.sdgId,
      verificationScore: score,
      confidenceLevel: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
      evidenceFound: true,
      evidenceSummary: `[Mock] Analysis of ${companyName}'s sustainability initiatives suggests ${score}% alignment with their SDG claim: "${claim.justification}"`,
      sources: [
        `https://example.com/companies/${encodeURIComponent(companyName.toLowerCase())}/sustainability`,
        `https://example.com/sdg-database/${claim.sdgId}`,
        `https://example.com/sustainability-reports/${encodeURIComponent(companyName.toLowerCase())}`
      ]
    }
  })
  
  const totalScore = results.length 
    ? Math.floor(results.reduce((sum, r) => sum + r.verificationScore, 0) / results.length) 
    : 0
  
  return {
    projectId: `mock_${Date.now().toString(36)}`,
    companyName,
    totalScore,
    verificationDate: new Date(),
    results
  }
}

export default { verificationApi }