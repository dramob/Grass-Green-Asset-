/**
 * Project Repository
 * 
 * Handles storage and retrieval of projects with their token information
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ProjectRepository {
  constructor(storageDir = path.join(process.cwd(), 'data', 'projects')) {
    this.storageDir = storageDir;
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`Project repository initialized at ${this.storageDir}`);
    } catch (error) {
      console.error('Failed to initialize project repository:', error);
    }
  }

  /**
   * Generate a unique project ID
   * @returns {string} A new project ID
   */
  generateProjectId() {
    return `project_${crypto.randomBytes(4).toString('hex')}_${Date.now().toString(36)}`;
  }

  /**
   * Save a project to storage
   * @param {Object} project - The project data
   * @returns {Promise<Object>} The saved project with ID
   */
  async saveProject(project) {
    try {
      // Generate ID if it doesn't exist
      if (!project.id) {
        project.id = this.generateProjectId();
      }
      
      // Add timestamps
      const now = new Date().toISOString();
      if (!project.createdAt) {
        project.createdAt = now;
      }
      project.updatedAt = now;
      
      // Create file path
      const filePath = path.join(this.storageDir, `${project.id}.json`);
      
      // Write to file
      await fs.writeFile(filePath, JSON.stringify(project, null, 2));
      
      return project;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  /**
   * Get a project by ID
   * @param {string} projectId - The project ID
   * @returns {Promise<Object|null>} The project data or null if not found
   */
  async getProjectById(projectId) {
    try {
      const filePath = path.join(this.storageDir, `${projectId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error(`Error reading project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get all projects
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of projects
   */
  async getAllProjects(filters = {}) {
    try {
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const projects = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = path.join(this.storageDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
          } catch (error) {
            console.error(`Error reading file ${file}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values and apply filters
      let filteredProjects = projects.filter(p => p !== null);
      
      // Apply filters
      if (filters.status) {
        filteredProjects = filteredProjects.filter(p => p.status === filters.status);
      }
      
      if (filters.companyName) {
        filteredProjects = filteredProjects.filter(p => 
          p.companyName && p.companyName.toLowerCase().includes(filters.companyName.toLowerCase())
        );
      }
      
      if (filters.hasTokens) {
        filteredProjects = filteredProjects.filter(p => 
          p.tokenInfo && p.tokenInfo.issuanceId && p.tokenInfo.availableSupply > 0
        );
      }
      
      // Sort by creation date (newest first)
      filteredProjects.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      
      return filteredProjects;
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   * @param {string} projectId - The project ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteProject(projectId) {
    try {
      const filePath = path.join(this.storageDir, `${projectId}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      console.error(`Error deleting project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Update token information for a project
   * @param {string} projectId - The project ID
   * @param {Object} tokenInfo - Token information
   * @returns {Promise<Object|null>} Updated project or null if not found
   */
  async updateProjectTokenInfo(projectId, tokenInfo) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        return null;
      }
      
      project.tokenInfo = {
        ...project.tokenInfo,
        ...tokenInfo,
        updatedAt: new Date().toISOString()
      };
      
      return await this.saveProject(project);
    } catch (error) {
      console.error(`Error updating token info for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Update project token available supply
   * @param {string} projectId - The project ID
   * @param {number} amount - Amount to change (negative for decreasing)
   * @returns {Promise<Object|null>} Updated project or null if not found or insufficient supply
   */
  async updateTokenSupply(projectId, amount) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project || !project.tokenInfo) {
        return null;
      }
      
      const currentSupply = project.tokenInfo.availableSupply || 0;
      const newSupply = currentSupply + amount;
      
      // Check if there's enough supply for decrease
      if (newSupply < 0) {
        throw new Error('Insufficient token supply');
      }
      
      project.tokenInfo.availableSupply = newSupply;
      project.tokenInfo.updatedAt = new Date().toISOString();
      
      // Track transaction in history
      if (!project.tokenInfo.transactions) {
        project.tokenInfo.transactions = [];
      }
      
      project.tokenInfo.transactions.push({
        id: crypto.randomBytes(4).toString('hex'),
        type: amount > 0 ? 'mint' : 'purchase',
        amount: Math.abs(amount),
        timestamp: new Date().toISOString()
      });
      
      return await this.saveProject(project);
    } catch (error) {
      console.error(`Error updating token supply for project ${projectId}:`, error);
      throw error;
    }
  }
}

module.exports = ProjectRepository;