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
      });
      
      const data = await handleResponse(response);
      return data.data || data;
    } catch (error) {
      console.error('Error verifying SDG claims:', error);
      throw error;
    }
  },

  /**
   * Get verification result by ID
   */
  getVerificationResult: async (projectId: string): Promise<ProjectVerification> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/${projectId}`);
      const data = await handleResponse(response);
      return data.data || data;
    } catch (error) {
      console.error('Error fetching verification result:', error);
      throw error;
    }
  }
}


export default { verificationApi }