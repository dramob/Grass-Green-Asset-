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
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  /**
   * Get a project by ID
   */
  getProject: async (projectId: string): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw error;
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
      throw error;
    }
  }
}



export default projectService