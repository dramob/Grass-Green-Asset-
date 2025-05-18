/**
 * Project Service
 * 
 * Handles operations related to projects and listings
 */

import { ProjectFormData, Project, SDGClaim } from '../types'

export interface CertificationResult {
  projectId: string;
  companyName: string;
  totalScore: number;
  verificationDate: string;
  results: Array<{
    sdgId: number;
    verificationScore: number;
    confidenceLevel: string;
    evidenceFound: boolean;
    evidenceSummary: string;
    sources: string[];
  }>;
  tokenAmount: number;
  geometricMeanScore: number;
  emissionReductions: number;
  industry: string;
  credibleSources: string[];
}

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

export const projectService = {
  /**
   * Create a new project
   */
  createProject: async (projectData: ProjectFormData): Promise<Project> => {
    try {
      // Use mock mode if enabled
      if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        console.log('Using mock data for project creation')
        return generateMockProjectResponse(projectData)
      }
      
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: projectData.companyName,
          projectName: projectData.projectName,
          description: projectData.description,
          sdgClaims: projectData.sdgClaims
        })
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error creating project:', error)
      // Fall back to mock data on error
      return generateMockProjectResponse(projectData)
    }
  },
  
  /**
   * Get a project by ID
   */
  getProject: async (projectId: string): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)
      return handleResponse(response)
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error)
      throw error
    }
  },
  
  /**
   * List all projects, optionally filtered by status
   */
  listProjects: async (status?: string): Promise<Project[]> => {
    try {
      const url = new URL(`${API_BASE_URL}/projects`)
      if (status) {
        url.searchParams.append('status', status)
      }
      
      const response = await fetch(url.toString())
      const data = await handleResponse(response)
      return data.projects
    } catch (error) {
      console.error('Error listing projects:', error)
      return []
    }
  },
  
  /**
   * Delete a project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE'
      })
      await handleResponse(response)
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error)
      throw error
    }
  },
  
  /**
   * Update a project's status
   */
  updateProjectStatus: async (projectId: string, status: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      await handleResponse(response)
    } catch (error) {
      console.error(`Error updating project ${projectId} status:`, error)
      throw error
    }
  }
}

/**
 * Generate mock project response for development
 */
function generateMockProjectResponse(projectData: ProjectFormData): Project {
  return {
    id: `mock_${Math.random().toString(36).substring(2, 10)}`,
    companyName: projectData.companyName,
    projectName: projectData.projectName,
    description: projectData.description,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sdgClaims: projectData.sdgClaims
  },
  
  /**
   * Certify a project and calculate tokens to mint
   */
  certifyProject: async (
    companyName: string,
    projectName: string,
    description: string,
    sdgClaims: SDGClaim[]
  ): Promise<CertificationResult> => {
    try {
      // Use mock data when API isn't available or VITE_ENABLE_MOCK_DATA is true
      if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        console.log('Using mock data for certification');
        return generateMockCertificationData(companyName, projectName, sdgClaims);
      }

      const response = await fetch(`${API_BASE_URL}/certification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          projectName,
          description,
          sdgClaims
        })
      });
      
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      console.error('Error certifying project:', error);
      // Fallback to mock data on error
      return generateMockCertificationData(companyName, projectName, sdgClaims);
    }
  }
}

/**
 * Generate mock certification data for development/testing
 */
function generateMockCertificationData(
  companyName: string,
  projectName: string,
  sdgClaims: SDGClaim[]
): CertificationResult {
  const activeClaims = sdgClaims.filter(claim => claim.checked);
  
  const results = activeClaims.map(claim => {
    // Generate a random score between 60 and 95
    const score = Math.floor(Math.random() * 36) + 60;
    
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
    };
  });
  
  const totalScore = results.length 
    ? Math.floor(results.reduce((sum, r) => sum + r.verificationScore, 0) / results.length) 
    : 0;
  
  // Mock emission reductions and tokens to mint
  const emissionReductions = Math.floor(Math.random() * 20000) + 5000;
  const geometricMeanScore = totalScore / 10; // Scale to 0-10
  const tokenAmount = Math.round(emissionReductions * (geometricMeanScore / 10));
  
  return {
    projectId: `mock_${Date.now().toString(36)}`,
    companyName,
    totalScore,
    verificationDate: new Date().toISOString(),
    results,
    tokenAmount,
    geometricMeanScore,
    emissionReductions,
    industry: 'Renewable Energy',
    credibleSources: [
      'Company Sustainability Report',
      'UN Global Compact Database',
      'Industry ESG Analysis'
    ]
  };
}

export default projectService